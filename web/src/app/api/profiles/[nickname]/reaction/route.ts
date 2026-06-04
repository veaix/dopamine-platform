import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { findUserByNickname } from "@/server/users/lookup";
import { newId } from "@/server/utils/ids";
import { clientIp } from "@/server/admin/client-ip";
import { checkRateLimit, enforceRateLimit } from "@/server/security/rate-limit";

const REACTION_IP_LIMIT = 60;
const REACTION_USER_LIMIT = 30;
const REACTION_WINDOW_MS = 60 * 1000;

type Params = { params: Promise<{ nickname: string }> };

export async function POST(request: Request, { params }: Params) {
  const ip = clientIp(request);
  const ipRate = await enforceRateLimit("profiles:reaction", ip, REACTION_IP_LIMIT, REACTION_WINDOW_MS);
  if (!ipRate.ok) {
    return NextResponse.json({ error: ipRate.message }, { status: 429, headers: { "Retry-After": String(ipRate.retryAfterSec) } });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  if (user.isBlocked) return NextResponse.json({ error: "Аккаунт заблокирован" }, { status: 403 });

  const userRate = await checkRateLimit(`profiles:reaction:user:${user.id}`, REACTION_USER_LIMIT, REACTION_WINDOW_MS);
  if (!userRate.ok) {
    return NextResponse.json({ error: userRate.message }, { status: 429, headers: { "Retry-After": String(userRate.retryAfterSec) } });
  }

  const { nickname } = await params;

  const body = (await request.json().catch(() => null)) as { reaction?: "like" | "dislike" } | null;
  if (!body || (body.reaction !== "like" && body.reaction !== "dislike")) {
    return NextResponse.json({ error: "Неверная реакция" }, { status: 400 });
  }

  const target = await findUserByNickname(nickname);
  if (!target) return NextResponse.json({ error: "Профиль не найден" }, { status: 404 });
  if (target.id === user.id) return NextResponse.json({ error: "Нельзя оценивать себя" }, { status: 400 });

  const existing = await db.query.profileReactions.findFirst({
    where: (r, { and: andFn }) => andFn(eq(r.targetUserId, target.id), eq(r.actorUserId, user.id)),
  });

  if (!existing) {
    await db.insert(schema.profileReactions).values({
      id: newId(),
      targetUserId: target.id,
      actorUserId: user.id,
      reaction: body.reaction,
    });
  } else if (existing.reaction === body.reaction) {
    await db
      .delete(schema.profileReactions)
      .where(and(eq(schema.profileReactions.id, existing.id), eq(schema.profileReactions.actorUserId, user.id)));
  } else {
    await db
      .update(schema.profileReactions)
      .set({ reaction: body.reaction, updatedAt: new Date() })
      .where(and(eq(schema.profileReactions.id, existing.id), eq(schema.profileReactions.actorUserId, user.id)));
  }

  return NextResponse.json({ ok: true, removed: existing?.reaction === body.reaction });
}
