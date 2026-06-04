import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { generateSixDigitCode } from "@/server/utils/crypto";
import { newId } from "@/server/utils/ids";
import { nicknameEquals } from "@/server/users/lookup";

const CODE_TTL_MS = 10 * 60 * 1000;

export async function findPendingByEmail(email: string) {
  return db.query.pendingRegistrations.findFirst({
    where: (p, { eq: eqFn }) => eqFn(p.email, email),
  });
}

export async function findPendingByEmailAndCode(email: string, code: string) {
  return db.query.pendingRegistrations.findFirst({
    where: (p, { and: andFn, eq: eqFn, gt: gtFn }) =>
      andFn(eqFn(p.email, email), eqFn(p.code, code), gtFn(p.expiresAt, new Date())),
  });
}

export async function isNicknameTaken(
  nickname: string,
  opts?: { exceptEmail?: string; exceptUserId?: string },
) {
  const [userRow] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(nicknameEquals(nickname))
    .limit(1);
  if (userRow && userRow.id !== opts?.exceptUserId) return true;

  const [pendingRow] = await db
    .select({ email: schema.pendingRegistrations.email })
    .from(schema.pendingRegistrations)
    .where(sql`lower(${schema.pendingRegistrations.nickname}) = lower(${nickname.trim()})`)
    .limit(1);

  if (!pendingRow) return false;
  if (opts?.exceptEmail && pendingRow.email.toLowerCase() === opts.exceptEmail.toLowerCase()) return false;
  return true;
}

export async function upsertPendingRegistration(input: {
  nickname: string;
  email: string;
  passwordHash: string;
  registrationIp: string | null;
}) {
  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  await db
    .insert(schema.pendingRegistrations)
    .values({
      id: newId(),
      nickname: input.nickname,
      email: input.email,
      passwordHash: input.passwordHash,
      registrationIp: input.registrationIp,
      code,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: schema.pendingRegistrations.email,
      set: {
        nickname: input.nickname,
        passwordHash: input.passwordHash,
        registrationIp: input.registrationIp,
        code,
        expiresAt,
        createdAt: new Date(),
      },
    });

  return code;
}

export async function refreshPendingCode(email: string) {
  const code = generateSixDigitCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await db
    .update(schema.pendingRegistrations)
    .set({ code, expiresAt, createdAt: new Date() })
    .where(eq(schema.pendingRegistrations.email, email));
  return code;
}

export async function deletePendingByEmail(email: string) {
  await db.delete(schema.pendingRegistrations).where(eq(schema.pendingRegistrations.email, email));
}

export async function countPendingFromIp(ip: string, since: Date) {
  const rows = await db
    .select({ id: schema.pendingRegistrations.id })
    .from(schema.pendingRegistrations)
    .where(
      and(eq(schema.pendingRegistrations.registrationIp, ip), gte(schema.pendingRegistrations.createdAt, since)),
    );
  return rows.length;
}

export async function createUserFromPending(pending: typeof schema.pendingRegistrations.$inferSelect) {
  const userId = newId();
  const now = new Date();

  await db.insert(schema.users).values({
    id: userId,
    nickname: pending.nickname,
    email: pending.email,
    passwordHash: pending.passwordHash,
    registrationIp: pending.registrationIp,
    emailVerifiedAt: now,
    trialWindowStartedAt: now,
    updatedAt: now,
  });

  await deletePendingByEmail(pending.email);

  return db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, userId),
  });
}

/** Legacy: unverified users created before deferred registration. */
export async function countLegacyUnverifiedFromIp(ip: string, since: Date) {
  const rows = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(
      and(
        eq(schema.users.registrationIp, ip),
        isNull(schema.users.emailVerifiedAt),
        gte(schema.users.createdAt, since),
      ),
    );
  return rows.length;
}
