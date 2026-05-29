"use client";

import { useState } from "react";
import type { EntitlementView } from "@/lib/entitlements";
import type { SessionUser } from "@/lib/auth";

type DeviceRow = {
  id: string;
  name: string;
  os: string | null;
  appVersion: string | null;
  runningServers: number;
  lastSeenAt: string | null;
};

export function DashboardClient({
  user,
  entitlements,
  devices,
}: {
  user: SessionUser;
  entitlements: EntitlementView;
  devices: DeviceRow[];
}) {
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkExpires, setLinkExpires] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [message, setMessage] = useState("");
  const [ent, setEnt] = useState(entitlements);
  const [devList, setDevList] = useState(devices);

  async function createLinkCode() {
    setMessage("");
    const res = await fetch("/api/devices/link-code", { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setMessage("Не удалось создать код");
      return;
    }
    setLinkCode(data.code);
    setLinkExpires(data.expiresAt);
  }

  async function redeemKey(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/keys/redeem", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: keyInput }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(
        data.error === "invalid_key"
          ? "Неверный или просроченный ключ"
          : data.error === "already_redeemed"
            ? "Ключ уже использован"
            : "Ошибка активации",
      );
      return;
    }
    setEnt(data.entitlements);
    setKeyInput("");
    setMessage("Ключ активирован");
  }

  async function revokeDevice(id: string) {
    await fetch(`/api/devices/${id}/revoke`, { method: "POST" });
    setDevList((list) => list.filter((d) => d.id !== id));
  }

  return (
    <div>
      <h1>Личный кабинет</h1>
      <p className="label">
        {user.email} · роль <span className="badge">{user.role}</span>
      </p>

      <div className="grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="card">
          <div className="label">Создание серверов</div>
          <p style={{ fontSize: "1.25rem", margin: "0.35rem 0" }}>
            {ent.canCreateServers ? "Разрешено" : "Заблокировано"}
            {ent.serversGated && !ent.canCreateServers && (
              <span className="label"> — нужен ключ активации</span>
            )}
          </p>
          <p className="label">Лимит серверов: {ent.maxServers}</p>
        </div>
        <div className="card">
          <div className="label">Привязка лаунчера</div>
          <button type="button" className="btn btn-primary" onClick={createLinkCode}>
            Получить код
          </button>
          {linkCode && (
            <div style={{ marginTop: "1rem" }}>
              <div className="code-box">{linkCode}</div>
              <p className="label" style={{ marginTop: "0.5rem" }}>
                Действует до {linkExpires ? new Date(linkExpires).toLocaleTimeString() : "—"}. Введите в
                лаунчере: Настройки → Аккаунт dopamine.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>Активировать ключ</h3>
        <form onSubmit={redeemKey}>
          <input
            placeholder="DOP-XXXX-XXXX"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
            Активировать
          </button>
        </form>
        {message && <p style={{ marginTop: "0.75rem" }}>{message}</p>}
      </div>

      <div className="card">
        <h3>Устройства</h3>
        {devList.length === 0 ? (
          <p className="label">Лаунчер ещё не привязан</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Имя</th>
                <th>ОС</th>
                <th>Версия</th>
                <th>Серверов</th>
                <th>Онлайн</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {devList.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.os ?? "—"}</td>
                  <td>{d.appVersion ?? "—"}</td>
                  <td>{d.runningServers}</td>
                  <td>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "—"}</td>
                  <td>
                    <button type="button" className="btn btn-danger" onClick={() => revokeDevice(d.id)}>
                      Отвязать
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
