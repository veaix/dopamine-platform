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
  avatarUrl: string | null;
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
      avatarUrl: sql<string | null>`CASE
        WHEN ${schema.users.avatarUrl} IS NULL THEN NULL
        WHEN length(${schema.users.avatarUrl}) > 512 THEN NULL
        WHEN substr(${schema.users.avatarUrl}, 1, 5) = 'data:' THEN NULL
        ELSE ${schema.users.avatarUrl}
      END`,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  return row;
}
