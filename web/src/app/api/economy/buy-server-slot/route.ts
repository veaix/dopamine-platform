import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/server/auth/session";
import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { deductCoins } from "@/server/economy/deduct-coins";

export const SLOT_PRICE = Number(process.env.SERVER_SLOT_PRICE_COINS ?? 10);

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { quantity?: number } | null;
  const quantity = Math.min(20, Math.max(1, Math.floor(body?.quantity ?? 1)));
  const totalCost = SLOT_PRICE * quantity;

  if (user.coinsBalance < totalCost) {
    return err(`Недостаточно монет (нужно ${totalCost})`, 400);
  }

  const deducted = await deductCoins(user.id, totalCost);
  if (!deducted) return err(`Недостаточно монет (нужно ${totalCost})`, 400);

  const [updated] = await db
    .update(schema.users)
    .set({
      availableServerSlots: sql`${schema.users.availableServerSlots} + ${quantity}`,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id))
    .returning({
      coinsBalance: schema.users.coinsBalance,
      availableServerSlots: schema.users.availableServerSlots,
    });

  await db.insert(schema.coinLedger).values({
    id: newId(),
    userId: user.id,
    amount: -totalCost,
    reason: "slot_purchase",
    refType: "quantity",
    refId: String(quantity),
  });

  return json({
    ok: true,
    quantity,
    totalCost,
    slotPrice: SLOT_PRICE,
    coinsBalance: updated?.coinsBalance ?? deducted.coinsBalance,
    availableServerSlots: updated?.availableServerSlots ?? user.availableServerSlots,
  });
}

export async function GET() {
  return json({ slotPrice: SLOT_PRICE });
}
