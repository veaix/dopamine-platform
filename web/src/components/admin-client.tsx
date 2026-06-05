"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminShellProps } from "@/server/admin/shell";

const AdminDashboardPanel = dynamic(
  () => import("@/components/admin/admin-extra-panels").then((m) => ({ default: m.AdminDashboardPanel })),
  { loading: () => <p className="muted">Загрузка…</p> },
);
const AdminAuditPanel = dynamic(
  () => import("@/components/admin/admin-extra-panels").then((m) => ({ default: m.AdminAuditPanel })),
  { loading: () => <p className="muted">Загрузка…</p> },
);
const AdminEmailPanel = dynamic(
  () => import("@/components/admin/admin-extra-panels").then((m) => ({ default: m.AdminEmailPanel })),
  { loading: () => <p className="muted">Загрузка…</p> },
);
const AdminFraudPanel = dynamic(
  () => import("@/components/admin/admin-extra-panels").then((m) => ({ default: m.AdminFraudPanel })),
  { loading: () => <p className="muted">Загрузка…</p> },
);
import {
  ADMIN_PERMISSIONS,
  PERMISSION_LABELS,
  type AdminPermission,
} from "@/lib/admin-permissions";

type Tab =
  | "dashboard"
  | "audit"
  | "email"
  | "fraud"
  | "users"
  | "keys"
  | "promo";

const TAB_PERM: Record<Tab, AdminPermission> = {
  dashboard: "stats",
  audit: "audit",
  email: "email",
  fraud: "fraud",
  users: "users",
  keys: "keys",
  promo: "promo",
};

const TAB_LABELS: Record<Tab, string> = {
  dashboard: "Обзор",
  audit: "Журнал",
  email: "Рассылка",
  fraud: "Антифрод",
  users: "Пользователи",
  keys: "Ключи",
  promo: "Промокоды",
};

type UserRow = {
  id: string;
  nickname: string;
  email: string;
  role: string;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
  totalServersCreated: number;
  isBlocked: boolean;
  lastLoginIp: string | null;
  bio?: string | null;
  totpEnabled?: boolean;
  emailVerifiedAt?: string | null;
};

type UserDetail = {
  user: UserRow & { hiddenFromLeaderboards?: boolean; registrationIp?: string | null };
  likes: number;
  dislikes: number;
  devices?: { id: string; label: string; lastSeenAt: string | null }[];
  loginEvents?: { ipAddress: string | null; createdAt: string }[];
};

type KeyRow = {
  id: string;
  code: string;
  grantServers: number;
  grantCoins: number;
  maxUses: number;
  usesCount: number;
  status: string;
  createdAt: string;
};

type PromoRow = {
  id: string;
  code: string;
  rewardCoins: number;
  maxUses: number;
  usesCount: number;
  isActive: boolean;
  kind?: string;
  ownerUserId?: string | null;
  ownerNickname?: string | null;
};

export function AdminClient({ initialShell }: { initialShell: AdminShellProps }) {
  const [tab, setTab] = useState<Tab>(() => {
    const first = (Object.keys(TAB_PERM) as Tab[]).find((t) =>
      initialShell.permissions.includes(TAB_PERM[t]),
    );
    return first ?? "dashboard";
  });
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const permissions = initialShell.permissions;
  const isCreator = initialShell.isCreator;

  const visibleTabs = useMemo(
    () => (Object.keys(TAB_PERM) as Tab[]).filter((t) => permissions.includes(TAB_PERM[t])),
    [permissions],
  );

  return (
    <div className="stack">
      <div className="tabs">
        {visibleTabs.map((id) => (
          <button
            key={id}
            type="button"
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => setTab(id)}
          >
            {TAB_LABELS[id]}
          </button>
        ))}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {msg ? <p className="info">{msg}</p> : null}

      {tab === "dashboard" ? <AdminDashboardPanel isCreator={isCreator} /> : null}
      {tab === "audit" ? <AdminAuditPanel /> : null}
      {tab === "email" ? <AdminEmailPanel onMsg={setMsg} onError={setError} /> : null}
      {tab === "fraud" ? <AdminFraudPanel /> : null}
      {tab === "users" ? (
        <AdminUsersPanel isCreator={isCreator} onError={setError} onMsg={setMsg} />
      ) : null}
      {tab === "keys" ? <AdminKeysPanel onError={setError} onMsg={setMsg} /> : null}
      {tab === "promo" ? <AdminPromoPanel onError={setError} onMsg={setMsg} /> : null}
    </div>
  );
}

