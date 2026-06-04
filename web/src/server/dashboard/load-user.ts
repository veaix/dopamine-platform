import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";

export type DashboardUserRow = {
  id: string;
  nickname: string;
  email: string;
  role: string;
  bio: string | null;
  socialLinksJson: string;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
  totpEnabled: boolean;
  bioEditedAt: Date | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
  hasAvatar: boolean;
};

export async function loadDashboardUserRow(userId: string): Promise<DashboardUserRow | undefined> {
  const [row] = await db
    .select({
      id: schema.users.id,
      nickname: schema.users.nickname,
      email: schema.users.email,
      role: schema.users.role,
      bio: schema.users.bio,
      socialLinksJson: schema.users.socialLinksJson,
      coinsBalance: schema.users.coinsBalance,
      availableServerSlots: schema.users.availableServerSlots,
      playtimeSeconds: schema.users.playtimeSeconds,
      totpEnabled: schema.users.totpEnabled,
      bioEditedAt: schema.users.bioEditedAt,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      createdAt: schema.users.createdAt,
      trialWindowStartedAt: schema.users.trialWindowStartedAt,
      trialServerUsedAt: schema.users.trialServerUsedAt,
      hasAvatar: sql<number>`CASE
        WHEN ${schema.users.avatarUrl} IS NOT NULL AND length(${schema.users.avatarUrl}) > 0 THEN 1
        ELSE 0
      END`,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!row) return undefined;
  return { ...row, hasAvatar: Boolean(row.hasAvatar) };
}
