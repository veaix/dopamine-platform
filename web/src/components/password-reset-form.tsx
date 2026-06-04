"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Step = "request" | "confirm";

export function PasswordResetForm({
  initialEmail = "",
  redirectAfter = "/login?password=reset",
  variant = "page",
  hideTitle = false,
}: {
  initialEmail?: string;
  redirectAfter?: string;
  variant?: "page" | "embedded";
  hideTitle?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error ?? "Не удалось отправить код");
        return;
      }
      setStep("confirm");
      setInfo("Если аккаунт существует, код отправлен на email. Проверьте спам.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const r = await fetch("/api/auth/password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password,
          totpCode: needsTotp || totpCode ? totpCode.trim() : undefined,
        }),
      });
      const d = await r.json();
      if (d.needsTotp) {
        setNeedsTotp(true);
        setInfo("На аккаунте включена 2FA — введите код из Google Authenticator");
        return;
      }
      if (!r.ok) {
        setError(d.error ?? "Не удалось сменить пароль");
        return;
      }
      setInfo("Пароль изменён. Перенаправление…");
      router.push(redirectAfter);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const formClass = variant === "page" ? "form card auth-card" : "form stack sm";

  if (step === "request") {
    return (
      <form
        className={formClass}
        onSubmit={(e) => {
          e.preventDefault();
          void sendCode();
        }}
      >
        {variant === "embedded" && !hideTitle ? <h3>Смена пароля по email</h3> : null}
        <label>
          Email аккаунта
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            readOnly={Boolean(initialEmail)}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        {info ? <p className="info">{info}</p> : null}
        <button type="submit" className="btn" disabled={busy}>
          {busy ? "Отправка…" : "Отправить код на email"}
        </button>
        {variant === "page" ? (
          <p className="auth-switch muted">
            <Link href="/login">← Назад ко входу</Link>
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form className={formClass} onSubmit={(e) => void confirmReset(e)}>
      {variant === "embedded" && !hideTitle ? <h3>Смена пароля по email</h3> : null}
      <p className="muted">
        Код отправлен на <strong>{email}</strong>
      </p>
      <label>
        Код из письма (6 цифр)
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
        />
      </label>
      <label>
        Новый пароль
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      {needsTotp ? (
        <label>
          Код 2FA (Google Authenticator)
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </label>
      ) : (
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Если на аккаунте включена 2FA, код из приложения потребуется на следующем шаге.
        </p>
      )}
      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="info">{info}</p> : null}
      <button type="submit" className="btn" disabled={busy}>
        {busy ? "Сохранение…" : "Сменить пароль"}
      </button>
      <button
        type="button"
        className="btn secondary"
        disabled={busy}
        onClick={() => {
          setStep("request");
          setCode("");
          setPassword("");
          setTotpCode("");
          setNeedsTotp(false);
          setError("");
          setInfo("");
        }}
      >
        Отправить код заново
      </button>
      {variant === "page" ? (
        <p className="auth-switch muted">
          <Link href="/login">← Назад ко входу</Link>
        </p>
      ) : null}
    </form>
  );
}
