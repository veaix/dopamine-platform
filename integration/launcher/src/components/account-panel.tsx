/**
 * Copy to minecraft-launcher/src/components/account-panel.tsx
 * Add to launcher settings panel.
 */
"use client";

import { useCallback, useEffect, useState } from "react";

type Entitlements = {
  canCreateServers: boolean;
  maxServers: number;
  serversGated: boolean;
  role: string;
};

declare global {
  interface Window {
    desktopApi?: {
      accountGetState?: () => Promise<{ linked: boolean; entitlements?: Entitlements | null }>;
      accountLink?: (p: { code: string; deviceName?: string }) => Promise<unknown>;
      accountLogout?: () => Promise<unknown>;
      accountRedeemKey?: (code: string) => Promise<{ entitlements: Entitlements }>;
    };
  }
}

export function AccountPanel() {
  const api = window.desktopApi;
  const [linked, setLinked] = useState(false);
  const [ent, setEnt] = useState<Entitlements | null>(null);
  const [code, setCode] = useState("");
  const [key, setKey] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!api?.accountGetState) return;
    const s = await api.accountGetState();
    setLinked(s.linked);
    setEnt(s.entitlements ?? null);
  }, [api]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!api?.accountLink) {
    return (
      <p style={{ fontSize: 12, opacity: 0.7 }}>
        Модуль аккаунта не подключён. См. dopamine-platform/integration/README.md
      </p>
    );
  }

  async function link() {
    setBusy(true);
    setMsg("");
    try {
      await api.accountLink!({ code: code.trim().toUpperCase() });
      setCode("");
      setMsg("Лаунчер привязан");
      await refresh();
    } catch {
      setMsg("Неверный или просроченный код");
    }
    setBusy(false);
  }

  async function redeem() {
    setBusy(true);
    setMsg("");
    try {
      const r = await api.accountRedeemKey!(key.trim());
      setEnt(r.entitlements);
      setKey("");
      setMsg("Ключ активирован");
    } catch {
      setMsg("Ошибка ключа");
    }
    setBusy(false);
  }

  async function logout() {
    await api.accountLogout?.();
    setLinked(false);
    setEnt(null);
    setMsg("Отвязано");
  }

  return (
    <div className="glass" style={{ padding: 16, borderRadius: 12 }}>
      <h3 style={{ margin: "0 0 8px" }}>Аккаунт dopamine</h3>
      {linked ? (
        <>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Роль: {ent?.role ?? "—"} · серверы:{" "}
            {ent?.canCreateServers ? "разрешены" : "нужен ключ"}
          </p>
          <input
            placeholder="Ключ DOP-…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            style={{ width: "100%", marginTop: 8 }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={redeem} disabled={busy}>
              Активировать ключ
            </button>
            <button type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </>
      ) : (
        <>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Получите код на сайте → Личный кабинет → Привязать лаунчер
          </p>
          <input
            placeholder="Код 6 символов"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ width: "100%", marginTop: 8 }}
          />
          <button type="button" onClick={link} disabled={busy} style={{ marginTop: 8 }}>
            Привязать
          </button>
        </>
      )}
      {msg && <p style={{ fontSize: 12, marginTop: 8 }}>{msg}</p>}
    </div>
  );
}
