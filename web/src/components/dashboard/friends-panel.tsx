"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FriendsData } from "@/server/friends/bundle";
import type { OwnedGiftKey } from "@/server/keys/inventory";

function mapGiftableKeys(keys: { id: string; grantServers: number; giftStatus: string }[]) {
  const available = keys.filter((k) => k.giftStatus === "available");
  return available.map((k, i) => ({
    id: k.id,
    grantServers: k.grantServers,
    label: `Подарочный ключ #${available.length - i} · ${k.grantServers} серв.`,
  }));
}

export function FriendsPanel({
  initial,
  ownedKeys,
  onRefresh,
}: {
  initial: FriendsData;
  ownedKeys: OwnedGiftKey[];
  onRefresh: () => void;
}) {
  const [data, setData] = useState(initial);
  const [nick, setNick] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const giftableKeys = useMemo(() => mapGiftableKeys(ownedKeys), [ownedKeys]);
  const [giftKeyByFriend, setGiftKeyByFriend] = useState<Record<string, string>>({});

  useEffect(() => {
    setData(initial);
  }, [initial]);

  function reload() {
    void fetch("/api/friends/list")
      .then(async (r) => {
        const d = await r.json();
        if (r.ok) setData(d);
      })
      .catch(() => {});
  }

  async function sendRequest() {
    setError("");
    setMsg("");
    const r = await fetch("/api/friends/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nick }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? "Ошибка");
    else {
      setMsg("Заявка отправлена");
      setNick("");
      reload();
    }
  }

  async function respond(requestId: string, action: "accept" | "reject") {
    setError("");
    const r = await fetch("/api/friends/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error ?? "Ошибка");
      return;
    }
    onRefresh();
  }

  async function cancelRequest(requestId: string) {
    const r = await fetch("/api/friends/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? "Ошибка");
    else reload();
  }

  async function removeFriend(userId: string) {
    if (!confirm("Удалить из друзей?")) return;
    const r = await fetch("/api/friends/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? "Ошибка");
    else {
      setMsg("Удалён из друзей");
      reload();
    }
  }

  async function sendGift(friendUserId: string) {
    const keyId = giftKeyByFriend[friendUserId];
    if (!keyId) {
      setError("Выберите ключ для подарка");
      return;
    }
    setError("");
    const r = await fetch("/api/friends/gift-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyId, friendUserId }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? "Ошибка");
    else {
      setMsg("Подарок отправлен — друг может принять или отклонить");
      reload();
    }
  }

  async function respondGift(giftId: string, action: "accept" | "reject") {
    const r = await fetch("/api/friends/gift-key/respond", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId, action }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? "Ошибка");
    else {
      setMsg(action === "accept" ? "Подарок принят!" : "Подарок отклонён");
      reload();
    }
  }

  async function revokeGift(giftId: string) {
    const r = await fetch("/api/friends/gift-key/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftId }),
    });
    const d = await r.json();
    if (!r.ok) setError(d.error ?? "Ошибка");
    else {
      setMsg("Подарок отозван");
      reload();
    }
  }

  const { friends, incoming, outgoing, incomingGifts, outgoingGifts } = data;

  return (
    <div className="stack">
      <section className="card dash-panel">
        <h2>Добавить в друзья</h2>
        <div className="row">
          <input placeholder="Никнейм" value={nick} onChange={(e) => setNick(e.target.value)} />
          <button type="button" className="btn" disabled={!nick.trim()} onClick={() => void sendRequest()}>
            Отправить заявку
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {msg ? <p className="info">{msg}</p> : null}
      </section>

      {incomingGifts.length > 0 ? (
        <section className="card dash-panel">
          <h2>🎁 Входящие подарки ({incomingGifts.length})</h2>
          <ul className="dash-friend-list">
            {incomingGifts.map((g) => (
              <li key={g.giftId} className="dash-friend-item dash-gift-item">
                <FriendRow nickname={g.nickname} avatarUrl={g.avatarUrl} />
                <span className="muted">
                  ключ · {g.grantServers} сервер{g.grantCoins ? ` + ${g.grantCoins} 🪙` : ""}
                </span>
                <div className="row">
                  <button type="button" className="btn sm" onClick={() => void respondGift(g.giftId, "accept")}>
                    Принять
                  </button>
                  <button type="button" className="btn sm ghost" onClick={() => void respondGift(g.giftId, "reject")}>
                    Отклонить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {outgoingGifts.length > 0 ? (
        <section className="card dash-panel">
          <h2>Исходящие подарки ({outgoingGifts.length})</h2>
          <ul className="dash-friend-list">
            {outgoingGifts.map((g) => (
              <li key={g.giftId} className="dash-friend-item">
                <FriendRow nickname={g.nickname} avatarUrl={g.avatarUrl} />
                <span className="muted">ожидает ответа · {g.grantServers} сервер</span>
                <button type="button" className="btn sm ghost" onClick={() => void revokeGift(g.giftId)}>
                  Отозвать
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {incoming.length > 0 ? (
        <section className="card dash-panel">
          <h2>Входящие заявки ({incoming.length})</h2>
          <ul className="dash-friend-list">
            {incoming.map((r) => (
              <li key={r.requestId} className="dash-friend-item">
                <FriendRow nickname={r.nickname} avatarUrl={r.avatarUrl} />
                <div className="row">
                  <button type="button" className="btn sm" onClick={() => void respond(r.requestId, "accept")}>
                    Принять
                  </button>
                  <button type="button" className="btn sm ghost" onClick={() => void respond(r.requestId, "reject")}>
                    Отклонить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section className="card dash-panel">
          <h2>Исходящие заявки ({outgoing.length})</h2>
          <ul className="dash-friend-list">
            {outgoing.map((r) => (
              <li key={r.requestId} className="dash-friend-item">
                <FriendRow nickname={r.nickname} avatarUrl={r.avatarUrl} />
                <button type="button" className="btn sm ghost" onClick={() => void cancelRequest(r.requestId)}>
                  Отменить
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card dash-panel">
        <h2>Мои друзья ({friends.length})</h2>
        {giftableKeys.length > 0 ? (
          <p className="muted">Можно подарить ключ ({giftableKeys.length} доступно) — выберите ключ и нажмите «Подарить»</p>
        ) : (
          <p className="muted">Купите ключ в подарок во вкладке «Монеты и ключи», чтобы дарить друзьям</p>
        )}
        {friends.length === 0 ? (
          <p className="muted">Пока нет друзей — отправьте заявку по нику</p>
        ) : (
          <ul className="dash-friend-list">
            {friends.map((f) => (
              <li key={f.userId} className="dash-friend-item dash-friend-actions">
                <FriendRow nickname={f.nickname} avatarUrl={f.avatarUrl} />
                <div className="dash-friend-buttons">
                  {giftableKeys.length > 0 ? (
                    <div className="row">
                      <select
                        value={giftKeyByFriend[f.userId] ?? ""}
                        onChange={(e) =>
                          setGiftKeyByFriend((prev) => ({ ...prev, [f.userId]: e.target.value }))
                        }
                      >
                        <option value="">Ключ…</option>
                        {giftableKeys.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                      <button type="button" className="btn sm" onClick={() => void sendGift(f.userId)}>
                        Подарить
                      </button>
                    </div>
                  ) : null}
                  <div className="row">
                    <Link href={`/u/${f.nickname}`} className="btn sm secondary">
                      Профиль
                    </Link>
                    <button type="button" className="btn sm ghost danger-text" onClick={() => void removeFriend(f.userId)}>
                      Удалить
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FriendRow({ nickname, avatarUrl }: { nickname: string; avatarUrl: string | null }) {
  return (
    <div className="dash-friend-row">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="avatar sm" />
      ) : (
        <div className="avatar sm placeholder">{nickname[0]?.toUpperCase()}</div>
      )}
      <Link href={`/u/${nickname}`}>{nickname}</Link>
    </div>
  );
}
