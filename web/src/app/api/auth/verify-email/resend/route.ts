import { and, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { sendCodeEmail } from "@/server/mail";
import { json, err } from "@/lib/api";
import { clientIp } from "@/server/admin/client-ip";
import { checkRateLimit, logSecurityEvent } from "@/server/security/rate-limit";
import { findPendingByEmail, refreshPendingCode } from "@/server/auth/pending-registration";
import { generateSixDigitCode } from "@/server/utils/crypto";
import { newId } from "@/server/utils/ids";

const RESEND_LIMIT = 3;
const RESEND_WINDOW_MS = 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.toLowerCase().trim();
  if (!email) return err("Укажите email", 400);

  const rate = await checkRateLimit(`auth:verify-resend:email:${email}`, RESEND_LIMIT, RESEND_WINDOW_MS);
  if (!rate.ok) {
    await logSecurityEvent("rate_limit", ip, { action: "verify-resend", email });
    return err(rate.message, 429);
  }
  if (ip) {
    const ipRate = await checkRateLimit(`auth:verify-resend:ip:${ip}`, 10, RESEND_WINDOW_MS);
    if (!ipRate.ok) return err(ipRate.message, 429);
  }

  const pending = await findPendingByEmail(email);
  if (pending) {
    if (Date.now() - pending.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - pending.createdAt.getTime())) / 1000);
      return err(`Подождите ${waitSec} сек. перед повторной отправкой`, 429);
    }
    const code = await refreshPendingCode(email);
    await sendCodeEmail({ to: email, code, purpose: "verify_email" });
    return json({ ok: true, message: "Код отправлен повторно" });
  }

  const user = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });
  if (!user) return json({ ok: true, message: "Если аккаунт существует, код отправлен" });
  if (user.emailVerifiedAt) return err("Email уже подтверждён", 400);

  const lastCode = await db.query.emailCodes.findFirst({
    where: (codes, { and: andFn }) =>
      andFn(eq(codes.userId, user.id), eq(codes.type, "verify_email"), isNull(codes.consumedAt)),
    orderBy: (codes, { desc: descFn }) => [descFn(codes.createdAt)],
  });

  if (lastCode && Date.now() - lastCode.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastCode.createdAt.getTime())) / 1000);
    return err(`Подождите ${waitSec} сек. перед повторной отправкой`, 429);
  }

  const code = generateSixDigitCode();

  await db
    .delete(schema.emailCodes)
    .where(
      and(
        eq(schema.emailCodes.userId, user.id),
        eq(schema.emailCodes.type, "verify_email"),
        isNull(schema.emailCodes.consumedAt),
      ),
    );

  await db.insert(schema.emailCodes).values({
    id: newId(),
    userId: user.id,
    email,
    code,
    type: "verify_email",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await sendCodeEmail({ to: email, code, purpose: "verify_email" });
  return json({ ok: true, message: "Код отправлен повторно" });
}
