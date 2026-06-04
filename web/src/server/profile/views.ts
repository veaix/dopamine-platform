import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";

export type ProfileViewerEntry = {
  nickname: string;
  avatarUrl: string | null;
  viewedAt: string;
  reaction: "like" | "dislike" | null;
};

export async function recordProfileView(targetUserId: string, viewerUserId: string) {
  if (targetUserId === viewerUserId) return;

  const existing = await db.query.profileViews.findFirst({
    where: (v, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(v.targetUserId, targetUserId), eqFn(v.viewerUserId, viewerUserId)),
  });

  if (existing) {
    await db
      .update(schema.profileViews)
      .set({ viewedAt: new Date() })
      .where(eq(schema.profileViews.id, existing.id));
    return;
  }

  await db.insert(schema.profileViews).values({
    id: newId(),
    targetUserId,
    viewerUserId,
    viewedAt: new Date(),
  });
}

export async function getRecentProfileViewers(
  targetUserId: string,
  limit = 20,
): Promise<ProfileViewerEntry[]> {
  const views = await db
    .select()
    .from(schema.profileViews)
    .where(eq(schema.profileViews.targetUserId, targetUserId))
    .orderBy(desc(schema.profileViews.viewedAt))
    .limit(limit);

  if (!views.length) return [];

  const viewerIds = views.map((v) => v.viewerUserId);

  const [viewers, reactions] = await Promise.all([
    db
      .select({
        id: schema.users.id,
        nickname: schema.users.nickname,
      })
      .from(schema.users)
      .where(inArray(schema.users.id, viewerIds)),
    db
      .select({
        actorUserId: schema.profileReactions.actorUserId,
        reaction: schema.profileReactions.reaction,
      })
      .from(schema.profileReactions)
      .where(
        and(
          eq(schema.profileReactions.targetUserId, targetUserId),
          inArray(schema.profileReactions.actorUserId, viewerIds),
        ),
      ),
  ]);

  const userById = new Map(viewers.map((u) => [u.id, u]));
  const reactionByViewer = new Map(
    reactions.map((r) => [r.actorUserId, r.reaction as "like" | "dislike"]),
  );

  return views
    .map((v) => {
      const u = userById.get(v.viewerUserId);
      if (!u) return null;
      return {
        nickname: u.nickname,
        avatarUrl: null,
        viewedAt: v.viewedAt.toISOString(),
        reaction: reactionByViewer.get(v.viewerUserId) ?? null,
      };
    })
    .filter(Boolean) as ProfileViewerEntry[];
}
