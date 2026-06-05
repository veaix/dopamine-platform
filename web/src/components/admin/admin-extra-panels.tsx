"use client";

import { useEffect, useState } from "react";

export function AdminCreatorUnlimitedPanel() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    void fetch("/api/creator/unlimited")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) {
          setErr(d.error ?? "Ошибка загрузки");
          return;
        }
        setEnabled(Boolean(d.enabled));
      })
      .catch(() => setErr("Не удалось загрузить настройку"))
      .finally(() => setLoading(false));
  }, []);

  async function save(next: boolean) {
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const r = await fetch("/api/creator/unlimited", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      const d = await r.json();
      if (!r.ok) {
        setErr(d.error ?? "Ошибка сохранения");
        return;
      }
      setEnabled(Boolean(d.enabled));
      setMsg(d.enabled ? "Безлимит включён" : "Безлимит выключен — обычные лимиты");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <section className="card stack sm">
      <h2>Режим создателя</h2>
      <p className="muted">
        Когда включено: у аккаунта <strong>creator</strong> бесконечные монеты, слоты серверов и создание
        серверов без списаний. Выключите, чтобы проверить обычный опыт пользователя.
      </p>
      <label className="row" style={{ alignItems: "center", gap: "0.5rem" }}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={saving}
          onChange={(e) => void save(e.target.checked)}
        />
        <span>Безлимит для создателя</span>
      </label>
      {err ? <p className="error">{err}</p> : null}
      {msg ? <p className="info">{msg}</p> : null}
    </section>
  );
}

export function AdminDashboardPanel({ isCreator = false }: { isCreator?: boolean }) {
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void fetch("/api/admin/stats")
      .then((r) => r.json())
      .then(setStats);
  }, []);

  if (!stats || stats.error) return <p className="muted">Загрузка статистики…</p>;

  const users = stats.users as Record<string, number>;
  const activity = stats.activity as Record<string, number>;
  const keys = stats.keys as Record<string, number>;

  return (
    <section className="stack">
      {isCreator ? <AdminCreatorUnlimitedPanel /> : null}
      <div className="grid stats">
        <div className="card stat">
          <span>Всего пользователей</span>
          <strong>{users.total}</strong>
        </div>
        <div className="card stat">
          <span>Подтверждённых</span>
          <strong>{users.verified}</strong>
        </div>
        <div className="card stat">
          <span>Регистраций сегодня</span>
          <strong>{users.registeredToday}</strong>
        </div>
        <div className="card stat">
          <span>Регистраций за неделю</span>
          <strong>{users.registeredWeek}</strong>
        </div>
        <div className="card stat">
          <span>Монет в обороте</span>
          <strong>{users.coinsInCirculation}</strong>
        </div>
        <div className="card stat">
          <span>Заблокировано</span>
          <strong>{users.blocked}</strong>
        </div>
        <div className="card stat">
          <span>Входов сегодня</span>
          <strong>{activity.loginsToday}</strong>
        </div>
        <div className="card stat">
          <span>Устройств лаунчера</span>
          <strong>{activity.activeDevices}</strong>
        </div>
        <div className="card stat">
          <span>Ключей / неисп.</span>
          <strong>
            {keys.total} / {keys.unused}
          </strong>
        </div>
      </div>
    </section>
  );
}

