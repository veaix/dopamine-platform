import { getDashboardUser } from "@/server/dashboard/profile";
import { getFriendsBundle } from "@/server/friends/bundle";
import { getOwnedGiftKeys } from "@/server/keys/inventory";
import { DashboardClient } from "@/components/dashboard-client";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth-guard";
import { ensureTrialWindowStarted } from "@/server/trial-server";
import { db } from "@/server/db";

export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  await ensureTrialWindowStarted(user.id);
  const refreshed = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, user.id),
  });
  const me = refreshed ?? user;

  const [initialMe, initialFriends, initialOwnedKeys] = await Promise.all([
    getDashboardUser(me),
    getFriendsBundle(me.id),
    getOwnedGiftKeys(me.id),
  ]);

  return (
    <PageShell className="page-dashboard" decor="dashboard">
      <DashboardClient
        initialMe={initialMe}
        initialFriends={initialFriends}
        initialOwnedKeys={initialOwnedKeys}
      />
    </PageShell>
  );
}
