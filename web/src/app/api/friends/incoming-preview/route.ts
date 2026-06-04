import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { json, err } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const rows = await db.query.friendRequests.findMany({
    where: (fr, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(fr.toUserId, user.id), eqFn(fr.status, "pending")),
    columns: { id: true, fromUserId: true },
    limit: 5,
    orderBy: (fr, { desc }) => [desc(fr.createdAt)],
  });

  if (!rows.length) return json({ incoming: [] });

  const fromIds = [...new Set(rows.map((r) => r.fromUserId))];
  const users = await db
    .select({
      id: schema.users.id,
      nickname: schema.users.nickname,
    })
    .from(schema.users)
    .where(inArray(schema.users.id, fromIds));

  const nickById = new Map(users.map((u) => [u.id, u.nickname]));

  const incoming = rows
    .map((r) => {
      const nickname = nickById.get(r.fromUserId);
      if (!nickname) return null;
      return { requestId: r.id, nickname };
    })
    .filter(Boolean);

  return json({ incoming });
}
