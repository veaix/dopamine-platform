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

  const [accepted, outgoing, incoming] = await Promise.all([
    db.query.friendRequests.findFirst({
      where: (fr, { and: andFn, eq: eqFn, or: orFn }) =>
        andFn(
          eqFn(fr.status, "accepted"),
          orFn(
            andFn(eqFn(fr.fromUserId, viewerId), eqFn(fr.toUserId, targetId)),
            andFn(eqFn(fr.fromUserId, targetId), eqFn(fr.toUserId, viewerId)),
          ),
        ),
    }),
    db.query.friendRequests.findFirst({
      where: (fr, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(fr.fromUserId, viewerId), eqFn(fr.toUserId, targetId), eqFn(fr.status, "pending")),
    }),
    db.query.friendRequests.findFirst({
      where: (fr, { and: andFn, eq: eqFn }) =>
        andFn(eqFn(fr.fromUserId, targetId), eqFn(fr.toUserId, viewerId), eqFn(fr.status, "pending")),
    }),
  ]);

  if (accepted) return { status: "friends" as const, requestId: accepted.id };
  if (outgoing) return { status: "outgoing" as const, requestId: outgoing.id };
  if (incoming) return { status: "incoming" as const, requestId: incoming.id };

  return { status: "none" as const };
}
