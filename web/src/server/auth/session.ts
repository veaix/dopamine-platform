import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { verifyAccessToken } from "./tokens";
import { isEmailVerifiedForAuth } from "./email-verification";
import type { SessionDbUser } from "./session-user-columns";

const COOKIE_NAME = "dopamine_access";

export type { SessionDbUser };

export const getCurrentUser = cache(async function getCurrentUser(): Promise<SessionDbUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token);
    const [row] = await db
      .select({
        id: schema.users.id,
        nickname: schema.users.nickname,
        email: schema.users.email,
        passwordHash: schema.users.passwordHash,
        role: schema.users.role,
        isBlocked: schema.users.isBlocked,
        emailVerifiedAt: schema.users.emailVerifiedAt,
        coinsBalance: schema.users.coinsBalance,
        availableServerSlots: schema.users.availableServerSlots,
        playtimeSeconds: schema.users.playtimeSeconds,
        hiddenFromLeaderboards: schema.users.hiddenFromLeaderboards,
        adminPermissionsJson: schema.users.adminPermissionsJson,
        bioEditedAt: schema.users.bioEditedAt,
        totpEnabled: schema.users.totpEnabled,
        totpSecret: schema.users.totpSecret,
        hasAvatar: sql<number>`CASE
          WHEN ${schema.users.avatarUrl} IS NOT NULL AND length(${schema.users.avatarUrl}) > 0 THEN 1
          ELSE 0
        END`,
        updatedAt: schema.users.updatedAt,
      })
      .from(schema.users)
      .where(and(eq(schema.users.id, payload.sub), eq(schema.users.isBlocked, false)))
      .limit(1);

    const user = row
      ? { ...row, hasAvatar: Boolean(row.hasAvatar) }
      : null;
    if (!user || !isEmailVerifiedForAuth(user)) return null;
    return user;
  } catch {
    return null;
  }
});

export const authCookieName = COOKIE_NAME;
