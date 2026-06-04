import { getDashboardUser } from "@/server/dashboard/profile";
import { loadDashboardUserRow } from "@/server/dashboard/load-user";
import { EMPTY_FRIENDS } from "@/server/dashboard/empty";
import { DashboardClient } from "@/components/dashboard-client";
import { PageShell } from "@/components/page-shell";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-guard";
import { ensureTrialWindowStarted } from "@/server/trial-server";

export default async function DashboardPage() {
  const sessionUser = await requireUser("/dashboard");
  await ensureTrialWindowStarted(sessionUser.id);

  const row = await loadDashboardUserRow(sessionUser.id);
  if (!row) redirect("/login?next=/dashboard");

  const initialMe = await getDashboardUser(row);

  return (
    <PageShell className="page-dashboard" decor="dashboard">
      <DashboardClient
        initialMe={initialMe}
        initialFriends={EMPTY_FRIENDS}
        initialOwnedKeys={[]}
        loadExtrasLazy
      />
    </PageShell>
  );
}
