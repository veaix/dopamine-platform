import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { parseSocialLinks } from "@/lib/social";
import { getFriendRelation, getProfileReactionCounts } from "@/lib/profile-stats";
import { getRecentProfileViewers, recordProfileView } from "@/server/profile/views";
import { findUserProfileByNickname } from "@/server/profile/lookup";
import { trimAvatarUrl } from "@/lib/trim-avatar";
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

export type PublicProfileCore = Omit<PublicProfile, "recentViewers"> & {
  targetUserId: string;
};

export async function getPublicProfileCore(
  nickname: string,
  viewer: { id: string; role: string } | null,
): Promise<PublicProfileCore | null> {
  const target = await findUserProfileByNickname(nickname);
  if (!target) return null;

  const profilePublic = Boolean(target.emailVerifiedAt) || isEmailVerifiedForAuth(target);
  if (!profilePublic) {
    if (!viewer || viewer.id !== target.id) return null;
  }

  const viewerId = viewer?.id ?? null;

  const [reactions, relation, myReactionRow] = await Promise.all([
    getProfileReactionCounts(target.id),
    getFriendRelation(viewerId, target.id),
    viewerId && viewerId !== target.id
      ? db.query.profileReactions.findFirst({
          where: (pr, { and: andFn }) =>
            andFn(eq(pr.targetUserId, target.id), eq(pr.actorUserId, viewerId)),
          columns: { reaction: true },
        })
      : Promise.resolve(null),
  ]);

  return {
    targetUserId: target.id,
    nickname: target.nickname,
    role: target.role,
    avatarUrl: trimAvatarUrl(target.avatarUrl),
    bio: target.bio,
    social: parseSocialLinks(target.socialLinksJson),
    playtimeSeconds: target.playtimeSeconds,
    likes: reactions.likes,
    dislikes: reactions.dislikes,
    relation,
    myReaction: (myReactionRow?.reaction as "like" | "dislike") ?? null,
    email:
      viewer && (viewer.id === target.id || isAdmin(viewer)) ? target.email : undefined,
  };
}

export async function getPublicProfile(
  nickname: string,
  viewer: { id: string; role: string } | null,
): Promise<PublicProfile | null> {
  const core = await getPublicProfileCore(nickname, viewer);
  if (!core) return null;

  const recentViewers = await getRecentProfileViewers(core.targetUserId);
  const { targetUserId: _id, ...rest } = core;
  return { ...rest, recentViewers };
}

export async function recordProfileViewForNickname(
  nickname: string,
  viewerUserId: string,
) {
  const target = await findUserProfileByNickname(nickname);
  if (!target || target.id === viewerUserId) return;
  await recordProfileView(target.id, viewerUserId);
}
