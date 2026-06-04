import { PageShell } from "@/components/page-shell";
import { TopsClient } from "@/components/tops-client";

/** Avoid blocking SSR on slow leaderboard queries (Turso). */
export const dynamic = "force-dynamic";

export default function TopsPage() {
  return (
    <PageShell
      decor="tops"
      tag="Рейтинг"
      title="Топы игроков"
      subtitle="Соревнуйся по времени в игре, монетам, лайкам и слотам серверов."
    >
      <TopsClient />
    </PageShell>
  );
}
