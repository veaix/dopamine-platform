import { gte, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { json } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdminApi("stats");
  if (error) return error;

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [userStatsRows, registeredTodayRows, registeredWeekRows, loginsTodayRows, keyStatsRows, promoStatsRows, deviceCountRows] =
    await Promise.all([
      db
        .select({
          total: sql<number>`count(*)`,
          verified: sql<number>`sum(case when ${schema.users.emailVerifiedAt} is not null then 1 else 0 end)`,
          blocked: sql<number>`sum(case when ${schema.users.isBlocked} = 1 then 1 else 0 end)`,
          coinsTotal: sql<number>`coalesce(sum(${schema.users.coinsBalance}), 0)`,
        })
        .from(schema.users),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(gte(schema.users.createdAt, dayAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(gte(schema.users.createdAt, weekAgo)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(schema.loginEvents)
        .where(gte(schema.loginEvents.createdAt, dayAgo)),
      db
        .select({
          total: sql<number>`count(*)`,
          unused: sql<number>`sum(case when ${schema.activationKeys.usesCount} = 0 then 1 else 0 end)`,
        })
        .from(schema.activationKeys),
      db
        .select({
          active: sql<number>`sum(case when ${schema.promoCodes.isActive} = 1 then 1 else 0 end)`,
        })
        .from(schema.promoCodes),
      db.select({ count: sql<number>`count(*)` }).from(schema.devices),
    ]);

  const userStats = userStatsRows[0];
  const registeredToday = registeredTodayRows[0];
  const registeredWeek = registeredWeekRows[0];
  const loginsToday = loginsTodayRows[0];
  const keyStats = keyStatsRows[0];
  const promoStats = promoStatsRows[0];
  const deviceCount = deviceCountRows[0];

  return json({
    users: {
      total: Number(userStats?.total ?? 0),
      verified: Number(userStats?.verified ?? 0),
      blocked: Number(userStats?.blocked ?? 0),
      registeredToday: Number(registeredToday?.count ?? 0),
      registeredWeek: Number(registeredWeek?.count ?? 0),
      coinsInCirculation: Number(userStats?.coinsTotal ?? 0),
    },
    activity: {
      loginsToday: Number(loginsToday?.count ?? 0),
      activeDevices: Number(deviceCount?.count ?? 0),
    },
    keys: {
      total: Number(keyStats?.total ?? 0),
      unused: Number(keyStats?.unused ?? 0),
    },
    promos: {
      active: Number(promoStats?.active ?? 0),
    },
  });
}
