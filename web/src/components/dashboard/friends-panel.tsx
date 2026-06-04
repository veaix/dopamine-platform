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

type FriendsMutationResponse = {
  ok?: boolean;
  friends?: FriendsData;
  error?: string;
  grantedServers?: number;
  grantedCoins?: number;
};

export function FriendsPanel({
  initial,
  ownedKeys,
  onEconomyRefresh,
}: {
  initial: FriendsData;
  ownedKeys: OwnedGiftKey[];
  /** After accepting a gift key — refresh coins/slots in dashboard */
  onEconomyRefresh?: () => void;
}) {
  const [data, setData] = useState(initial);
  const [nick, setNick] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const giftableKeys = useMemo(() => mapGiftableKeys(ownedKeys), [ownedKeys]);
  const [giftKeyByFriend, setGiftKeyByFriend] = useState<Record<string, string>>({});

  useEffect(() => {
    setData(initial);
  }, [initial]);

  function applyFriends(payload: { friends?: FriendsData }) {
    if (payload.friends) setData(payload.friends);
  }

  async function postFriends(
    url: string,
    body: Record<string, unknown>,
    pendingKey: string,
    onSuccess?: (d: FriendsMutationResponse) => void,
  ) {
    setError("");
    setMsg("");
    setPending(pendingKey);
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await r.json()) as FriendsMutationResponse;
      if (!r.ok) {
        setError(d.error ?? "Ошибка");
        return;
      }
      applyFriends(d);
      onSuccess?.(d);
    } catch {
      setError("Сеть недоступна");
    } finally {
      setPending(null);
    }
  }

  async function sendRequest() {
    await postFriends("/api/friends/request", { nickname: nick }, "request", () => {
      setMsg("Заявка отправлена");
      setNick("");
    });
  }

  async function respond(requestId: string, action: "accept" | "reject") {
    await postFriends(
      "/api/friends/respond",
      { requestId, action },
      `respond-${requestId}-${action}`,
      () => setMsg(action === "accept" ? "Добавлен в друзья" : "Заявка отклонена"),
    );
  }

  async function cancelRequest(requestId: string) {
    await postFriends("/api/friends/cancel", { requestId }, `cancel-${requestId}`, () =>
      setMsg("Заявка отменена"),
    );
  }

  async function removeFriend(userId: string) {
    if (!confirm("Удалить из друзей?")) return;
    await postFriends("/api/friends/remove", { userId }, `remove-${userId}`, () =>
      setMsg("Удалён из друзей"),
    );
  }

  async function sendGift(friendUserId: string) {
    const keyId = giftKeyByFriend[friendUserId];
    if (!keyId) {
      setError("Выберите ключ для подарка");
      return;
    }
    await postFriends(
      "/api/friends/gift-key",
      { keyId, friendUserId },
      `gift-${friendUserId}`,
      () => setMsg("Подарок отправлен — друг может принять или отклонить"),
    );
  }

  async function respondGift(giftId: string, action: "accept" | "reject") {
    await postFriends(
      "/api/friends/gift-key/respond",
      { giftId, action },
      `gift-respond-${giftId}-${action}`,
      (d) => {
        setMsg(action === "accept" ? "Подарок принят!" : "Подарок отклонён");
        if (action === "accept" && (d.grantedServers != null || d.grantedCoins != null)) {
          onEconomyRefresh?.();
        }
      },
    );
  }

  async function revokeGift(giftId: string) {
    await postFriends("/api/friends/gift-key/revoke", { giftId }, `gift-revoke-${giftId}`, () =>
      setMsg("Подарок отозван"),
    );
  }

  const busy = pending !== null;
  const { friends, incoming, outgoing, incomingGifts, outgoingGifts } = data;

  return (
    <div className="stack">
      <section className="card dash-panel">
        <h2>Добавить в друзья</h2>
        <div className="row">
          <input placeholder="Никнейм" value={nick} onChange={(e) => setNick(e.target.value)} />
          <button
            type="button"
            className="btn"
            disabled={!nick.trim() || busy}
            onClick={() => void sendRequest()}
          >
            {pending === "request" ? "…" : "Отправить заявку"}
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
                  <button
                    type="button"
                    className="btn sm"
                    disabled={busy}
                    onClick={() => void respondGift(g.giftId, "accept")}
                  >
                    {pending === `gift-respond-${g.giftId}-accept` ? "…" : "Принять"}
                  </button>
                  <button
                    type="button"
                    className="btn sm ghost"
                    disabled={busy}
                    onClick={() => void respondGift(g.giftId, "reject")}
                  >
                    {pending === `gift-respond-${g.giftId}-reject` ? "…" : "Отклонить"}
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
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={busy}
                  onClick={() => void revokeGift(g.giftId)}
                >
                  {pending === `gift-revoke-${g.giftId}` ? "…" : "Отозвать"}
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
                  <button
                    type="button"
                    className="btn sm"
                    disabled={busy}
                    onClick={() => void respond(r.requestId, "accept")}
                  >
                    {pending === `respond-${r.requestId}-accept` ? "…" : "Принять"}
                  </button>
                  <button
                    type="button"
                    className="btn sm ghost"
                    disabled={busy}
                    onClick={() => void respond(r.requestId, "reject")}
                  >
                    {pending === `respond-${r.requestId}-reject` ? "…" : "Отклонить"}
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
                <button
                  type="button"
                  className="btn sm ghost"
                  disabled={busy}
                  onClick={() => void cancelRequest(r.requestId)}
                >
                  {pending === `cancel-${r.requestId}` ? "…" : "Отменить"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card dash-panel">
        <h2>Мои друзья ({friends.length})</h2>
        {giftableKeys.length > 0 ? (
          <p className="muted">
            Можно подарить ключ ({giftableKeys.length} доступно) — выберите ключ и нажмите «Подарить»
          </p>
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
                        disabled={busy}
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
                      <button
                        type="button"
                        className="btn sm"
                        disabled={busy}
                        onClick={() => void sendGift(f.userId)}
                      >
                        {pending === `gift-${f.userId}` ? "…" : "Подарить"}
                      </button>
                    </div>
                  ) : null}
                  <div className="row">
                    <Link href={`/u/${f.nickname}`} className="btn sm secondary" prefetch={false}>
                      Профиль
                    </Link>
                    <button
                      type="button"
                      className="btn sm ghost danger-text"
                      disabled={busy}
                      onClick={() => void removeFriend(f.userId)}
                    >
                      {pending === `remove-${f.userId}` ? "…" : "Удалить"}
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
      <Link href={`/u/${nickname}`} prefetch={false}>
        {nickname}
      </Link>
    </div>
  );
}
