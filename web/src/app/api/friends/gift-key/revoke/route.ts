import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { giftId?: string } | null;
  if (!body?.giftId) return err("Неверные данные", 400);

  const gift = await db.query.friendKeyGifts.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.id, body.giftId!),
  });

  if (!gift || gift.fromUserId !== user.id || gift.status !== "pending") {
    return err("Подарок не найден", 404);
  }

  await db
    .update(schema.friendKeyGifts)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(schema.friendKeyGifts.id, gift.id));

  return json({ ok: true });
}
