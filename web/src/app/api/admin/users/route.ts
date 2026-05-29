import { desc } from "drizzle-orm";
import { json, withSchema } from "@/lib/api";
import { requireCreator } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { users, entitlements, devices } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const GET = withSchema(async () => {
  const auth = await requireCreator();
  if (!auth.ok) return auth.response;

  const db = getDb();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);

  const result = await Promise.all(
    rows.map(async (u) => {
      const ent = (await db.select().from(entitlements).where(eq(entitlements.userId, u.id)).limit(1))[0];
      const devCount = (
        await db
          .select({ c: sql<number>`count(*)` })
          .from(devices)
          .where(eq(devices.userId, u.id))
      )[0];
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        banned: Boolean(u.bannedAt),
        canCreateServers: ent?.canCreateServers ?? false,
        maxServers: ent?.maxServers ?? 0,
        devices: Number(devCount?.c ?? 0),
        createdAt: u.createdAt.toISOString(),
      };
    }),
  );

  return json({ users: result });
});
