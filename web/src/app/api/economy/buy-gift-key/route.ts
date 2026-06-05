import { and, eq, gte } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/session";
import { db, schema } from "@/server/db";
import { GIFT_KEY_PRICE, makeActivationKeyCode } from "@/server/keys/codes";
import { getOwnedGiftKeys } from "@/server/keys/inventory";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { deductCoins } from "@/server/economy/deduct-coins";
import { hasCreatorUnlimited } from "@/server/creator-unlimited";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);
  const keys = await getOwnedGiftKeys(user.id);
  return json({ keys, price: GIFT_KEY_PRICE });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const unlimited = await hasCreatorUnlimited(user);
  if (!unlimited && user.coinsBalance < GIFT_KEY_PRICE) {
    return err(`Недостаточно монет (нужно ${GIFT_KEY_PRICE})`, 400);
  }

  const code = makeActivationKeyCode("GFT");
  const keyId = newId();

  if (!unlimited) {
    const deducted = await deductCoins(user.id, GIFT_KEY_PRICE);
    if (!deducted) return err(`Недостаточно монет (нужно ${GIFT_KEY_PRICE})`, 400);
  }

  await db.insert(schema.activationKeys).values({
    id: keyId,
    code,
    grantServers: 1,
    grantCoins: 0,
    maxUses: 1,
    isActive: true,
    createdByUserId: user.id,
    ownerUserId: user.id,
  });

  if (!unlimited) {
    await db.insert(schema.coinLedger).values({
      id: newId(),
      userId: user.id,
      amount: -GIFT_KEY_PRICE,
      reason: "gift_key_purchase",
      refType: "activation_key",
      refId: keyId,
    });
  }

  return json({
    ok: true,
    key: { id: keyId, grantServers: 1 },
    price: unlimited ? 0 : GIFT_KEY_PRICE,
    creatorUnlimited: unlimited,
  });
}
