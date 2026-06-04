import { desc, eq, like, or } from "drizzle-orm";
import { db, schema } from "@/server/db";

export type AdminUserListRow = {
  id: string;
  nickname: string;
  email: string;
  role: string;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
  totalServersCreated: number;
  isBlocked: boolean;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  createdAt: Date;
};

export type AdminUserDetailRow = AdminUserListRow & {
  bio: string | null;
  totpEnabled: boolean;
  emailVerifiedAt: Date | null;
  hiddenFromLeaderboards: boolean;
  registrationIp: string | null;
  adminPermissionsJson: string | null;
};

const listSelect = {
  id: schema.users.id,
  nickname: schema.users.nickname,
  email: schema.users.email,
  role: schema.users.role,
  coinsBalance: schema.users.coinsBalance,
  availableServerSlots: schema.users.availableServerSlots,
  playtimeSeconds: schema.users.playtimeSeconds,
  totalServersCreated: schema.users.totalServersCreated,
  isBlocked: schema.users.isBlocked,
  lastLoginAt: schema.users.lastLoginAt,
  lastLoginIp: schema.users.lastLoginIp,
  createdAt: schema.users.createdAt,
} as const;

const detailExtra = {
  bio: schema.users.bio,
  totpEnabled: schema.users.totpEnabled,
  emailVerifiedAt: schema.users.emailVerifiedAt,
  hiddenFromLeaderboards: schema.users.hiddenFromLeaderboards,
  registrationIp: schema.users.registrationIp,
  adminPermissionsJson: schema.users.adminPermissionsJson,
} as const;

function toIso(d: Date | null | undefined): string | null {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function adminUserListJson(row: AdminUserListRow) {
  return {
    id: row.id,
    nickname: row.nickname,
    email: row.email,
    role: row.role,
    coinsBalance: row.coinsBalance,
    availableServerSlots: row.availableServerSlots,
    playtimeSeconds: row.playtimeSeconds,
    totalServersCreated: row.totalServersCreated ?? 0,
    isBlocked: row.isBlocked,
    lastLoginAt: toIso(row.lastLoginAt),
    lastLoginIp: row.lastLoginIp,
    createdAt: toIso(row.createdAt) ?? new Date(0).toISOString(),
  };
}

export function adminUserDetailJson(row: AdminUserDetailRow) {
  return {
    ...adminUserListJson(row),
    bio: row.bio,
    totpEnabled: row.totpEnabled,
    emailVerifiedAt: toIso(row.emailVerifiedAt),
    hiddenFromLeaderboards: row.hiddenFromLeaderboards,
    registrationIp: row.registrationIp,
  };
}

export async function searchAdminUsers(q: string, limit = 100): Promise<AdminUserListRow[]> {
  const cap = Math.min(Math.max(limit, 1), 100);
  if (q.trim()) {
    const pattern = `%${q.trim()}%`;
    return db
      .select(listSelect)
      .from(schema.users)
      .where(
        or(
          like(schema.users.nickname, pattern),
          like(schema.users.email, pattern),
          like(schema.users.lastLoginIp, pattern),
        ),
      )
      .limit(cap);
  }

  return db
    .select(listSelect)
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(cap);
}

export async function loadAdminUserDetail(id: string): Promise<AdminUserDetailRow | undefined> {
  const [row] = await db
    .select({ ...listSelect, ...detailExtra })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  return row;
}
