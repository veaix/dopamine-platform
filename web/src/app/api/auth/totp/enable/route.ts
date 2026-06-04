import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { verifyTotpCode } from "@/server/auth/totp";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);
  if (!user.totpSecret) return err("Сначала запустите настройку 2FA", 400);

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim();
  if (!code || !(await verifyTotpCode(user.totpSecret, code))) return err("Неверный код", 400);

  await db.update(schema.users).set({ totpEnabled: true, updatedAt: new Date() }).where(eq(schema.users.id, user.id));
  return json({ ok: true });
}
