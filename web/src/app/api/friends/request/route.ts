import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { findUserIdByNickname } from "@/server/users/lookup";
import { newId } from "@/server/utils/ids";
import { err } from "@/lib/api";
import { jsonWithFriends } from "@/server/friends/json";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { nickname?: string } | null;
  const nickname = body?.nickname?.trim();
  if (!nickname) return err("Укажите ник", 400);

  const targetId = await findUserIdByNickname(nickname);
  if (!targetId) return err("Пользователь не найден", 404);
  if (targetId === user.id) return err("Нельзя добавить себя", 400);

  const existing = await db.query.friendRequests.findFirst({
    where: (fr, { and: andFn, or: orFn, eq: eqFn }) =>
      orFn(
        andFn(eqFn(fr.fromUserId, user.id), eqFn(fr.toUserId, targetId)),
        andFn(eqFn(fr.fromUserId, targetId), eqFn(fr.toUserId, user.id)),
      ),
  });

  if (existing?.status === "accepted") return err("Уже в друзьях", 409);
  if (existing?.status === "pending") {
    if (existing.fromUserId === user.id) return err("Заявка уже отправлена", 409);
    return err("Вам уже отправили заявку — примите её во вкладке «Друзья»", 409);
  }

  if (existing) {
    await db
      .update(schema.friendRequests)
      .set({
        fromUserId: user.id,
        toUserId: targetId,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(schema.friendRequests.id, existing.id));
    return jsonWithFriends(user.id);
  }

  await db.insert(schema.friendRequests).values({
    id: newId(),
    fromUserId: user.id,
    toUserId: targetId,
    status: "pending",
  });

  return jsonWithFriends(user.id);
}
