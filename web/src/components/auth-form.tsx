"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "register";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error === "email_taken" ? "Email уже занят" : "Неверный email или пароль");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit}>
      <h2>{mode === "login" ? "Вход" : "Регистрация"}</h2>
      <p className="label" style={{ marginBottom: "1.25rem" }}>
        {mode === "login" ? "Добро пожаловать обратно" : "Создайте аккаунт dopamine"}
      </p>
      <div className="form-row">
        <label className="label">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-row">
        <label className="label">Пароль {mode === "register" && "(мин. 8 символов)"}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === "register" ? 8 : 1}
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
        {loading ? "…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
      </button>
    </form>
  );
}
