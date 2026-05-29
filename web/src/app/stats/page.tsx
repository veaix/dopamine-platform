import { ensureSchema } from "@/lib/db";
import { getPublicStats } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await ensureSchema();
  const stats = await getPublicStats();

  return (
    <div>
      <h1>Статистика dopamine</h1>
      <p className="label">Обновлено: {new Date(stats.updatedAt).toLocaleString()}</p>
      <div className="grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="card">
          <div className="label">Зарегистрировано</div>
          <div className="stat-value">{stats.registeredUsers}</div>
        </div>
        <div className="card">
          <div className="label">Привязано устройств</div>
          <div className="stat-value">{stats.linkedDevices}</div>
        </div>
        <div className="card">
          <div className="label">Онлайн (лаунчер, 5 мин)</div>
          <div className="stat-value">{stats.onlineDevices}</div>
        </div>
        <div className="card">
          <div className="label">Серверов запущено сейчас</div>
          <div className="stat-value">{stats.runningServersNow}</div>
        </div>
      </div>
      <p className="label" style={{ marginTop: "1rem" }}>
        Режим «серверы только по ключу»: {stats.serversGated ? "включён" : "выключен"}
      </p>
    </div>
  );
}
