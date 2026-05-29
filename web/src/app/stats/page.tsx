import { ensureSchema } from "@/lib/db";
import { getPublicStats } from "@/lib/entitlements";
import { LiveStats } from "@/components/marketing/live-stats";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  await ensureSchema();
  const stats = await getPublicStats();

  return (
    <div className="site-main--narrow">
      <div className="page-header">
        <h1>Статистика dopamine</h1>
        <p>Агрегированные данные с привязанных лаунчеров (heartbeat)</p>
      </div>
      <LiveStats />
      <p className="label" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        Обновлено: {new Date(stats.updatedAt).toLocaleString("ru-RU")} · режим «только по ключу»:{" "}
        {stats.serversGated ? "включён" : "выключен"}
      </p>
    </div>
  );
}
