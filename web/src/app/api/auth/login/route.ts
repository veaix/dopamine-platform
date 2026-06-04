import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { isEmailVerifiedForAuth } from "@/server/auth/email-verification";
import { db, schema } from "@/server/db";
import { verifyPassword } from "@/server/utils/crypto";
import { signAccessToken, accessTokenMaxAgeSec } from "@/server/auth/tokens";
import { authCookieName } from "@/server/auth/session";
import { loginSchema } from "@/server/auth/validators";
import { verifyTotpCode } from "@/server/auth/totp";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { clientIp } from "@/server/admin/client-ip";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { ensureTrialWindowStarted } from "@/server/trial-server";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rate = await enforceRateLimit("auth:login", ip, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rate.ok) return err(rate.message, 429);

  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return err("Неверные данные", 400);

  const { email, password } = parsed.data;
  const totpCode = (body as { totpCode?: string })?.totpCode?.trim();

  const user = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });

  if (!user) return err("Неверные данные", 401);
  if (user.isBlocked) return err("Аккаунт заблокирован", 403);
  if (!isEmailVerifiedForAuth(user)) return err("Подтвердите email", 403);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return err("Неверные данные", 401);

  if (user.totpEnabled) {
    if (!totpCode) return err("Нужен код 2FA", 403, { needsTotp: true });
    if (!user.totpSecret || !(await verifyTotpCode(user.totpSecret, totpCode))) {
      return err("Неверный код 2FA", 401);
    }
  }

  const token = await signAccessToken({ sub: user.id, role: user.role });
  const cookieStore = await cookies();
  cookieStore.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: accessTokenMaxAgeSec,
  });

  await ensureTrialWindowStarted(user.id);

  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date(), lastLoginIp: ip, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await db.insert(schema.loginEvents).values({
    id: newId(),
    userId: user.id,
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  return json({ ok: true, user: { nickname: user.nickname, role: user.role } });
}
