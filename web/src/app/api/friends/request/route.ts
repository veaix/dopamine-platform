import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { findUserByNickname } from "@/server/users/lookup";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { nickname?: string } | null;
  const nickname = body?.nickname?.trim();
  if (!nickname) return err("Укажите ник", 400);

  const target = await findUserByNickname(nickname);
  if (!target) return err("Пользователь не найден", 404);
  if (target.id === user.id) return err("Нельзя добавить себя", 400);

  const existing = await db.query.friendRequests.findFirst({
    where: (fr, { and: andFn, or: orFn, eq: eqFn }) =>
      orFn(
        andFn(eqFn(fr.fromUserId, user.id), eqFn(fr.toUserId, target.id)),
        andFn(eqFn(fr.fromUserId, target.id), eqFn(fr.toUserId, user.id)),
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
        toUserId: target.id,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(schema.friendRequests.id, existing.id));
    return json({ ok: true });
  }

  await db.insert(schema.friendRequests).values({
    id: newId(),
    fromUserId: user.id,
    toUserId: target.id,
    status: "pending",
  });

  return json({ ok: true });
}
