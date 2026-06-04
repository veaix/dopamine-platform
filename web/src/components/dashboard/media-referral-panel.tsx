"use client";

import { useEffect, useState } from "react";

type ReferralPromo = {
  id: string;
  code: string;
  usesCount: number;
  maxUses: number;
  rewardCoins: number;
  isActive: boolean;
  createdAt: string | null;
  shareUrl: string;
};

type Props = {
  onError?: (msg: string) => void;
};

export function MediaReferralPanel({ onError }: Props) {
  const [promo, setPromo] = useState<ReferralPromo | null>(null);
  const [rewardCoins, setRewardCoins] = useState(5);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError("");
    return fetch("/api/media/referral", { credentials: "same-origin" })
      .then(async (r) => {
        let d: { error?: string; promo?: ReferralPromo | null; rewardCoins?: number } = {};
        try {
          d = (await r.json()) as typeof d;
        } catch {
          const message = `Ошибка сервера (${r.status})`;
          setLoadError(message);
          onError?.(message);
          setPromo(null);
          return;
        }
        if (!r.ok || d.error) {
          const message = d.error ?? `Ошибка (${r.status})`;
          setLoadError(message);
          onError?.(message);
          setPromo(null);
          return;
        }
        setPromo(d.promo ?? null);
        setRewardCoins(d.rewardCoins ?? 5);
      })
      .catch(() => {
        const message = "Нет связи с сервером";
        setLoadError(message);
        onError?.(message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/media/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await r.json();
      if (d.error) onError?.(d.error);
      else {
        setPromo(d.promo);
        setCode("");
        setMsg("Промокод создан — делитесь ссылкой!");
      }
    } finally {
      setBusy(false);
    }
  }

  async function copyShare() {
    if (!promo?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(promo.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onError?.("Не удалось скопировать");
    }
  }

  return (
    <div className="stack">
      <section className="card stack media-referral-card">
        <div className="media-referral-head">
          <span className="media-referral-badge">Медиагигант</span>
          <h2>Реферальный промокод</h2>
          <p className="muted">
            Один персональный код для вашей аудитории. За активацию новый пользователь получает{" "}
            <strong>{rewardCoins} монет</strong>, а вы видите, сколько людей пришло по вашему коду.
          </p>
        </div>

        {loadError ? <p className="form-error">{loadError}</p> : null}

        {loading ? (
          <p className="muted">Загрузка…</p>
        ) : promo ? (
          <div className="media-referral-stats">
            <div className="media-referral-stat">
              <span className="media-referral-stat-value">{promo.code}</span>
              <span className="muted">ваш код</span>
            </div>
            <div className="media-referral-stat media-referral-stat--highlight">
              <span className="media-referral-stat-value">{promo.usesCount}</span>
              <span className="muted">привели людей</span>
            </div>
            <div className="media-referral-stat">
              <span className="media-referral-stat-value">+{promo.rewardCoins}</span>
              <span className="muted">монет за активацию</span>
            </div>
          </div>
        ) : null}

        {!loading && promo ? (
          <div className="stack">
            <label className="stack gap-1">
              <span className="muted">Ссылка для аудитории</span>
              <div className="row">
                <input readOnly value={promo.shareUrl} className="flex-1" />
                <button type="button" className="btn secondary" onClick={() => void copyShare()}>
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>
            </label>
            <p className="muted">
              Пользователи также могут ввести код <strong>{promo.code}</strong> в кабинете → Монеты и ключи.
            </p>
            <button type="button" className="btn ghost sm" onClick={() => load()}>
              Обновить статистику
            </button>
          </div>
        ) : !loading ? (
          <div className="stack">
            <label className="stack gap-1">
              <span>Придумайте код (латиница, цифры, _)</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="MYCHANNEL"
                maxLength={24}
              />
            </label>
            <button type="button" className="btn" disabled={busy || code.length < 3} onClick={() => void create()}>
              {busy ? "Создание…" : "Создать промокод"}
            </button>
            <p className="muted">Создать можно только один раз — потом код изменить нельзя.</p>
          </div>
        ) : null}

        {msg ? <p className="form-ok">{msg}</p> : null}
      </section>
    </div>
  );
}
