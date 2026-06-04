import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { hashPassword } from "@/server/utils/crypto";
import { registerSchema } from "@/server/auth/validators";
import { sendCodeEmail } from "@/server/mail";
import { clientIp } from "@/server/admin/client-ip";
import { enforceRateLimit, logSecurityEvent } from "@/server/security/rate-limit";
import { isDisposableEmail } from "@/server/security/disposable-email";
import { isTurnstileRequired, verifyTurnstileToken } from "@/server/security/turnstile";
import { checkRegistrationIpLimits } from "@/server/security/registration-guards";
import { isNicknameTaken, upsertPendingRegistration } from "@/server/auth/pending-registration";
import { newId } from "@/server/utils/ids";

const MIN_FORM_MS = 3000;
const REGISTER_LIMIT = 3;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);

  const rate = await enforceRateLimit("auth:register", ip, REGISTER_LIMIT, REGISTER_WINDOW_MS);
  if (!rate.ok) {
    return NextResponse.json({ error: rate.message }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  if (typeof body.website === "string" && body.website.trim()) {
    await logSecurityEvent("honeypot", ip, { website: body.website });
    return NextResponse.json({ error: "Не удалось создать аккаунт" }, { status: 400 });
  }

  const formStartedAt = Number(body.formStartedAt);
  if (!Number.isFinite(formStartedAt) || Date.now() - formStartedAt < MIN_FORM_MS) {
    await logSecurityEvent("form_too_fast", ip, { formStartedAt });
    return NextResponse.json({ error: "Подождите несколько секунд и попробуйте снова" }, { status: 400 });
  }

  const turnstileToken = typeof body.turnstileToken === "string" ? body.turnstileToken : undefined;
  if (isTurnstileRequired()) {
    const ok = await verifyTurnstileToken(request, turnstileToken);
    if (!ok) {
      await logSecurityEvent("turnstile_fail", ip, {});
      return NextResponse.json({ error: "Подтвердите, что вы не робот" }, { status: 400 });
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    const ok = await verifyTurnstileToken(request, turnstileToken);
    if (!ok) {
      await logSecurityEvent("turnstile_fail", ip, {});
      return NextResponse.json({ error: "Подтвердите, что вы не робот" }, { status: 400 });
    }
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Неверные данные" }, { status: 400 });
  }

  const { nickname, email, password } = parsed.data;

  if (isDisposableEmail(email)) {
    await logSecurityEvent("disposable_email", ip, { emailDomain: email.split("@")[1] });
    return NextResponse.json(
      { error: "Временные и одноразовые email-адреса не поддерживаются" },
      { status: 400 },
    );
  }

  const ipCheck = await checkRegistrationIpLimits(ip);
  if (!ipCheck.ok) {
    await logSecurityEvent(ipCheck.reason, ip, { email });
    return NextResponse.json({ error: ipCheck.message }, { status: 429 });
  }

  const existingByEmail = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });
  if (existingByEmail) {
    return NextResponse.json({ error: "Пользователь уже существует" }, { status: 409 });
  }

  if (await isNicknameTaken(nickname, { exceptEmail: email })) {
    return NextResponse.json({ error: "Этот ник уже занят" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  await db
    .insert(schema.promoCodes)
    .values({ id: newId(), code: "WELCOME5", rewardCoins: 5, maxUses: 999_999 })
    .onConflictDoNothing();

  const code = await upsertPendingRegistration({
    nickname,
    email,
    passwordHash,
    registrationIp: ip,
  });

  await sendCodeEmail({ to: email, code, purpose: "verify_email" });

  return NextResponse.json({ ok: true, message: "Код подтверждения отправлен" });
}
