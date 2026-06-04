import { and, eq, or } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { findUserByNickname } from "@/server/users/lookup";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { userId?: string; nickname?: string } | null;
  const nickname = body?.nickname?.trim();
  let friendId = body?.userId?.trim();

  if (!friendId && nickname) {
    const friend = await findUserByNickname(nickname);
    if (!friend) return err("Пользователь не найден", 404);
    friendId = friend.id;
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
  return json({ ok: true });
}
