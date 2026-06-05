import { sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { nicknameEquals } from "@/server/users/lookup";

/** Профиль без тяжёлого avatar_url (base64) из БД. */
export async function findUserProfileByNickname(nickname: string) {
  const trimmed = nickname.trim();
  if (!trimmed) return undefined;

  const [row] = await db
    .select({
      id: schema.users.id,
      nickname: schema.users.nickname,
      role: schema.users.role,
      bio: schema.users.bio,
      socialLinksJson: schema.users.socialLinksJson,
      playtimeSeconds: schema.users.playtimeSeconds,
      emailVerifiedAt: schema.users.emailVerifiedAt,
      email: schema.users.email,
      hasAvatar: sql<number>`CASE
        WHEN ${schema.users.avatarUrl} IS NOT NULL AND length(${schema.users.avatarUrl}) > 0 THEN 1
        ELSE 0
      END`,
      updatedAt: schema.users.updatedAt,
    })
    .from(schema.users)
    .where(nicknameEquals(trimmed))
    .limit(1);

  if (!row) return undefined;
  return { ...row, hasAvatar: Boolean(row.hasAvatar) };
}
