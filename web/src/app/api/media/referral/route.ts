import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { siteUrl } from "@/lib/site-url";
import { ensureReferralPromoSchema, toIsoTimestamp } from "@/server/media/referral-schema";

export const runtime = "nodejs";

export const MEDIA_REFERRAL_REWARD_COINS = 5;
export const MEDIA_REFERRAL_MAX_USES = 999_999;

function normalizeReferralCode(raw: string) {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
}

function isMediagigant(user: { role: string }) {
  return user.role.trim() === "mediagigant";
}

function serializePromo(promo: typeof schema.promoCodes.$inferSelect) {
  return {
    id: promo.id,
    code: promo.code,
    usesCount: promo.usesCount,
    maxUses: promo.maxUses,
    rewardCoins: promo.rewardCoins,
    isActive: Boolean(promo.isActive),
    createdAt: toIsoTimestamp(promo.createdAt),
    shareUrl: `${siteUrl()}/register?ref=${encodeURIComponent(promo.code)}`,
  };
}

async function findMediagigantPromo(userId: string) {
  const [owned] = await db
    .select()
    .from(schema.promoCodes)
    .where(eq(schema.promoCodes.ownerUserId, userId))
    .limit(1);
  return owned ?? null;
}

export async function GET() {
  try {
    await ensureReferralPromoSchema();

    const user = await getCurrentUser();
    if (!user) return err("Требуется вход", 401);
    if (!isMediagigant(user)) return err("Доступ только для медиагигантов", 403);

    const promo = await findMediagigantPromo(user.id);
    if (!promo) {
      return json({ promo: null, rewardCoins: MEDIA_REFERRAL_REWARD_COINS });
    }

    const kind = promo.kind ?? "platform";
    if (kind !== "referral") {
      try {
        await db
          .update(schema.promoCodes)
          .set({ kind: "referral" })
          .where(eq(schema.promoCodes.id, promo.id));
      } catch {
        /* non-fatal */
      }
    }

    return json({
      promo: serializePromo({ ...promo, kind: "referral", isActive: Boolean(promo.isActive) }),
      rewardCoins: MEDIA_REFERRAL_REWARD_COINS,
    });
  } catch (e) {
    console.error("[media/referral] GET failed:", e);
    return err("Ошибка загрузки рефералки", 500);
  }
}

export async function POST(request: Request) {
  try {
    await ensureReferralPromoSchema();

    const user = await getCurrentUser();
    if (!user) return err("Требуется вход", 401);
    if (!isMediagigant(user)) return err("Доступ только для медиагигантов", 403);

    const existing = await findMediagigantPromo(user.id);
    if (existing) {
      return json({ ok: true, promo: serializePromo(existing) });
    }

    const body = (await request.json().catch(() => null)) as { code?: string } | null;
    const code = normalizeReferralCode(body?.code ?? "");
    if (code.length < 3 || code.length > 24) {
      return err("Код: 3–24 символа (латиница, цифры, _)", 400);
    }

    const clash = await db
      .select()
      .from(schema.promoCodes)
      .where(eq(schema.promoCodes.code, code))
      .limit(1);
    const existingCode = clash[0];
    if (existingCode) {
      if (!existingCode.ownerUserId) {
        const [claimed] = await db
          .update(schema.promoCodes)
          .set({ ownerUserId: user.id, kind: "referral" })
          .where(and(eq(schema.promoCodes.id, existingCode.id), isNull(schema.promoCodes.ownerUserId)))
          .returning();
        if (claimed) return json({ ok: true, promo: serializePromo(claimed) });
      }
      return err("Такой промокод уже занят", 409);
    }

    const id = newId();
    const [inserted] = await db
      .insert(schema.promoCodes)
      .values({
        id,
        code,
        rewardCoins: MEDIA_REFERRAL_REWARD_COINS,
        maxUses: MEDIA_REFERRAL_MAX_USES,
        isActive: true,
        kind: "referral",
        ownerUserId: user.id,
      })
      .returning();

    if (!inserted) return err("Не удалось создать промокод", 500);

    return json({ ok: true, promo: serializePromo(inserted) });
  } catch (e) {
    console.error("[media/referral] POST failed:", e);
    return err("Не удалось создать промокод", 500);
  }
}
