import { sql } from "drizzle-orm";
import { db, schema } from "@/server/db";

export function nicknameEquals(nickname: string) {
  const trimmed = nickname.trim();
  return sql`lower(${schema.users.nickname}) = lower(${trimmed})`;
}

export async function findUserByNickname(nickname: string) {
  const trimmed = nickname.trim();
  if (!trimmed) return undefined;

  const [row] = await db
    .select()
    .from(schema.users)
    .where(nicknameEquals(trimmed))
    .limit(1);

  return row;
}

export async function findUserByLoginIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) return undefined;

  const byEmail = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, trimmed.toLowerCase()),
  });
  if (byEmail) return byEmail;

  return findUserByNickname(trimmed);
}
