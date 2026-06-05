"use client";

import { useEffect, useState } from "react";
import type { OwnedGiftKey } from "@/server/keys/inventory";
import type { TrialServerInfo } from "@/server/trial-server";
import { formatTrialRemainingMs } from "@/lib/trial-format";

const DEFAULT_GIFT_KEY_PRICE = 10;
const DEFAULT_SLOT_PRICE = 10;

type OwnedKey = {
  id: string;
  codePreview: string;
  grantServers: number;
  giftStatus: "available" | "pending_gift";
};

function mapKeys(keys: OwnedGiftKey[]): OwnedKey[] {
  return keys.map((k) => ({
    id: k.id,
    codePreview: k.codePreview,
    grantServers: k.grantServers,
    giftStatus: k.giftStatus,
  }));
}

export function EconomyPanel({
  coinsBalance,
  serverSlots,
  trial,
  creatorUnlimited = false,
  initialOwnedKeys,
  initialPromoCode = "",
  onUpdated,
}: {
  coinsBalance: number;
  serverSlots: number;
  trial: TrialServerInfo;
  creatorUnlimited?: boolean;
  initialOwnedKeys: OwnedGiftKey[];
  initialPromoCode?: string;
  onUpdated: () => void;
}) {
  const [promo, setPromo] = useState(initialPromoCode);
  const [key, setKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [ownedKeys, setOwnedKeys] = useState<OwnedKey[]>(() => mapKeys(initialOwnedKeys));
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [giftKeyPrice, setGiftKeyPrice] = useState(DEFAULT_GIFT_KEY_PRICE);
  const [slotPrice, setSlotPrice] = useState(DEFAULT_SLOT_PRICE);

  useEffect(() => {
    setOwnedKeys(mapKeys(initialOwnedKeys));
  }, [initialOwnedKeys]);

  useEffect(() => {
    const stored = sessionStorage.getItem("dopamine_ref_promo")?.trim().toUpperCase();
    if (stored && !initialPromoCode) setPromo(stored);
  }, [initialPromoCode]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/economy/buy-gift-key").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/economy/buy-server-slot").then((r) => (r.ok ? r.json() : null)),
    ]).then(([gift, slot]) => {
      if (gift?.price) setGiftKeyPrice(Number(gift.price));
      if (slot?.slotPrice) setSlotPrice(Number(slot.slotPrice));
    });
  }, []);

  const totalCost = slotPrice * quantity;
  const canAffordSlot = creatorUnlimited || coinsBalance >= totalCost;
  const canAffordKey = creatorUnlimited || coinsBalance >= giftKeyPrice;
  const coinsLabel = creatorUnlimited ? "∞" : String(coinsBalance);
  const slotsLabel = creatorUnlimited ? "∞" : String(serverSlots);

  function loadKeys() {
    void fetch("/api/economy/buy-gift-key")
      .then((r) => r.json())
      .then((d) => setOwnedKeys(mapKeys(d.keys ?? [])));
  }

  async function redeemPromo() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/economy/redeem-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promo }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg(`Промокод активирован: +${d.coinsGranted ?? 0} монет`);
        setPromo("");
        onUpdated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function redeemKey() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/keys/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: key }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg("Ключ активирован");
        setKey("");
        onUpdated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function buySlots() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/economy/buy-server-slot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg(`Куплено слотов: ${d.quantity} (−${d.totalCost} монет)`);
        setQuantity(1);
        onUpdated();
      }
    } finally {
      setBusy(false);
    }
  }

  async function buyGiftKey() {
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/economy/buy-gift-key", { method: "POST" });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg("Ключ куплен — активируйте себе или подарите другу во вкладке «Друзья»");
        onUpdated();
        loadKeys();
      }
    } finally {
      setBusy(false);
    }
  }

  async function redeemOwnKey(keyId: string) {
    if (!confirm("Активировать этот ключ на свой аккаунт? После активации подарить его будет нельзя.")) return;
    setBusy(true);
    setError("");
    setMsg("");
    try {
      const r = await fetch("/api/economy/redeem-own-gift-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Ошибка");
      else {
        setMsg(`Ключ активирован: +${d.grantedServers} слот сервера`);
        onUpdated();
        loadKeys();
      }
    } finally {
      setBusy(false);
    }
  }

  const availableKeys = ownedKeys.filter((k) => k.giftStatus === "available");

  return (
    <div className="dash-panels stack">
      {error ? <p className="error">{error}</p> : null}
      {msg ? <p className="info">{msg}</p> : null}

      {trial.enabled && trial.canCreateTrialServer ? (
        <section className="card dash-panel trial-banner">
          <p className="info" style={{ margin: 0 }}>
            Пробный сервер доступен ещё <strong>{formatTrialRemainingMs(trial.remainingMs)}</strong> — создай
            его во вкладке «Серверы» в лаунчере dopamine. Сервер автоматически удалится по окончании пробного
            периода.
          </p>
        </section>
      ) : null}
      {trial.enabled && trial.windowActive && trial.trialServerUsed ? (
        <section className="card dash-panel trial-banner">
          <p className="muted" style={{ margin: 0 }}>
            Пробный сервер активен. Удаление через{" "}
            <strong>{formatTrialRemainingMs(trial.remainingMs)}</strong> — только в лаунчере.
          </p>
        </section>
      ) : null}
      {creatorUnlimited ? (
        <section className="card dash-panel trial-banner">
          <p className="info" style={{ margin: 0 }}>
            Режим создателя: <strong>безлимит</strong> монет и слотов. Покупки и серверы не списывают баланс.
            Выключить можно в админке → Обзор.
          </p>
        </section>
      ) : null}

      <section className="card dash-panel">
        <div className="dash-panel-head">
          <div>
            <h2>Промокоды и ключи</h2>
            <p className="muted">Активируйте промокод или ключ от администратора / друга</p>
          </div>
        </div>
        <div className="dash-panel-grid">
          <div className="dash-action-card">
            <h3>Промокод</h3>
            <p className="muted">Бонусные монеты на баланс</p>
            <input
              placeholder="WELCOME5"
              value={promo}
              onChange={(e) => setPromo(e.target.value.toUpperCase())}
            />
            <button type="button" className="btn" disabled={busy || !promo.trim()} onClick={() => void redeemPromo()}>
              Активировать промо
            </button>
          </div>
          <div className="dash-action-card">
            <h3>Ключ активации</h3>
            <p className="muted">Монеты и слоты серверов</p>
            <input
              placeholder="DOP-XXXX-XXXX"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
            />
            <button type="button" className="btn" disabled={busy || !key.trim()} onClick={() => void redeemKey()}>
              Активировать ключ
            </button>
          </div>
        </div>
      </section>

      <section className="card dash-panel">
        <div className="dash-panel-head">
          <div>
            <h2>Ключ в подарок</h2>
            <p className="muted">
              Купите ключ на 1 сервер за {giftKeyPrice} монет — подарите другу или активируйте себе
            </p>
          </div>
          <div className="dash-balance-pill">
            <span>Баланс</span>
            <strong>{coinsLabel} 🪙</strong>
          </div>
        </div>

        <div className="dash-gift-buy">
          <button type="button" className="btn" disabled={busy || !canAffordKey} onClick={() => void buyGiftKey()}>
            {busy ? "Покупка…" : `Купить ключ (1 сервер) — ${giftKeyPrice} 🪙`}
          </button>
          {!canAffordKey ? (
            <p className="error" style={{ margin: 0 }}>
              {creatorUnlimited ? null : <>Не хватает {giftKeyPrice - coinsBalance} монет</>}
            </p>
          ) : null}
        </div>

        {ownedKeys.length > 0 ? (
          <div className="dash-owned-keys stack sm">
            <h3>Ваши ключи ({availableKeys.length} свободно)</h3>
            <ul className="dash-key-list">
              {ownedKeys.map((k, i) => (
                <li key={k.id} className="dash-key-item">
                  <div className="dash-key-meta">
                    <span className="dash-key-label">Подарочный ключ #{ownedKeys.length - i}</span>
                    <code className="dash-key-code dash-key-code-blur" aria-hidden="true">
                      {k.codePreview}
                    </code>
                    <span className="muted"> · {k.grantServers} сервер</span>
                    {k.giftStatus === "pending_gift" ? (
                      <span className="badge">ожидает принятия</span>
                    ) : null}
                  </div>
                  {k.giftStatus === "available" ? (
                    <button
                      type="button"
                      className="btn sm"
                      disabled={busy}
                      onClick={() => void redeemOwnKey(k.id)}
                    >
                      Активировать себе
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="card dash-panel">
        <div className="dash-panel-head">
          <div>
            <h2>Покупка слотов на себя</h2>
            <p className="muted">Слоты сразу на ваш аккаунт — для локальных серверов в лаунчере</p>
          </div>
        </div>

        <div className="dash-shop">
          <div className="dash-shop-info">
            <p>
              Сейчас доступно слотов: <strong>{slotsLabel}</strong>
            </p>
            <p className="muted">Цена одного слота: {slotPrice} монет</p>
          </div>

          <div className="dash-qty-row">
            <label className="dash-qty-label">
              Количество
              <div className="dash-qty-control">
                <button
                  type="button"
                  className="btn ghost sm"
                  disabled={quantity <= 1 || busy}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                />
                <button
                  type="button"
                  className="btn ghost sm"
                  disabled={quantity >= 20 || busy}
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                >
                  +
                </button>
              </div>
            </label>
            <div className="dash-total">
              <span>Итого</span>
              <strong className={canAffordSlot ? "" : "dash-insufficient"}>{totalCost} 🪙</strong>
            </div>
          </div>

          <button
            type="button"
            className="btn dash-buy-btn"
            disabled={busy || !canAffordSlot}
            onClick={() => void buySlots()}
          >
            {busy ? "Покупка…" : `Купить ${quantity} ${quantity === 1 ? "слот" : quantity < 5 ? "слота" : "слотов"}`}
          </button>
          {!canAffordSlot ? (
            <p className="error" style={{ margin: 0 }}>
              {creatorUnlimited ? null : <>Не хватает {totalCost - coinsBalance} монет</>}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
