import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { generateTotpSecret, totpQrDataUrl } from "@/server/auth/totp";
import { json, err } from "@/lib/api";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const { secret, otpauth } = generateTotpSecret(user.email);
  await db.update(schema.users).set({ totpSecret: secret, totpEnabled: false }).where(eq(schema.users.id, user.id));
  const qrDataUrl = await totpQrDataUrl(otpauth);
  return json({ ok: true, secret, qrDataUrl });
}
