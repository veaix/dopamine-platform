"use client";

import { useState } from "react";
import { PasswordResetForm } from "@/components/password-reset-form";

export function SecurityPanel({
  email,
  totpEnabled,
  onUpdated,
}: {
  email: string;
  totpEnabled: boolean;
  onUpdated: () => void;
}) {
  return (
    <div className="stack">
      <section className="card dash-panel">
        <h2>Двухфакторная аутентификация</h2>
        <TotpPanel enabled={totpEnabled} onUpdated={onUpdated} />
      </section>

      <section className="card dash-panel">
        <h2>Смена пароля</h2>
        <PasswordResetForm
          initialEmail={email}
          redirectAfter="/login?password=reset"
          variant="embedded"
          hideTitle
        />
      </section>
    </div>
  );
}

function TotpPanel({ enabled, onUpdated }: { enabled: boolean; onUpdated: () => void }) {
  const [qr, setQr] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  return (
    <div className="stack sm">
      <p>
        Google Authenticator:{" "}
        {enabled ? <span className="badge">включена</span> : <span className="muted">выключена</span>}
      </p>

      {error ? <p className="error">{error}</p> : null}
      {msg ? <p className="info">{msg}</p> : null}

      {!enabled ? (
        <>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setError("");
              void fetch("/api/auth/totp/setup", { method: "POST" })
                .then(async (r) => {
                  const d = await r.json();
                  if (!r.ok) {
                    setError(d.error ?? "Не удалось начать настройку 2FA");
                    return;
                  }
                  setQr(d.qrDataUrl ?? "");
                })
                .catch(() => setError("Ошибка сети"));
            }}
          >
            Настроить 2FA
          </button>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="QR для 2FA" className="qr" />
          ) : null}
          <div className="row">
            <input
              placeholder="Код из приложения"
              value={setupCode}
              onChange={(e) => setSetupCode(e.target.value)}
            />
            <button
              type="button"
              className="btn"
              onClick={() =>
                void fetch("/api/auth/totp/enable", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ code: setupCode }),
                })
                  .then(async (r) => {
                    const d = await r.json();
                    if (!r.ok) setError(d.error ?? "Ошибка");
                    else {
                      setMsg("2FA включена");
                      setQr("");
                      setSetupCode("");
                      onUpdated();
                    }
                  })
              }
            >
              Включить
            </button>
          </div>
        </>
      ) : (
        <div className="dash-disable-2fa stack sm">
          <p className="muted">Для отключения введите пароль и текущий код 2FA</p>
          <input
            type="password"
            placeholder="Пароль"
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            autoComplete="current-password"
          />
          <input
            placeholder="Код 2FA"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
          />
          <button
            type="button"
            className="btn danger"
            onClick={() =>
              void fetch("/api/auth/totp/disable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: disablePassword, code: disableCode }),
              }).then(async (r) => {
                const d = await r.json();
                if (!r.ok) setError(d.error ?? "Ошибка");
                else {
                  setMsg("2FA отключена");
                  setDisablePassword("");
                  setDisableCode("");
                  onUpdated();
                }
              })
            }
          >
            Отключить 2FA
          </button>
        </div>
      )}
    </div>
  );
}
