import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { findUserIdByNickname } from "@/server/users/lookup";
import { err } from "@/lib/api";
import { jsonWithFriends } from "@/server/friends/json";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { userId?: string; nickname?: string } | null;
  const nickname = body?.nickname?.trim();
  let friendId = body?.userId?.trim();

  if (!friendId && nickname) {
    const id = await findUserIdByNickname(nickname);
    if (!id) return err("Пользователь не найден", 404);
    friendId = id;
  }

  if (!friendId) return err("Укажите друга", 400);
  if (friendId === user.id) return err("Нельзя удалить себя", 400);

  const row = await db.query.friendRequests.findFirst({
    where: (fr, { and: andFn, eq: eqFn, or: orFn }) =>
      andFn(
        eqFn(fr.status, "accepted"),
        orFn(
          andFn(eqFn(fr.fromUserId, user.id), eqFn(fr.toUserId, friendId!)),
          andFn(eqFn(fr.fromUserId, friendId!), eqFn(fr.toUserId, user.id)),
        ),
      ),
  });

  if (!row) return err("Это не ваш друг", 404);

  await db.delete(schema.friendRequests).where(eq(schema.friendRequests.id, row.id));
  return jsonWithFriends(user.id);
}
