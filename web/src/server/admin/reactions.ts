import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";

/** Задать точное число лайков/дизлайков (синтетические actor id). */
export async function setProfileReactionCounts(
  targetUserId: string,
  likes: number,
  dislikes: number,
) {
  const safeLikes = Math.min(Math.max(Math.floor(likes), 0), 100_000);
  const safeDislikes = Math.min(Math.max(Math.floor(dislikes), 0), 100_000);

  await db
    .delete(schema.profileReactions)
    .where(eq(schema.profileReactions.targetUserId, targetUserId));

  const rows: (typeof schema.profileReactions.$inferInsert)[] = [];
  for (let i = 0; i < safeLikes; i++) {
    rows.push({
      id: newId(),
      targetUserId,
      actorUserId: `__admin_like_${targetUserId}_${i}`,
      reaction: "like",
    });
  }
  for (let i = 0; i < safeDislikes; i++) {
    rows.push({
      id: newId(),
      targetUserId,
      actorUserId: `__admin_dislike_${targetUserId}_${i}`,
      reaction: "dislike",
    });
  }

  if (rows.length > 0) {
    await db.insert(schema.profileReactions).values(rows);
  }

  return { likes: safeLikes, dislikes: safeDislikes };
}