export function AdminAuditPanel() {
  const [entries, setEntries] = useState<
    {
      id: string;
      adminNickname: string;
      action: string;
      targetType: string | null;
      details: Record<string, unknown>;
      createdAt: string;
    }[]
  >([]);

  useEffect(() => {
    void fetch("/api/admin/audit?limit=150")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries ?? []));
  }, []);

  return (
    <section className="card stack">
      <h2>Журнал действий админов</h2>
      <ul className="list">
        {entries.map((e) => (
          <li key={e.id}>
            <strong>{e.adminNickname}</strong>
            <span className="muted"> · {e.action}</span>
            {e.targetType ? <span className="muted"> · {e.targetType}</span> : null}
            <br />
            <span className="muted" style={{ fontSize: "0.82rem" }}>
              {new Date(e.createdAt).toLocaleString("ru-RU")}
              {Object.keys(e.details).length ? ` · ${JSON.stringify(e.details)}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminEmailPanel({ onMsg, onError }: { onMsg: (s: string) => void; onError: (s: string) => void }) {
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("verified");
  const [busy, setBusy] = useState(false);

  function send() {
    setBusy(true);
    onError("");
    void fetch("/api/admin/email/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, text, filter }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) onError(d.error);
        else onMsg(`Отправлено: ${d.sent}, ошибок: ${d.failed}, всего: ${d.total}`);
      })
      .finally(() => setBusy(false));
  }

  return (
    <section className="card stack">
      <h2>Массовая рассылка email</h2>
      <p className="muted">Через Resend. Не злоупотребляй — каждое письмо уходит отдельно.</p>
      <label>
        Кому
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="verified">Подтверждённые email</option>
          <option value="all">Все не заблокированные</option>
          <option value="unverified">Без подтверждения email</option>
          <option value="blocked">Только заблокированные</option>
        </select>
      </label>
      <label>
        Тема
        <input value={subject} onChange={(e) => setSubject(e.target.value)} />
      </label>
      <label>
        Текст
        <textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      <button type="button" className="btn" disabled={busy} onClick={send}>
        {busy ? "Отправка…" : "Отправить рассылку"}
      </button>
    </section>
  );
}

export function AdminFraudPanel() {
  const [data, setData] = useState<{
    registrationMaxPerIp: number;
    maxUnverifiedPerIp: number;
    trialServerEnabled: boolean;
    limitsSource: "database" | "env" | "default";
    registrationDuplicates: { ip: string; count: number; users: { nickname: string; email: string }[] }[];
    unverifiedIpClusters: { ip: string; count: number }[];
    loginIpClusters: { ip: string; count: number }[];
    recentSecurityEvents: {
      id: string;
      eventType: string;
      ipAddress: string | null;
      details: Record<string, unknown>;
      createdAt: string;
    }[];
    protections: { turnstile: boolean; disposableEmailBlock: boolean; rateLimits: boolean; honeypot: boolean };
  } | null>(null);
  const [maxPerIp, setMaxPerIp] = useState(3);
  const [maxUnverified, setMaxUnverified] = useState(5);
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveErr, setSaveErr] = useState("");
  const [loadErr, setLoadErr] = useState("");
  const [saving, setSaving] = useState(false);

  const eventLabels: Record<string, string> = {
    rate_limit: "Rate limit",
    honeypot: "Honeypot (бот)",
    form_too_fast: "Слишком быстрая форма",
    disposable_email: "Одноразовый email",
    turnstile_fail: "Turnstile не пройден",
    unverified_ip_block: "Блок неподтверждённых",
    registration_ip_limit: "Лимит регистраций IP",
  };

  function load() {
    setLoadErr("");
    void fetch("/api/admin/fraud")
      .then(async (r) => {
        const d = (await r.json()) as {
          error?: string;
          registrationMaxPerIp?: number;
          maxUnverifiedPerIp?: number;
          trialServerEnabled?: boolean;
        };
        if (!r.ok) {
          setLoadErr(d.error ?? `Ошибка ${r.status}`);
          setData(null);
          return;
        }
        setData(d as NonNullable<typeof data>);
        setMaxPerIp(d.registrationMaxPerIp ?? 3);
        setMaxUnverified(d.maxUnverifiedPerIp ?? 5);
        setTrialEnabled(d.trialServerEnabled ?? true);
      })
      .catch(() => {
        setLoadErr("Не удалось загрузить антифрод");
        setData(null);
      });
  }

  useEffect(() => {
    load();
  }, []);

  async function saveLimits() {
    setSaving(true);
    setSaveMsg("");
    setSaveErr("");
    try {
      const r = await fetch("/api/admin/fraud", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationMaxPerIp: maxPerIp,
          maxUnverifiedPerIp: maxUnverified,
          trialServerEnabled: trialEnabled,
        }),
      });
      const d = await r.json();
      if (!r.ok) {
        setSaveErr(d.error ?? "Ошибка сохранения");
        return;
      }
      setSaveMsg("Лимиты сохранены");
      load();
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
    return (
      <div className="stack sm">
        <p className="muted">{loadErr ? null : "Загрузка…"}</p>
        {loadErr ? (
          <>
            <p className="error">{loadErr}</p>
            <button type="button" className="btn secondary" onClick={load}>
              Повторить
            </button>
          </>
        ) : null}
      </div>
    );
  }

  const sourceHint =
    data.limitsSource === "database"
      ? "сохранено в базе"
      : data.limitsSource === "env"
        ? "из env (ещё не меняли в админке)"
        : "по умолчанию";

  return (
    <div className="stack">
      <section className="card stack sm">
        <h2>Антифрод</h2>
        <p className="muted">Текущий источник лимитов: {sourceHint}</p>

        <div className="admin-fraud-limits">
          <label>
            Регистраций с одного IP за 24ч
            <input
              type="number"
              min={1}
              max={100}
              value={maxPerIp}
              onChange={(e) => setMaxPerIp(Math.min(100, Math.max(1, Number(e.target.value) || 1)))}
            />
          </label>
          <label>
            Неподтверждённых с IP за 7 дней
            <input
              type="number"
              min={1}
              max={100}
              value={maxUnverified}
              onChange={(e) =>
                setMaxUnverified(Math.min(100, Math.max(1, Number(e.target.value) || 1)))
              }
            />
          </label>
          <button type="button" className="btn" disabled={saving} onClick={() => void saveLimits()}>
            {saving ? "Сохранение…" : "Сохранить настройки"}
          </button>
        </div>
        <label className="row" style={{ alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
          <input
            type="checkbox"
            checked={trialEnabled}
            onChange={(e) => setTrialEnabled(e.target.checked)}
          />
          <span>Пробный сервер в лаунчере (5 часов для новых аккаунтов)</span>
        </label>
        {!trialEnabled ? (
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>
            Баннер на сайте и создание пробного сервера в лаунчере отключены.
          </p>
        ) : null}
        {saveErr ? <p className="error">{saveErr}</p> : null}
        {saveMsg ? <p className="info">{saveMsg}</p> : null}

        <ul className="list" style={{ marginTop: "0.75rem" }}>
          <li>Turnstile CAPTCHA: {data.protections.turnstile ? "✓ включён" : "⚠ нужны ключи в env"}</li>
          <li>Blocklist одноразовых email: ✓</li>
          <li>Rate limit auth API: ✓</li>
          <li>Honeypot + задержка формы: ✓</li>
        </ul>
      </section>

      <section className="card stack">
        <h3>Недавние блокировки и подозрительные попытки</h3>
        {data.recentSecurityEvents.length === 0 ? (
          <p className="muted">Пока пусто</p>
        ) : (
          <ul className="list">
            {data.recentSecurityEvents.map((e) => (
              <li key={e.id}>
                <strong>{eventLabels[e.eventType] ?? e.eventType}</strong>
                {e.ipAddress ? ` · ${e.ipAddress}` : ""}
                <span className="muted"> · {new Date(e.createdAt).toLocaleString("ru-RU")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h3>IP с неподтверждёнными аккаунтами (7 дней)</h3>
        {data.unverifiedIpClusters.length === 0 ? (
          <p className="muted">Подозрительных IP не найдено</p>
        ) : (
          <ul className="list">
            {data.unverifiedIpClusters.map((row) => (
              <li key={row.ip ?? "unknown"}>
                {row.ip} · {row.count} неподтверждённых
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack">
        <h3>Один IP — несколько регистраций</h3>
        {data.registrationDuplicates.length === 0 ? (
          <p className="muted">Подозрительных IP не найдено</p>
        ) : (
          data.registrationDuplicates.map((row) => (
            <div key={row.ip} className="card" style={{ padding: "0.75rem" }}>
              <strong>{row.ip}</strong> · {row.count} акк.
              <ul className="list">
                {row.users.map((u) => (
                  <li key={u.nickname}>
                    {u.nickname} · {u.email}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      <section className="card stack">
        <h3>IP последнего входа (кластеры)</h3>
        <ul className="list">
          {data.loginIpClusters.map((r) => (
            <li key={r.ip ?? "unknown"}>
              {r.ip} · {r.count} аккаунтов
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
