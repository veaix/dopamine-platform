import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/server/db";
import { hashPassword } from "@/server/utils/crypto";
import { authCookieName } from "@/server/auth/session";
import { verifyTotpCode } from "@/server/auth/totp";
import { revokeUserDevices } from "@/server/auth/device";
import { clientIp } from "@/server/admin/client-ip";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { json, err } from "@/lib/api";

const CONFIRM_LIMIT = 8;
const CONFIRM_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    code?: string;
    password?: string;
    totpCode?: string;
  } | null;
  const email = body?.email?.toLowerCase().trim();
  const code = body?.code?.trim();
  const password = body?.password;
  const totpCode = body?.totpCode?.trim();
  if (!email || !code || !password || password.length < 8) return err("Неверные данные", 400);

  const rate = await enforceRateLimit(`auth:password-confirm:${email}`, ip, CONFIRM_LIMIT, CONFIRM_WINDOW_MS);
  if (!rate.ok) return err(rate.message, 429);

  const user = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });
  if (!user || user.isBlocked) return err("Код истёк или неверный", 400);

  const item = await db.query.emailCodes.findFirst({
    where: (codes, { and: andFn }) =>
      andFn(
        eq(codes.userId, user.id),
        eq(codes.type, "reset_password"),
        eq(codes.code, code),
        gt(codes.expiresAt, new Date()),
        isNull(codes.consumedAt),
      ),
  });
  if (!item) return err("Код истёк или неверный", 400);

  if (user.totpEnabled) {
    if (!totpCode) return err("Нужен код 2FA", 403, { needsTotp: true });
    if (!user.totpSecret || !(await verifyTotpCode(user.totpSecret, totpCode))) {
      return err("Неверный код 2FA", 401);
    }
  }

  const passwordHash = await hashPassword(password);
  await db.update(schema.emailCodes).set({ consumedAt: new Date() }).where(eq(schema.emailCodes.id, item.id));
  await db.update(schema.users).set({ passwordHash, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
  await db.update(schema.sessions).set({ revokedAt: new Date() }).where(eq(schema.sessions.userId, user.id));
  await revokeUserDevices(user.id);

  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);

  return json({ ok: true });
}
