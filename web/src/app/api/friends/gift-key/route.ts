import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { findUserByNickname } from "@/server/users/lookup";
import { newId } from "@/server/utils/ids";
import {
  areFriends,
  assertUserOwnsAvailableKey,
} from "@/server/keys/inventory";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as {
    keyId?: string;
    friendUserId?: string;
    friendNickname?: string;
  } | null;

  const keyId = body?.keyId?.trim();
  if (!keyId) return err("Укажите ключ", 400);

  const key = await assertUserOwnsAvailableKey(user.id, keyId);
  if (!key) return err("Ключ недоступен для дарения", 404);

  let friendId = body?.friendUserId?.trim();
  if (!friendId && body?.friendNickname?.trim()) {
    const friend = await findUserByNickname(body.friendNickname.trim());
    if (!friend) return err("Друг не найден", 404);
    friendId = friend.id;
  }

  if (!friendId) return err("Укажите друга", 400);
  if (friendId === user.id) return err("Нельзя подарить себе", 400);

  if (!(await areFriends(user.id, friendId))) {
    return err("Можно дарить только друзьям", 403);
  }

  const giftId = newId();
  await db.insert(schema.friendKeyGifts).values({
    id: giftId,
    fromUserId: user.id,
    toUserId: friendId,
    activationKeyId: key.id,
    status: "pending",
  });

  return json({ ok: true, giftId });
}
