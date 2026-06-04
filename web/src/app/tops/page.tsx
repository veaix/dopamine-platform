import { PageShell } from "@/components/page-shell";
import { TopsClient } from "@/components/tops-client";
import { getCurrentUser } from "@/server/auth/session";
import { getPublicLeaderboards } from "@/server/leaderboards";

export const dynamic = "force-dynamic";

export default async function TopsPage() {
  const [initialData, user] = await Promise.all([getPublicLeaderboards(), getCurrentUser()]);
  const loadMeRanks = Boolean(user && !user.hiddenFromLeaderboards);

  return (
    <PageShell
      decor="tops"
      tag="Рейтинг"
      title="Топы игроков"
      subtitle="Соревнуйтесь по времени в игре, монетам, лайкам и слотам серверов."
    >
      <TopsClient initialData={initialData} loadMeRanks={loadMeRanks} />
    </PageShell>
  );
}
