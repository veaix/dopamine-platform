import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { requestId?: string } | null;
  if (!body?.requestId) return err("Неверные данные", 400);

  const reqRow = await db.query.friendRequests.findFirst({
    where: (fr, { eq: eqFn }) => eqFn(fr.id, body.requestId!),
  });
  if (!reqRow || reqRow.fromUserId !== user.id || reqRow.status !== "pending") {
    return err("Заявка не найдена", 404);
  }

  await db.delete(schema.friendRequests).where(eq(schema.friendRequests.id, reqRow.id));
  return json({ ok: true });
}
