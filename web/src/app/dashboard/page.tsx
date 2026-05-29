import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DashboardClient } from "@/components/dashboard-client";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { getDb } = await import("@/lib/db");
  const { ensureSchema } = await import("@/lib/db");
  const { devices } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { resolveEntitlements } = await import("@/lib/entitlements");

  await ensureSchema();
  const db = getDb();
  const devs = await db.select().from(devices).where(eq(devices.userId, user.id));
  const ent = await resolveEntitlements(user);

  return (
    <div className="site-main--narrow">
    <DashboardClient
      user={user}
      entitlements={ent}
      devices={devs
        .filter((d) => !d.revokedAt)
        .map((d) => ({
          id: d.id,
          name: d.name,
          os: d.os,
          appVersion: d.appVersion,
          runningServers: d.runningServers,
          lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
        }))}
    />
    </div>
  );
}
