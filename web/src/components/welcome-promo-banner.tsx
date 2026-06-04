"use client";

import { useState } from "react";

export function WelcomePromoBanner({
  onRedeemed,
}: {
  onRedeemed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function redeem() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/economy/redeem-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "WELCOME5" }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      setError(d.error ?? "Не удалось активировать");
      return;
    }
    setDone(true);
    onRedeemed();
  }

  if (done) {
    return (
      <section className="card highlight welcome-banner">
        <p className="info">Промокод активирован! Монеты зачислены на баланс.</p>
      </section>
    );
  }

  return (
    <section className="card highlight welcome-banner">
      <h2>Добро пожаловать в dopamine!</h2>
      <p>
        Вы успешно зарегистрировались. Активируйте приветственный промокод{" "}
        <strong>WELCOME5</strong> — +5 монет на баланс (один раз).
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="row">
        <button type="button" className="btn" disabled={busy} onClick={() => void redeem()}>
          {busy ? "Активация…" : "Активировать WELCOME5"}
        </button>
      </div>
    </section>
  );
}