function AdminUsersPanel({
  isCreator,
  onError,
  onMsg,
}: {
  isCreator: boolean;
  onError: (s: string) => void;
  onMsg: (s: string) => void;
}) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const detailPanelRef = useRef<HTMLElement | null>(null);
  const [form, setForm] = useState<Record<string, string | number | boolean>>({});
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantComment, setGrantComment] = useState("");
  const [permSelection, setPermSelection] = useState<string[]>([]);

  const search = () => {
    onError("");
    return fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else setUsers(d.users ?? []);
      })
      .catch(() => onError("Не удалось загрузить пользователей"));
  };

  useEffect(() => {
    void search();
  }, []);

  function loadDetail(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setDetailError("");
    onError("");
    void fetch(`/api/admin/users/${encodeURIComponent(id)}`, { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) {
          const message = d.error ?? "Не удалось загрузить профиль";
          setDetailError(message);
          onError(message);
          setDetail(null);
          return;
        }
        if (!d.user?.id) {
          const message = "Пустой ответ сервера";
          setDetailError(message);
          onError(message);
          setDetail(null);
          return;
        }
        setDetail({
          user: d.user,
          likes: d.likes,
          dislikes: d.dislikes,
          devices: d.devices,
          loginEvents: d.loginEvents,
        });
        setPermSelection(d.permissions ?? []);
        const u = d.user as UserRow & { hiddenFromLeaderboards?: boolean };
        setForm({
          nickname: u.nickname,
          email: u.email,
          role: u.role,
          bio: u.bio ?? "",
          coinsBalance: u.coinsBalance,
          availableServerSlots: u.availableServerSlots,
          playtimeSeconds: u.playtimeSeconds,
          totalServersCreated: u.totalServersCreated ?? 0,
          likes: d.likes,
          dislikes: d.dislikes,
          isBlocked: u.isBlocked,
          totpEnabled: u.totpEnabled ?? false,
          emailVerified: Boolean(u.emailVerifiedAt),
          hiddenFromLeaderboards: u.hiddenFromLeaderboards ?? false,
          newPassword: "",
        });
      })
      .catch(() => {
        const message = "Сеть недоступна";
        setDetailError(message);
        onError(message);
        setDetail(null);
      })
      .finally(() => setDetailLoading(false));
  }

  useEffect(() => {
    if (!selectedId || detailLoading || !detail?.user) return;
    detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId, detailLoading, detail?.user?.id]);

  function saveUser() {
    if (!selectedId) return;
    onError("");
    void fetch(`/api/admin/users/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nickname: form.nickname,
        email: form.email,
        role: form.role,
        bio: form.bio,
        coinsBalance: Number(form.coinsBalance),
        availableServerSlots: Number(form.availableServerSlots),
        playtimeSeconds: Number(form.playtimeSeconds),
        totalServersCreated: Number(form.totalServersCreated),
        likes: Number(form.likes),
        dislikes: Number(form.dislikes),
        isBlocked: form.isBlocked,
        totpEnabled: form.totpEnabled,
        emailVerified: form.emailVerified,
        hiddenFromLeaderboards: form.hiddenFromLeaderboards,
        newPassword:
          typeof form.newPassword === "string" && form.newPassword.length >= 8
            ? form.newPassword
            : undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else {
          onMsg("Профиль сохранён");
          if (d.user) {
            const u = d.user as UserRow & { hiddenFromLeaderboards?: boolean; registrationIp?: string | null };
            setDetail((prev) =>
              prev
                ? {
                    ...prev,
                    user: u,
                    likes: d.likes ?? prev.likes,
                    dislikes: d.dislikes ?? prev.dislikes,
                  }
                : prev,
            );
            setForm((f) => ({
              ...f,
              nickname: u.nickname,
              email: u.email,
              role: u.role,
              bio: u.bio ?? "",
              coinsBalance: u.coinsBalance,
              availableServerSlots: u.availableServerSlots,
              playtimeSeconds: u.playtimeSeconds,
              totalServersCreated: u.totalServersCreated ?? 0,
              likes: d.likes ?? f.likes,
              dislikes: d.dislikes ?? f.dislikes,
              isBlocked: u.isBlocked,
              totpEnabled: u.totpEnabled ?? false,
              emailVerified: Boolean(u.emailVerifiedAt),
              hiddenFromLeaderboards: u.hiddenFromLeaderboards ?? false,
              newPassword: "",
            }));
          }
          void search();
        }
      });
  }

  const set = (key: string, value: string | number | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="admin-layout">
      <section className="card">
        <div className="row">
          <input
            placeholder="Поиск: ник, email, IP"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void search()}
          />
          <button type="button" className="btn" onClick={() => void search()}>
            Найти
          </button>
        </div>
        <p className="muted">
          {q.trim() ? `Найдено: ${users.length}` : `Показано: ${users.length} (последние по регистрации, макс. 100)`}
        </p>
        <ul className="list admin-user-list">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                className={`admin-user-row ${selectedId === u.id ? "active" : ""}`}
                onClick={() => loadDetail(u.id)}
              >
                <strong>{u.nickname}</strong>
                <span className="muted"> · {u.email}</span>
                {u.isBlocked ? <span className="badge danger"> ban</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selectedId && detailLoading ? (
        <section ref={detailPanelRef} className="card admin-detail-panel">
          <p className="muted">Загрузка профиля…</p>
        </section>
      ) : detail?.user && detail.user.id === selectedId ? (
        <section ref={detailPanelRef} className="card stack admin-edit-form admin-detail-panel">
          <h2>Редактирование: {detail.user.nickname}</h2>
          <div className="admin-form-grid">
            <label>
              Ник
              <input value={String(form.nickname ?? "")} onChange={(e) => set("nickname", e.target.value)} />
            </label>
            <label>
              Email
              <input value={String(form.email ?? "")} onChange={(e) => set("email", e.target.value)} />
            </label>
            <label>
              Роль
              <select value={String(form.role ?? "user")} onChange={(e) => set("role", e.target.value)}>
                <option value="user">user</option>
                <option value="admin">admin</option>
                {isCreator ? <option value="mediagigant">mediagigant</option> : null}
                <option value="creator">creator</option>
              </select>
            </label>
            <label>
              Монеты
              <input
                type="number"
                value={Number(form.coinsBalance ?? 0)}
                onChange={(e) => set("coinsBalance", Number(e.target.value))}
              />
            </label>
            <label>
              Слоты серверов
              <input
                type="number"
                value={Number(form.availableServerSlots ?? 0)}
                onChange={(e) => set("availableServerSlots", Number(e.target.value))}
              />
            </label>
            <label>
              Часы (секунды playtime)
              <input
                type="number"
                value={Number(form.playtimeSeconds ?? 0)}
                onChange={(e) => set("playtimeSeconds", Number(e.target.value))}
              />
            </label>
            <label>
              Создано серверов (всего)
              <input
                type="number"
                value={Number(form.totalServersCreated ?? 0)}
                onChange={(e) => set("totalServersCreated", Number(e.target.value))}
              />
            </label>
            <label>
              Лайки
              <input
                type="number"
                value={Number(form.likes ?? 0)}
                onChange={(e) => set("likes", Number(e.target.value))}
              />
            </label>
            <label>
              Дизлайки
              <input
                type="number"
                value={Number(form.dislikes ?? 0)}
                onChange={(e) => set("dislikes", Number(e.target.value))}
              />
            </label>
            <label className="admin-span-2">
              Био
              <input value={String(form.bio ?? "")} onChange={(e) => set("bio", e.target.value)} />
            </label>
            <label>
              Новый пароль (пусто = не менять)
              <input
                type="password"
                value={String(form.newPassword ?? "")}
                onChange={(e) => set("newPassword", e.target.value)}
                placeholder="мин. 8 символов"
              />
            </label>
          </div>
          <div className="row">
            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(form.isBlocked)}
                onChange={(e) => set("isBlocked", e.target.checked)}
              />
              Заблокирован
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(form.totpEnabled)}
                onChange={(e) => set("totpEnabled", e.target.checked)}
              />
              2FA включена
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(form.emailVerified)}
                onChange={(e) => set("emailVerified", e.target.checked)}
              />
              Email подтверждён
            </label>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={Boolean(form.hiddenFromLeaderboards)}
                onChange={(e) => set("hiddenFromLeaderboards", e.target.checked)}
              />
              Скрыт из топов
            </label>
          </div>

          <hr style={{ borderColor: "var(--border)", width: "100%" }} />

          <h3>Ручное начисление монет</h3>
          <div className="row">
            <input
              type="number"
              value={grantAmount}
              onChange={(e) => setGrantAmount(Number(e.target.value))}
              placeholder="Сумма (+/-)"
            />
            <input
              value={grantComment}
              onChange={(e) => setGrantComment(e.target.value)}
              placeholder="Комментарий"
            />
            <button
              type="button"
              className="btn secondary"
              onClick={() => {
                if (!selectedId) return;
                void fetch(`/api/admin/users/${selectedId}/grant-coins`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount: grantAmount, comment: grantComment }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.error) onError(d.error);
                    else {
                      onMsg(`Баланс: ${d.coinsBalance} монет`);
                      set("coinsBalance", d.coinsBalance);
                      setDetail((prev) =>
                        prev?.user
                          ? { ...prev, user: { ...prev.user, coinsBalance: d.coinsBalance } }
                          : prev,
                      );
                    }
                  });
              }}
            >
              Начислить / списать
            </button>
          </div>

          <h3>Модерация профиля</h3>
          <div className="row">
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                selectedId &&
                void fetch(`/api/admin/users/${selectedId}/moderate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ clearAvatar: true }),
                }).then(() => {
                  onMsg("Аватар сброшен");
                  loadDetail(selectedId);
                })
              }
            >
              Сбросить аватар
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                selectedId &&
                void fetch(`/api/admin/users/${selectedId}/moderate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ clearBio: true }),
                }).then(() => {
                  onMsg("Био очищено");
                  loadDetail(selectedId);
                })
              }
            >
              Очистить био
            </button>
          </div>

          <h3>Устройства лаунчера ({detail.devices?.length ?? 0})</h3>
          {detail.devices?.length ? (
            <ul className="list">
              {detail.devices.map((d) => (
                <li key={d.id}>
                  {d.label} · {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString("ru-RU") : "—"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Нет активных устройств</p>
          )}
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              if (!selectedId || !confirm("Отозвать все сессии лаунчера?")) return;
              void fetch(`/api/admin/users/${selectedId}/devices`, { method: "DELETE" }).then((r) =>
                r.json().then((d) => {
                  onMsg(`Отозвано устройств: ${d.revoked ?? 0}`);
                  loadDetail(selectedId);
                }),
              );
            }}
          >
            Отозвать все устройства
          </button>

          {isCreator && detail.user.role === "admin" ? (
            <>
              <h3>Права администратора</h3>
              <div className="admin-perm-grid">
                {ADMIN_PERMISSIONS.filter((p) => p !== "roles").map((p) => (
                  <label key={p} className="admin-check">
                    <input
                      type="checkbox"
                      checked={permSelection.includes(p)}
                      onChange={(e) => {
                        setPermSelection((prev) =>
                          e.target.checked ? [...prev, p] : prev.filter((x) => x !== p),
                        );
                      }}
                    />
                    {PERMISSION_LABELS[p]}
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  if (!selectedId) return;
                  void fetch(`/api/admin/users/${selectedId}/permissions`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ permissions: permSelection }),
                  }).then((r) => r.json()).then((d) => {
                    if (d.error) onError(d.error);
                    else onMsg("Права обновлены");
                  });
                }}
              >
                Сохранить права
              </button>
            </>
          ) : null}

          {detail.user.registrationIp ? (
            <p className="muted">IP регистрации: {detail.user.registrationIp}</p>
          ) : null}
          {detail.loginEvents?.length ? (
            <details>
              <summary className="muted">Недавние входы ({detail.loginEvents.length})</summary>
              <ul className="list">
                {detail.loginEvents.slice(0, 8).map((e, i) => (
                  <li key={i}>
                    {e.ipAddress ?? "—"} · {new Date(e.createdAt).toLocaleString("ru-RU")}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <div className="row">
            <button type="button" className="btn" onClick={saveUser}>
              Сохранить изменения
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                if (!confirm(`Удалить ${detail.user.nickname}?`)) return;
                void fetch(`/api/admin/users/${selectedId}`, { method: "DELETE" }).then(() => {
                  setSelectedId(null);
                  setDetail(null);
                  onMsg("Пользователь удалён");
                  void search();
                });
              }}
            >
              Удалить аккаунт
            </button>
          </div>
        </section>
      ) : (
        <section ref={detailPanelRef} className="card admin-detail-panel">
          {selectedId && detailError ? (
            <p className="error">{detailError}</p>
          ) : (
            <p className="muted">Выберите пользователя в списке</p>
          )}
        </section>
      )}
    </div>
  );
}

function AdminKeysPanel({
  onError,
  onMsg,
}: {
  onError: (s: string) => void;
  onMsg: (s: string) => void;
}) {
  const [count, setCount] = useState(10);
  const [grantServers, setGrantServers] = useState(1);
  const [grantCoins, setGrantCoins] = useState(0);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresInDays, setExpiresInDays] = useState("");
  const [prefix, setPrefix] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [purgeDays, setPurgeDays] = useState(30);
  const [purgeExpired, setPurgeExpired] = useState(true);
  const [purgeInactive, setPurgeInactive] = useState(false);
  const [purgeDepleted, setPurgeDepleted] = useState(false);

  const loadKeys = () =>
    void fetch(`/api/admin/keys?filter=${filter}&limit=200`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else setKeys(d.keys ?? []);
      });

  useEffect(() => {
    loadKeys();
  }, [filter]);

  function generate() {
    onError("");
    void fetch("/api/admin/keys/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count,
        grantServers,
        grantCoins,
        maxUses,
        expiresInDays: expiresInDays === "" ? null : Number(expiresInDays),
        prefix: prefix || undefined,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else {
          setGenerated(d.codes ?? []);
          onMsg(`Создано ${d.codes?.length ?? 0} ключей (+${grantServers} слотов, +${grantCoins} монет)`);
          loadKeys();
        }
      });
  }

  function purge() {
    if (!confirm("Удалить ключи по выбранным условиям?")) return;
    onError("");
    void fetch("/api/admin/keys/purge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unusedOlderThanDays: purgeDays > 0 ? purgeDays : undefined,
        deleteExpired: purgeExpired,
        deleteInactive: purgeInactive,
        deleteDepleted: purgeDepleted,
      }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else {
          onMsg(`Удалено ключей: ${d.deleted}`);
          loadKeys();
        }
      });
  }

  function deleteSelected(ids: string[]) {
    if (!confirm(`Удалить ${ids.length} ключей?`)) return;
    void fetch("/api/admin/keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).then(() => {
      onMsg("Ключи удалены");
      loadKeys();
    });
  }

  const unusedIds = keys.filter((k) => k.status === "unused").map((k) => k.id);

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Генерация ключей</h2>
        <div className="admin-form-grid">
          <label>
            Количество ключей (1–200)
            <input type="number" min={1} max={200} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          </label>
          <label>
            Слотов серверов за ключ
            <input
              type="number"
              min={0}
              value={grantServers}
              onChange={(e) => setGrantServers(Number(e.target.value))}
            />
          </label>
          <label>
            Монет за ключ
            <input type="number" min={0} value={grantCoins} onChange={(e) => setGrantCoins(Number(e.target.value))} />
          </label>
          <label>
            Макс. активаций на ключ
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} />
          </label>
          <label>
            Срок действия (дней, пусто = бессрочно)
            <input
              type="number"
              min={0}
              placeholder="например 30"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </label>
          <label>
            Префикс кода (опционально)
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="VIP" />
          </label>
        </div>
        <button type="button" className="btn" onClick={generate}>
          Сгенерировать
        </button>
        {generated.length > 0 ? (
          <ul className="list">
            {generated.map((k) => (
              <li key={k}>
                <code>{k}</code>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="card stack">
        <h2>Список ключей</h2>
        <div className="row">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Все</option>
            <option value="unused">Не использованные</option>
            <option value="used">С активациями</option>
            <option value="expired">Просроченные / неактивные</option>
          </select>
          <button type="button" className="btn secondary" onClick={loadKeys}>
            Обновить
          </button>
          {unusedIds.length > 0 ? (
            <button type="button" className="btn ghost" onClick={() => deleteSelected(unusedIds)}>
              Удалить все неиспользованные в списке ({unusedIds.length})
            </button>
          ) : null}
        </div>
        <ul className="list keys-list">
          {keys.map((k) => (
            <li key={k.id} className="row between">
              <span>
                <code>{k.code}</code>
                <span className="muted">
                  {" "}
                  · +{k.grantServers} сл. · +{k.grantCoins} мон. · {k.usesCount}/{k.maxUses} · {k.status}
                </span>
              </span>
              <button type="button" className="btn sm ghost" onClick={() => deleteSelected([k.id])}>
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack">
        <h2>Массовое удаление</h2>
        <div className="admin-form-grid">
          <label>
            Неиспользованные старше (дней)
            <input type="number" min={0} value={purgeDays} onChange={(e) => setPurgeDays(Number(e.target.value))} />
          </label>
        </div>
        <div className="row">
          <label className="admin-check">
            <input type="checkbox" checked={purgeExpired} onChange={(e) => setPurgeExpired(e.target.checked)} />
            Просроченные
          </label>
          <label className="admin-check">
            <input type="checkbox" checked={purgeInactive} onChange={(e) => setPurgeInactive(e.target.checked)} />
            Деактивированные
          </label>
          <label className="admin-check">
            <input type="checkbox" checked={purgeDepleted} onChange={(e) => setPurgeDepleted(e.target.checked)} />
            Исчерпанные (uses = max)
          </label>
        </div>
        <button type="button" className="btn danger" onClick={purge}>
          Удалить по условиям
        </button>
      </section>
    </div>
  );
}

function AdminPromoPanel({
  onError,
  onMsg,
}: {
  onError: (s: string) => void;
  onMsg: (s: string) => void;
}) {
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [code, setCode] = useState("");
  const [rewardCoins, setRewardCoins] = useState(5);
  const [maxUses, setMaxUses] = useState(999999);

  const load = () =>
    void fetch("/api/admin/promo")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else setPromos(d.promos ?? []);
      });

  useEffect(() => {
    load();
  }, []);

  function create() {
    void fetch("/api/admin/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, rewardCoins, maxUses }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else {
          onMsg(`Промокод ${d.code} создан`);
          setCode("");
          load();
        }
      });
  }

  return (
    <div className="stack">
      <section className="card stack">
        <h2>Создать промокод</h2>
        <p className="muted">Платформенные промокоды выдают монеты при активации в кабинете (не путать с ключами лаунчера).</p>
        <div className="admin-form-grid">
          <label>
            Код
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER10" />
          </label>
          <label>
            Монет за активацию
            <input type="number" min={0} value={rewardCoins} onChange={(e) => setRewardCoins(Number(e.target.value))} />
          </label>
          <label>
            Макс. использований
            <input type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))} />
          </label>
        </div>
        <button type="button" className="btn" onClick={create}>
          Создать промокод
        </button>
      </section>

      <section className="card">
        <h2>Рефералы медиагигантов</h2>
        <p className="muted">Персональные коды, созданные пользователями с ролью mediagigant.</p>
        {promos.filter((p) => p.kind === "referral").length === 0 ? (
          <p className="muted">Пока нет реферальных промокодов.</p>
        ) : (
          <ul className="list">
            {promos
              .filter((p) => p.kind === "referral")
              .sort((a, b) => b.usesCount - a.usesCount)
              .map((p) => (
                <li key={p.id} className="row between">
                  <span>
                    <strong>{p.code}</strong>
                    <span className="muted">
                      {" "}
                      · {p.ownerNickname ?? "—"} · <strong>{p.usesCount}</strong> привели · +{p.rewardCoins} мон.
                      {!p.isActive ? " · выкл" : ""}
                    </span>
                  </span>
                  <div className="row">
                    <button
                      type="button"
                      className="btn sm secondary"
                      onClick={() =>
                        void fetch("/api/admin/promo", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
                        }).then(() => load())
                      }
                    >
                      {p.isActive ? "Выключить" : "Включить"}
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2>Платформенные промокоды</h2>
        <ul className="list">
          {promos.filter((p) => p.kind !== "referral").map((p) => (
            <li key={p.id} className="row between">
              <span>
                <strong>{p.code}</strong>
                <span className="muted">
                  {" "}
                  · +{p.rewardCoins} мон. · {p.usesCount}/{p.maxUses}
                  {!p.isActive ? " · выкл" : ""}
                </span>
              </span>
              <div className="row">
                <button
                  type="button"
                  className="btn sm secondary"
                  onClick={() =>
                    void fetch("/api/admin/promo", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
                    }).then(() => load())
                  }
                >
                  {p.isActive ? "Выключить" : "Включить"}
                </button>
                <button
                  type="button"
                  className="btn sm ghost"
                  onClick={() => {
                    if (!confirm(`Удалить ${p.code}?`)) return;
                    void fetch("/api/admin/promo", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: p.id }),
                    }).then(() => load());
                  }}
                >
                  Удалить
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
