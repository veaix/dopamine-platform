import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { verifyEmailSchema } from "@/server/auth/validators";
import { signAccessToken, accessTokenMaxAgeSec } from "@/server/auth/tokens";
import { authCookieName } from "@/server/auth/session";
import { json, err } from "@/lib/api";
import { clientIp } from "@/server/admin/client-ip";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { ensureTrialWindowStarted } from "@/server/trial-server";
import {
  createUserFromPending,
  findPendingByEmailAndCode,
} from "@/server/auth/pending-registration";

const VERIFY_LIMIT = 8;
const VERIFY_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rate = await enforceRateLimit("auth:verify-email", ip, VERIFY_LIMIT, VERIFY_WINDOW_MS);
  if (!rate.ok) return err(rate.message, 429);

  const body = await request.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) return err("Неверный код", 400);

  const { email, code } = parsed.data;

  const pending = await findPendingByEmailAndCode(email, code);
  if (pending) {
    const user = await createUserFromPending(pending);
    if (!user) return err("Не удалось создать аккаунт", 500);

    await ensureTrialWindowStarted(user.id);

    const token = await signAccessToken({ sub: user.id, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set(authCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: accessTokenMaxAgeSec,
    });

    return json({
      ok: true,
      user: { nickname: user.nickname, role: user.role },
      redirectTo: "/dashboard?welcome=1",
    });
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });

  if (!user) return err("Код истёк или неверный", 400);
  if (user.emailVerifiedAt) return err("Email уже подтверждён", 400);

  const item = await db.query.emailCodes.findFirst({
    where: (codes, { and: andFn }) =>
      andFn(
        eq(codes.userId, user.id),
        eq(codes.type, "verify_email"),
        eq(codes.code, code),
        gt(codes.expiresAt, new Date()),
        isNull(codes.consumedAt),
      ),
  });

  if (!item) return err("Код истёк или неверный", 400);

  await db
    .update(schema.emailCodes)
    .set({ consumedAt: new Date() })
    .where(eq(schema.emailCodes.id, item.id));
  const now = new Date();
  await db
    .update(schema.users)
    .set({ emailVerifiedAt: now, updatedAt: now })
    .where(and(eq(schema.users.id, user.id), isNull(schema.users.emailVerifiedAt)));

  await ensureTrialWindowStarted(user.id);

  const token = await signAccessToken({ sub: user.id, role: user.role });
  const cookieStore = await cookies();
  cookieStore.set(authCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: accessTokenMaxAgeSec,
  });

  return json({
    ok: true,
    user: { nickname: user.nickname, role: user.role },
    redirectTo: "/dashboard?welcome=1",
  });
}
