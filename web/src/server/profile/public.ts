import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { findUserByNickname } from "@/server/users/lookup";
import { parseSocialLinks } from "@/lib/social";
import { getFriendRelation, getProfileReactionCounts } from "@/lib/profile-stats";
import { getRecentProfileViewers, recordProfileView } from "@/server/profile/views";
import { isAdmin } from "@/lib/admin";
import { isEmailVerifiedForAuth } from "@/server/auth/email-verification";

export type PublicProfile = {
  nickname: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  social: ReturnType<typeof parseSocialLinks>;
  playtimeSeconds: number;
  likes: number;
  dislikes: number;
  relation: { status: string; requestId?: string };
  myReaction: "like" | "dislike" | null;
  recentViewers: Awaited<ReturnType<typeof getRecentProfileViewers>>;
  email?: string;
};

export async function getPublicProfile(
  nickname: string,
  viewer: { id: string; role: string } | null,
): Promise<PublicProfile | null> {
  const target = await findUserByNickname(nickname);
  if (!target) return null;
  const profilePublic =
    Boolean(target.emailVerifiedAt) || isEmailVerifiedForAuth(target);
  if (!profilePublic) {
    if (!viewer || viewer.id !== target.id) return null;
  }

  const viewerId = viewer?.id ?? null;
  if (viewerId && viewerId !== target.id) {
    void recordProfileView(target.id, viewerId);
  }

  const [reactions, relation, myReactionRow, recentViewers] = await Promise.all([
    getProfileReactionCounts(target.id),
    getFriendRelation(viewerId, target.id),
    viewerId && viewerId !== target.id
      ? db.query.profileReactions.findFirst({
          where: (pr, { and: andFn }) =>
            andFn(eq(pr.targetUserId, target.id), eq(pr.actorUserId, viewerId)),
        })
      : Promise.resolve(null),
    getRecentProfileViewers(target.id),
  ]);

  return {
    nickname: target.nickname,
    role: target.role,
    avatarUrl: target.avatarUrl,
    bio: target.bio,
    social: parseSocialLinks(target.socialLinksJson),
    playtimeSeconds: target.playtimeSeconds,
    likes: reactions.likes,
    dislikes: reactions.dislikes,
    relation,
    myReaction: (myReactionRow?.reaction as "like" | "dislike") ?? null,
    recentViewers,
    email:
      viewer && (viewer.id === target.id || isAdmin(viewer)) ? target.email : undefined,
  };
}
