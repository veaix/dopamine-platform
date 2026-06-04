import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { validateNickname } from "@/lib/nickname";
import { NICKNAME_CHANGE_COINS } from "@/server/dashboard/profile";
import { isNicknameTaken } from "@/server/auth/pending-registration";
import { deductCoins } from "@/server/economy/deduct-coins";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { nickname?: string } | null;
  const nickname = body?.nickname?.trim();
  const nickErr = nickname ? validateNickname(nickname) : "Укажите ник";
  if (nickErr) return err(nickErr, 400);
  if (nickname!.toLowerCase() === user.nickname.toLowerCase()) {
    return err("Это ваш текущий ник", 400);
  }

  if (await isNicknameTaken(nickname!, { exceptUserId: user.id })) return err("Ник уже занят", 409);

  if (user.coinsBalance < NICKNAME_CHANGE_COINS) {
    return err(`Нужно ${NICKNAME_CHANGE_COINS} монет`, 400);
  }

  const deducted = await deductCoins(user.id, NICKNAME_CHANGE_COINS);
  if (!deducted) return err(`Нужно ${NICKNAME_CHANGE_COINS} монет`, 400);

  await db.update(schema.users).set({ nickname, updatedAt: new Date() }).where(eq(schema.users.id, user.id));

  await db.insert(schema.coinLedger).values({
    id: newId(),
    userId: user.id,
    amount: -NICKNAME_CHANGE_COINS,
    reason: "nickname_change",
  });

  return json({ ok: true, nickname, coinsSpent: NICKNAME_CHANGE_COINS });
}
