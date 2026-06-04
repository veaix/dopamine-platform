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
      avatarUrl: sql<string | null>`CASE
        WHEN ${schema.users.avatarUrl} IS NULL THEN NULL
        WHEN length(${schema.users.avatarUrl}) > 512 THEN NULL
        WHEN substr(${schema.users.avatarUrl}, 1, 5) = 'data:' THEN NULL
        ELSE ${schema.users.avatarUrl}
      END`,
    })
    .from(schema.users)
    .where(nicknameEquals(trimmed))
    .limit(1);

  return row;
}
