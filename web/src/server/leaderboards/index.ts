import { unstable_cache } from "next/cache";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getProfileReactionCounts } from "@/lib/profile-stats";

const TOP_LIMIT = 10;
const CACHE_SECONDS = 120;
const REACTION_CACHE_SECONDS = 300;
const REACTION_QUERY_MS = 8_000;
const visible = eq(schema.users.hiddenFromLeaderboards, false);

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export type TopRow = { nickname: string; avatarUrl: string | null; value: number };

export type MeRank = {
  rank: number;
  nickname: string;
  avatarUrl: string | null;
  value: number;
};

export type TopCategory = {
  top: TopRow[];
  me: MeRank | null;
};

export type LeaderboardsData = {
  byHours: TopCategory;
  byLikes: TopCategory;
  byDislikes: TopCategory;
  byAvailableServerSlots: TopCategory;
  byCoins: TopCategory;
};

function inTop(top: TopRow[], nickname: string) {
  return top.some((r) => r.nickname === nickname);
}

function buildCategory(top: TopRow[], me: MeRank | null, viewerNickname: string | null): TopCategory {
  if (!me || !viewerNickname) return { top, me: null };
  if (inTop(top, viewerNickname)) return { top, me: null };
  return { top, me };
}

function trimAvatarUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("data:") || url.length > 512) return null;
  return url;
}

function mapRows<T extends { value: unknown; nickname: string }>(rows: T[]) {
  return rows.map((r) => ({
    nickname: r.nickname,
    avatarUrl: null,
    value: Number(r.value),
  }));
}

async function rankByPlaytime(user: { nickname: string; avatarUrl: string | null; playtimeSeconds: number }) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(visible, gt(schema.users.playtimeSeconds, user.playtimeSeconds)));
  return {
    rank: Number(count) + 1,
    nickname: user.nickname,
    avatarUrl: trimAvatarUrl(user.avatarUrl),
    value: user.playtimeSeconds,
  };
}

async function rankByServerSlots(user: {
  nickname: string;
  avatarUrl: string | null;
  availableServerSlots: number;
}) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(visible, gt(schema.users.availableServerSlots, user.availableServerSlots)));
  return {
    rank: Number(count) + 1,
    nickname: user.nickname,
    avatarUrl: trimAvatarUrl(user.avatarUrl),
    value: user.availableServerSlots,
  };
}

async function rankByCoins(user: { nickname: string; avatarUrl: string | null; coinsBalance: number }) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(visible, gt(schema.users.coinsBalance, user.coinsBalance)));
  return {
    rank: Number(count) + 1,
    nickname: user.nickname,
    avatarUrl: trimAvatarUrl(user.avatarUrl),
    value: user.coinsBalance,
  };
}

async function rankByReaction(
  user: { nickname: string; avatarUrl: string | null },
  reaction: "like" | "dislike",
  userCount: number,
) {
  const higherCounts = db
    .select({ targetUserId: schema.profileReactions.targetUserId })
    .from(schema.profileReactions)
    .innerJoin(schema.users, eq(schema.users.id, schema.profileReactions.targetUserId))
    .where(and(eq(schema.profileReactions.reaction, reaction), visible))
    .groupBy(schema.profileReactions.targetUserId)
    .having(gt(sql<number>`count(${schema.profileReactions.id})`, userCount))
    .as("higher_reaction_counts");

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(higherCounts);

  return {
    rank: Number(count) + 1,
    nickname: user.nickname,
    avatarUrl: trimAvatarUrl(user.avatarUrl),
    value: userCount,
  };
}

function topByReaction(reaction: "like" | "dislike") {
  const topCounts = db
    .select({
      targetUserId: schema.profileReactions.targetUserId,
      value: sql<number>`count(*)`.as("value"),
    })
    .from(schema.profileReactions)
    .where(eq(schema.profileReactions.reaction, reaction))
    .groupBy(schema.profileReactions.targetUserId)
    .orderBy(desc(sql<number>`count(*)`))
    .limit(TOP_LIMIT)
    .as("top_reaction_counts");

  return db
    .select({
      nickname: schema.users.nickname,
      value: topCounts.value,
    })
    .from(topCounts)
    .innerJoin(schema.users, eq(schema.users.id, topCounts.targetUserId))
    .where(visible)
    .orderBy(desc(topCounts.value));
}

const getCachedCoreTopLists = unstable_cache(
  async () => {
    const [byHours, byServerSlots, byCoins] = await Promise.all([
      db
        .select({
          nickname: schema.users.nickname,
          value: schema.users.playtimeSeconds,
        })
        .from(schema.users)
        .where(visible)
        .orderBy(desc(schema.users.playtimeSeconds))
        .limit(TOP_LIMIT),
      db
        .select({
          nickname: schema.users.nickname,
          value: schema.users.availableServerSlots,
        })
        .from(schema.users)
        .where(visible)
        .orderBy(desc(schema.users.availableServerSlots))
        .limit(TOP_LIMIT),
      db
        .select({
          nickname: schema.users.nickname,
          value: schema.users.coinsBalance,
        })
        .from(schema.users)
        .where(visible)
        .orderBy(desc(schema.users.coinsBalance))
        .limit(TOP_LIMIT),
    ]);

    return { byHours, byServerSlots, byCoins };
  },
  ["leaderboards-core-tops"],
  { revalidate: CACHE_SECONDS },
);

