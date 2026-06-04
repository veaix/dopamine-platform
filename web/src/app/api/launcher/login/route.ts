import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { verifyPassword } from "@/server/utils/crypto";
import { verifyTotpCode } from "@/server/auth/totp";
import { clientIp } from "@/server/admin/client-ip";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { isEmailVerifiedForAuth } from "@/server/auth/email-verification";
import { ensureTrialWindowStarted } from "@/server/trial-server";
import { findUserByLoginIdentifier } from "@/server/users/lookup";
import { issueLauncherDeviceToken } from "@/server/auth/device";

const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rate = await enforceRateLimit("launcher:login", ip, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; deviceLabel?: string; totpCode?: string }
    | null;

  if (!body?.email || !body.password) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }
  const loginId = body.email.trim();
  const password = body.password;
  const totpCode = body.totpCode?.trim();

  const user = await findUserByLoginIdentifier(loginId);
  if (!user) return NextResponse.json({ error: "Неверные данные" }, { status: 401 });
  if (!isEmailVerifiedForAuth(user)) {
    return NextResponse.json({ error: "Подтвердите email" }, { status: 403 });
  }
  if (user.isBlocked) return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Неверные данные" }, { status: 401 });

  if (user.totpEnabled) {
    if (!totpCode) {
      return NextResponse.json({ error: "Нужен код 2FA", needsTotp: true }, { status: 403 });
    }
    if (!user.totpSecret || !(await verifyTotpCode(user.totpSecret, totpCode))) {
      return NextResponse.json({ error: "Неверный код 2FA" }, { status: 401 });
    }
  }

  await ensureTrialWindowStarted(user.id);
  await db
    .update(schema.users)
    .set({ lastLoginAt: new Date(), lastLoginIp: ip, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  let rawToken: string;
  try {
    rawToken = await issueLauncherDeviceToken(user.id, body.deviceLabel ?? "dopamine launcher");
  } catch (error) {
    console.error("[launcher/login] device issue failed:", error);
    return NextResponse.json({ error: "Ошибка сервера при входе" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    token: rawToken,
    user: {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      coinsBalance: user.coinsBalance,
      availableServerSlots: user.availableServerSlots,
      playtimeSeconds: user.playtimeSeconds,
    },
  });
}
