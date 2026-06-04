import { getCurrentUser } from "@/server/auth/session";
import { getLeaderboards } from "@/server/leaderboards";
import { PageShell } from "@/components/page-shell";
import { TopsClient } from "@/components/tops-client";

export default async function TopsPage() {
  const viewer = await getCurrentUser();
  const initialData = await getLeaderboards(viewer);

  return (
    <PageShell
      decor="tops"
      tag="Рейтинг"
      title="Топы игроков"
      subtitle="Соревнуйся по времени в игре, монетам, лайкам и слотам серверов."
    >
      <TopsClient initialData={initialData} />
    </PageShell>
  );
}
