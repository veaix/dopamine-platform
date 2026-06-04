"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { NICKNAME_MAX_LENGTH, NICKNAME_MIN_LENGTH } from "@/lib/nickname";
import { TurnstileWidget, isTurnstileEnabledClient } from "@/components/turnstile-widget";

type Mode = "login" | "register" | "verify";

const MIN_FORM_MS = 3000;

export function AuthForm({
  mode,
  initialEmail = "",
  nextPath,
}: {
  mode: Mode;
  initialEmail?: string;
  nextPath?: string | null;
}) {
  const router = useRouter();
  const { refresh } = useAuth();
  const formStartedAt = useRef(Date.now());

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

  const turnstileRequired = mode === "register" && isTurnstileEnabledClient();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (mode === "register" && Date.now() - formStartedAt.current < MIN_FORM_MS) {
      setError("Подождите несколько секунд перед отправкой");
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setError("Подтвердите, что вы не робот");
      return;
    }

    setBusy(true);

    try {
      if (mode === "register") {
        const r = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname,
            email,
            password,
            website: honeypot,
            formStartedAt: formStartedAt.current,
            turnstileToken: turnstileToken || undefined,
          }),
        });
        const d = await r.json();
        if (!r.ok) {
          setError(d.error ?? "Ошибка регистрации");
          return;
        }
        router.push(`/register/verify?email=${encodeURIComponent(email)}`);
        return;
      }

      if (mode === "verify") {
        const r = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const d = await r.json();
        if (!r.ok) {
          setError(d.error ?? "Ошибка подтверждения");
          return;
        }
        await refresh();
        router.push(d.redirectTo ?? "/dashboard?welcome=1");
        router.refresh();
        return;
      }

      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, totpCode: needsTotp ? totpCode : undefined }),
      });
      const d = await r.json();
      if (d.needsTotp) {
        setNeedsTotp(true);
        setInfo("Введите код из Google Authenticator");
        return;
      }
      if (!r.ok) {
        setError(d.error ?? "Неверный email или пароль");
        return;
      }

      await refresh();
      const next = nextPath?.trim();
      router.push(next && next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function resendCode() {
    if (!email.trim()) return;
    setResendBusy(true);
    setError("");
    setInfo("");
    try {
      const r = await fetch("/api/auth/verify-email/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error ?? "Не удалось отправить код");
      else setInfo(d.message ?? "Код отправлен повторно");
    } finally {
      setResendBusy(false);
    }
  }

  return (
    <form className="form card auth-card" onSubmit={(e) => void submit(e)}>
      {mode === "register" ? (
        <>
          <label className="hp-field" aria-hidden="true">
            Сайт
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
          <label>
            Никнейм
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              minLength={NICKNAME_MIN_LENGTH}
              maxLength={NICKNAME_MAX_LENGTH}
              autoComplete="username"
            />
          </label>
        </>
      ) : null}

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          readOnly={mode === "verify" && Boolean(initialEmail)}
          autoComplete="email"
        />
      </label>

      {mode !== "verify" ? (
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
      ) : (
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
      )}

      {needsTotp ? (
        <label>
          Код 2FA
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            required
            maxLength={6}
            inputMode="numeric"
          />
        </label>
      ) : null}

      {turnstileRequired ? (
        <TurnstileWidget onToken={setTurnstileToken} onExpire={() => setTurnstileToken("")} />
      ) : null}

      {error ? <p className="error">{error}</p> : null}
      {info ? <p className="info">{info}</p> : null}

      <button type="submit" className="btn" disabled={busy || (turnstileRequired && !turnstileToken)}>
        {busy
          ? "Подождите…"
          : mode === "login"
            ? "Войти"
            : mode === "register"
              ? "Создать аккаунт"
              : "Подтвердить email"}
      </button>

      {mode === "verify" ? (
        <button type="button" className="btn ghost sm" disabled={resendBusy || !email} onClick={() => void resendCode()}>
          {resendBusy ? "Отправка…" : "Отправить код повторно"}
        </button>
      ) : null}

      {mode === "login" ? (
        <>
          <p className="auth-switch muted">
            Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
          </p>
          <p className="auth-switch muted">
            <Link href="/forgot-password">Забыли пароль?</Link>
          </p>
        </>
      ) : null}
      {mode === "register" ? (
        <p className="auth-switch muted">
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      ) : null}
    </form>
  );
}
