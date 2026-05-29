import { eq } from "drizzle-orm";
import { err, json, withSchema } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { devices } from "@/db/schema";
import { resolveEntitlements } from "@/lib/entitlements";
export const GET = withSchema(async () => {
  const user = await getSessionUser();
  if (!user) return err("unauthorized", 401);

  const db = getDb();
  const devs = await db
    .select({
      id: devices.id,
      name: devices.name,
      os: devices.os,
      appVersion: devices.appVersion,
      runningServers: devices.runningServers,
      lastSeenAt: devices.lastSeenAt,
      createdAt: devices.createdAt,
    })
    .from(devices)
    .where(eq(devices.userId, user.id));

  const active = devs.filter((d) => !d.lastSeenAt || true);
  const ent = await resolveEntitlements(user);

  return json({
    user,
    entitlements: ent,
    devices: active.map((d) => ({
      id: d.id,
      name: d.name,
      os: d.os,
      appVersion: d.appVersion,
      runningServers: d.runningServers,
      lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
      createdAt: d.createdAt.toISOString(),
    })),
  });
});
