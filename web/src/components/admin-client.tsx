"use client";

import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  role: string;
  banned: boolean;
  canCreateServers: boolean;
  maxServers: number;
  devices: number;
  createdAt: string;
};

export function AdminClient({ initialServersGated }: { initialServersGated: boolean }) {
  const [serversGated, setServersGated] = useState(initialServersGated);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [label, setLabel] = useState("");

  async function loadUsers() {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleGated() {
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serversGated: !serversGated }),
    });
    const data = await res.json();
    if (res.ok) setServersGated(data.serversGated);
  }

  async function generateKey() {
    const res = await fetch("/api/admin/keys/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: label || undefined,
        canCreateServers: true,
        maxServers: 5,
        expiresInDays: 365,
        maxUses: 1,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setGeneratedKey(data.code);
      setLabel("");
    }
  }

  async function setRole(id: string, role: string) {
    await fetch(`/api/admin/users/${id}/role`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role }),
    });
    loadUsers();
  }

  async function banUser(id: string) {
    if (!confirm("Заблокировать пользователя?")) return;
    await fetch(`/api/admin/users/${id}/ban`, { method: "POST" });
    loadUsers();
  }

  return (
    <div className="site-main--narrow">
      <div className="page-header">
      <h1>Админ-панель</h1>
      <p className="label">Управление ключами, пользователями и доступом к серверам</p>
      </div>

      <div className="card">
        <h3>Глобальные настройки</h3>
        <p>
          Создание серверов только по ключу:{" "}
          <strong>{serversGated ? "ДА" : "НЕТ"}</strong>
        </p>
        <button type="button" className="btn btn-primary" onClick={toggleGated}>
          Переключить
        </button>
      </div>

      <div className="card">
        <h3>Ключ активации</h3>
        <input placeholder="Метка (опционально)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <button type="button" className="btn btn-primary" style={{ marginTop: "0.75rem" }} onClick={generateKey}>
          Сгенерировать ключ
        </button>
        {generatedKey && (
          <div className="code-box" style={{ marginTop: "1rem" }}>
            {generatedKey}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Пользователи</h3>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Роль</th>
              <th>Серверы</th>
              <th>Устройств</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {u.email}
                  {u.banned && <span className="badge" style={{ marginLeft: 8, background: "rgba(248,113,113,.2)", color: "#f87171" }}>ban</span>}
                </td>
                <td>
                  <select value={u.role} onChange={(e) => setRole(u.id, e.target.value)}>
                    <option value="user">user</option>
                    <option value="tester">tester</option>
                    <option value="creator">creator</option>
                  </select>
                </td>
                <td>{u.canCreateServers ? `да (${u.maxServers})` : "нет"}</td>
                <td>{u.devices}</td>
                <td>
                  {!u.banned && (
                    <button type="button" className="btn btn-danger" onClick={() => banUser(u.id)}>
                      Ban
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
