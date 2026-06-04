import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";

export async function getProfileReactionCounts(userId: string) {
  const rows = await db
    .select({
      reaction: schema.profileReactions.reaction,
      count: sql<number>`count(*)`,
    })
    .from(schema.profileReactions)
    .where(eq(schema.profileReactions.targetUserId, userId))
    .groupBy(schema.profileReactions.reaction);

  let likes = 0;
  let dislikes = 0;
  for (const row of rows) {
    if (row.reaction === "like") likes = Number(row.count);
    if (row.reaction === "dislike") dislikes = Number(row.count);
  }
  return { likes, dislikes };
}

export async function getFriendRelation(viewerId: string | null, targetId: string) {
  if (!viewerId) return { status: "none" as const };
  if (viewerId === targetId) return { status: "self" as const };

  const rows = await db.query.friendRequests.findMany({
    where: (fr, { and: andFn, eq: eqFn, or: orFn }) =>
      orFn(
        andFn(eqFn(fr.fromUserId, viewerId), eqFn(fr.toUserId, targetId)),
        andFn(eqFn(fr.fromUserId, targetId), eqFn(fr.toUserId, viewerId)),
      ),
    columns: { id: true, status: true, fromUserId: true, toUserId: true },
    limit: 4,
  });

  const accepted = rows.find((r) => r.status === "accepted");
  if (accepted) return { status: "friends" as const, requestId: accepted.id };

  const outgoing = rows.find(
    (r) => r.status === "pending" && r.fromUserId === viewerId && r.toUserId === targetId,
  );
  if (outgoing) return { status: "outgoing" as const, requestId: outgoing.id };

  const incoming = rows.find(
    (r) => r.status === "pending" && r.fromUserId === targetId && r.toUserId === viewerId,
  );
  if (incoming) return { status: "incoming" as const, requestId: incoming.id };

  return { status: "none" as const };
}