const getCachedReactionTopLists = unstable_cache(
  async () => {
    const [likesRaw, dislikesRaw] = await Promise.all([topByReaction("like"), topByReaction("dislike")]);
    return { likesRaw, dislikesRaw };
  },
  ["leaderboards-reaction-tops"],
  { revalidate: REACTION_CACHE_SECONDS },
);

async function getTopLists() {
  const [core, reactions] = await Promise.all([
    getCachedCoreTopLists(),
    withTimeout(getCachedReactionTopLists(), REACTION_QUERY_MS, {
      likesRaw: [] as Awaited<ReturnType<typeof topByReaction>>,
      dislikesRaw: [] as Awaited<ReturnType<typeof topByReaction>>,
    }),
  ]);
  return { ...core, ...reactions };
}

const getCachedPublicLeaderboards = unstable_cache(
  async () => buildLeaderboards(null, await getTopLists()),
  ["leaderboards-public"],
  { revalidate: CACHE_SECONDS },
);

export async function getPublicLeaderboards(): Promise<LeaderboardsData> {
  return getCachedPublicLeaderboards();
}

import { mergeMeRanks, type ViewerMeRanks } from "@/lib/leaderboards-merge";

export type { ViewerMeRanks } from "@/lib/leaderboards-merge";
export { mergeMeRanks } from "@/lib/leaderboards-merge";

export async function getViewerMeRanks(
  viewer: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    playtimeSeconds: number;
    availableServerSlots: number;
    coinsBalance: number;
    hiddenFromLeaderboards: boolean;
  },
): Promise<ViewerMeRanks | null> {
  if (viewer.hiddenFromLeaderboards) return null;

  const { likes, dislikes } = await getProfileReactionCounts(viewer.id);
  const [meHours, meSlots, meCoins, meLikes, meDislikes] = await Promise.all([
    rankByPlaytime(viewer),
    rankByServerSlots(viewer),
    rankByCoins(viewer),
    withTimeout(rankByReaction(viewer, "like", likes), 5_000, null),
    withTimeout(rankByReaction(viewer, "dislike", dislikes), 5_000, null),
  ]);

  return {
    byHours: meHours,
    byLikes: meLikes,
    byDislikes: meDislikes,
    byAvailableServerSlots: meSlots,
    byCoins: meCoins,
  };
}

async function buildLeaderboards(
  viewer: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    playtimeSeconds: number;
    availableServerSlots: number;
    coinsBalance: number;
    hiddenFromLeaderboards: boolean;
  } | null,
  lists: Awaited<ReturnType<typeof getTopLists>>,
): Promise<LeaderboardsData> {
  const { byHours, likesRaw, dislikesRaw, byServerSlots, byCoins } = lists;

  let meHours: MeRank | null = null;
  let meLikes: MeRank | null = null;
  let meDislikes: MeRank | null = null;
  let meSlots: MeRank | null = null;
  let meCoins: MeRank | null = null;

  if (viewer && !viewer.hiddenFromLeaderboards) {
    const { likes, dislikes } = await getProfileReactionCounts(viewer.id);
    [meHours, meSlots, meCoins, meLikes, meDislikes] = await Promise.all([
      rankByPlaytime(viewer),
      rankByServerSlots(viewer),
      rankByCoins(viewer),
      withTimeout(rankByReaction(viewer, "like", likes), 5_000, null),
      withTimeout(rankByReaction(viewer, "dislike", dislikes), 5_000, null),
    ]);
  }

  const nick = viewer?.nickname ?? null;

  return {
    byHours: buildCategory(mapRows(byHours), meHours, nick),
    byLikes: buildCategory(mapRows(likesRaw), meLikes, nick),
    byDislikes: buildCategory(mapRows(dislikesRaw), meDislikes, nick),
    byAvailableServerSlots: buildCategory(mapRows(byServerSlots), meSlots, nick),
    byCoins: buildCategory(mapRows(byCoins), meCoins, nick),
  };
}

/** Full leaderboards including "your rank" — slower; prefer getPublicLeaderboards + getViewerMeRanks. */
export async function getLeaderboards(viewer: {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  playtimeSeconds: number;
  availableServerSlots: number;
  coinsBalance: number;
  hiddenFromLeaderboards: boolean;
} | null): Promise<LeaderboardsData> {
  const publicData = await getPublicLeaderboards();
  if (!viewer) return publicData;
  const me = await getViewerMeRanks(viewer);
  if (!me) return publicData;
  return mergeMeRanks(publicData, me, viewer.nickname);
}
