import { eq, and, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { generateSixDigitCode } from "@/server/utils/crypto";
import { newId } from "@/server/utils/ids";
import { sendCodeEmail } from "@/server/mail";
import { json, err } from "@/lib/api";
import { clientIp } from "@/server/admin/client-ip";
import { enforceRateLimit } from "@/server/security/rate-limit";

const RESET_LIMIT = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const rate = await enforceRateLimit("auth:password-reset", ip, RESET_LIMIT, RESET_WINDOW_MS);
  if (!rate.ok) return err(rate.message, 429);

  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.toLowerCase().trim();
  if (!email) return err("Укажите email", 400);

  const user = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });
  if (!user || user.isBlocked) return json({ ok: true });

  await db
    .delete(schema.emailCodes)
    .where(
      and(
        eq(schema.emailCodes.userId, user.id),
        eq(schema.emailCodes.type, "reset_password"),
        isNull(schema.emailCodes.consumedAt),
      ),
    );

  const code = generateSixDigitCode();
  await db.insert(schema.emailCodes).values({
    id: newId(),
    userId: user.id,
    email,
    code,
    type: "reset_password",
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  await sendCodeEmail({ to: email, code, purpose: "reset_password" });
  return json({ ok: true });
}
