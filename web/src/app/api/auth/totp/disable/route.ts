import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { verifyPassword } from "@/server/utils/crypto";
import { verifyTotpCode } from "@/server/auth/totp";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { password?: string; code?: string } | null;
  if (!body?.password || !body.code) return err("Нужны пароль и код", 400);
  if (!(await verifyPassword(body.password, user.passwordHash))) return err("Неверный пароль", 401);
  if (!user.totpSecret || !(await verifyTotpCode(user.totpSecret, body.code))) return err("Неверный код", 400);

  await db
    .update(schema.users)
    .set({ totpEnabled: false, totpSecret: null, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  return json({ ok: true });
}
