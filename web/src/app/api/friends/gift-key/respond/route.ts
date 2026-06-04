import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { applyKeyToUser } from "@/server/keys/inventory";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as {
    giftId?: string;
    action?: "accept" | "reject";
  } | null;

  if (!body?.giftId || !body.action) return err("Неверные данные", 400);

  const gift = await db.query.friendKeyGifts.findFirst({
    where: (g, { eq: eqFn }) => eqFn(g.id, body.giftId!),
  });

  if (!gift || gift.toUserId !== user.id || gift.status !== "pending") {
    return err("Подарок не найден", 404);
  }

  if (body.action === "reject") {
    await db
      .update(schema.friendKeyGifts)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(schema.friendKeyGifts.id, gift.id));
    return json({ ok: true });
  }

  const key = await db.query.activationKeys.findFirst({
    where: (k, { eq: eqFn }) => eqFn(k.id, gift.activationKeyId),
  });
  if (!key || !key.isActive || key.usesCount >= key.maxUses) {
    return err("Ключ больше недоступен", 410);
  }

  await applyKeyToUser(user, key);
  await db
    .update(schema.friendKeyGifts)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(schema.friendKeyGifts.id, gift.id));

  return json({ ok: true, grantedServers: key.grantServers, grantedCoins: key.grantCoins });
}
