import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { newId } from "@/server/utils/ids";
import { clientIp } from "@/server/admin/client-ip";
import { checkRateLimit, enforceRateLimit } from "@/server/security/rate-limit";

const PROMO_IP_LIMIT = 20;
const PROMO_USER_LIMIT = 10;
const PROMO_WINDOW_MS = 60 * 1000;

export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipRate = await enforceRateLimit("economy:redeem-promo", ip, PROMO_IP_LIMIT, PROMO_WINDOW_MS);
  if (!ipRate.ok) {
    return NextResponse.json({ error: ipRate.message }, { status: 429, headers: { "Retry-After": String(ipRate.retryAfterSec) } });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (user.isBlocked) return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });

  const userRate = await checkRateLimit(`economy:redeem-promo:user:${user.id}`, PROMO_USER_LIMIT, PROMO_WINDOW_MS);
  if (!userRate.ok) {
    return NextResponse.json({ error: userRate.message }, { status: 429, headers: { "Retry-After": String(userRate.retryAfterSec) } });
  }

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim();
  if (!code) return NextResponse.json({ error: "Неверный код" }, { status: 400 });

  const promo = await db.query.promoCodes.findFirst({
    where: (promoCodes, { and: andFn }) =>
      andFn(eq(promoCodes.code, code), eq(promoCodes.isActive, true), gt(promoCodes.maxUses, promoCodes.usesCount)),
  });
  if (!promo) return NextResponse.json({ error: "Промокод недоступен" }, { status: 404 });

  const already = await db.query.promoRedemptions.findFirst({
    where: (promoRed, { and: andFn }) => andFn(eq(promoRed.userId, user.id), eq(promoRed.promoCodeId, promo.id)),
  });
  if (already) return NextResponse.json({ error: "Вы уже использовали этот промокод" }, { status: 409 });

  const [updatedPromo] = await db
    .update(schema.promoCodes)
    .set({ usesCount: promo.usesCount + 1 })
    .where(and(eq(schema.promoCodes.id, promo.id), eq(schema.promoCodes.usesCount, promo.usesCount)))
    .returning();
  if (!updatedPromo) return NextResponse.json({ error: "Промокод недоступен" }, { status: 409 });

  try {
    await db.insert(schema.promoRedemptions).values({
      id: newId(),
      userId: user.id,
      promoCodeId: promo.id,
    });
  } catch {
    return NextResponse.json({ error: "Вы уже использовали этот промокод" }, { status: 409 });
  }

  await db
    .update(schema.users)
    .set({ coinsBalance: user.coinsBalance + promo.rewardCoins, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));
  await db.insert(schema.coinLedger).values({
    id: newId(),
    userId: user.id,
    amount: promo.rewardCoins,
    reason: "promo",
    refType: "promo",
    refId: promo.id,
  });

  return NextResponse.json({ ok: true, coinsGranted: promo.rewardCoins });
}
