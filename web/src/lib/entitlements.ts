import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/lib/db";
import { appSettings, devices, entitlements, users } from "@/db/schema";
import type { SessionUser } from "@/lib/auth";
import { hashToken } from "@/lib/crypto";

export type EntitlementView = {
  canCreateServers: boolean;
  maxServers: number;
  serversGated: boolean;
  role: SessionUser["role"];
  expiresAt: string | null;
  source: string;
};

export type Grants = {
  canCreateServers?: boolean;
  maxServers?: number;
  expiresInDays?: number;
};

export async function getAppSetting(key: string, fallback: string): Promise<string> {
  const db = getDb();
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return rows[0]?.value ?? fallback;
}

export async function setAppSetting(key: string, value: string): Promise<void> {
  const db = getDb();
  await db
    .insert(appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function isServersGated(): Promise<boolean> {
  return (await getAppSetting("servers_gated", "true")) === "true";
}

export async function ensureUserEntitlement(userId: string): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(1);
  if (existing[0]) return;
  await db.insert(entitlements).values({
    id: nanoid(),
    userId,
    canCreateServers: false,
    maxServers: 0,
    source: "default",
    updatedAt: new Date(),
  });
}

export async function resolveEntitlements(user: SessionUser): Promise<EntitlementView> {
  const db = getDb();
  await ensureUserEntitlement(user.id);
  const gated = await isServersGated();
  const row = (await db.select().from(entitlements).where(eq(entitlements.userId, user.id)).limit(1))[0]!;

  if (user.role === "creator") {
    return {
      canCreateServers: true,
      maxServers: 999,
      serversGated: gated,
      role: user.role,
      expiresAt: null,
      source: "creator",
    };
  }

  if (user.role === "tester") {
    const exp = row.expiresAt;
    const active = !exp || exp.getTime() > Date.now();
    return {
      canCreateServers: active,
      maxServers: Math.max(row.maxServers, 5),
      serversGated: gated,
      role: user.role,
      expiresAt: exp?.toISOString() ?? null,
      source: row.source,
    };
  }

  const exp = row.expiresAt;
  const notExpired = !exp || exp.getTime() > Date.now();
  const canCreate = Boolean(row.canCreateServers) && notExpired;
  return {
    canCreateServers: gated ? canCreate : true,
    maxServers: row.maxServers,
    serversGated: gated,
    role: user.role,
    expiresAt: exp?.toISOString() ?? null,
    source: row.source,
  };
}

export async function applyGrants(userId: string, grants: Grants, source: string): Promise<void> {
  const db = getDb();
  await ensureUserEntitlement(userId);
  const existing = (await db.select().from(entitlements).where(eq(entitlements.userId, userId)).limit(1))[0]!;
  let expiresAt = existing.expiresAt;
  if (grants.expiresInDays && grants.expiresInDays > 0) {
    expiresAt = new Date(Date.now() + grants.expiresInDays * 24 * 60 * 60 * 1000);
  }
  await db
    .update(entitlements)
    .set({
      canCreateServers: grants.canCreateServers ?? existing.canCreateServers,
      maxServers: grants.maxServers ?? existing.maxServers,
      expiresAt,
      source,
      updatedAt: new Date(),
    })
    .where(eq(entitlements.userId, userId));
}

export async function getDeviceWithUser(deviceToken: string) {
  const db = getDb();
  const hash = hashToken(deviceToken);
  const dev = (
    await db
      .select()
      .from(devices)
      .where(and(eq(devices.tokenHash, hash), isNull(devices.revokedAt)))
      .limit(1)
  )[0];
  if (!dev) return null;
  const user = (await db.select().from(users).where(eq(users.id, dev.userId)).limit(1))[0];
  if (!user || user.bannedAt) return null;
  return { device: dev, user };
}

export async function getPublicStats() {
  const db = getDb();
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  const [{ count: userCount }] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [{ count: deviceCount }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(devices)
    .where(isNull(devices.revokedAt));
  const onlineDevices = await db
    .select({ count: sql<number>`count(*)` })
    .from(devices)
    .where(and(isNull(devices.revokedAt), gt(devices.lastSeenAt, new Date(fiveMinAgo))));
  const running = await db
    .select({ total: sql<number>`coalesce(sum(${devices.runningServers}), 0)` })
    .from(devices)
    .where(and(isNull(devices.revokedAt), gt(devices.lastSeenAt, new Date(fiveMinAgo))));
  return {
    registeredUsers: Number(userCount ?? 0),
    linkedDevices: Number(deviceCount ?? 0),
    onlineDevices: Number(onlineDevices[0]?.count ?? 0),
    runningServersNow: Number(running[0]?.total ?? 0),
    serversGated: await isServersGated(),
    updatedAt: new Date().toISOString(),
  };
}
