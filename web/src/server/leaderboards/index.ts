import { unstable_cache } from "next/cache";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getProfileReactionCounts } from "@/lib/profile-stats";
import { mergeMeRanks, type ViewerMeRanks } from "@/lib/leaderboards-merge";
import {
  LEADERBOARD_FAST_REVALIDATE_SEC,
  LEADERBOARD_SLOW_REVALIDATE_SEC,
} from "@/server/leaderboards/ttl";

export type { ViewerMeRanks } from "@/lib/leaderboards-merge";
export { mergeMeRanks } from "@/lib/leaderboards-merge";

const TOP_LIMIT = 10;
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

export type SlowLeaderboards = Pick<LeaderboardsData, "byHours">;
export type FastLeaderboards = Pick<
  LeaderboardsData,
  "byLikes" | "byDislikes" | "byAvailableServerSlots" | "byCoins"
>;

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

const getCachedSlowTopRows = unstable_cache(
  async () => {
    const byHours = await db
      .select({
        nickname: schema.users.nickname,
        value: schema.users.playtimeSeconds,
      })
      .from(schema.users)
      .where(visible)
      .orderBy(desc(schema.users.playtimeSeconds))
      .limit(TOP_LIMIT);
    return { byHours };
  },
  ["leaderboards-slow-rows"],
  { revalidate: LEADERBOARD_SLOW_REVALIDATE_SEC },
);

const getCachedFastTopRows = unstable_cache(
  async () => {
    const [byServerSlots, byCoins, likesRaw, dislikesRaw] = await Promise.all([
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
      withTimeout(topByReaction("like"), REACTION_QUERY_MS, []),
      withTimeout(topByReaction("dislike"), REACTION_QUERY_MS, []),
    ]);
    return { byServerSlots, byCoins, likesRaw, dislikesRaw };
  },
  ["leaderboards-fast-rows"],
  { revalidate: LEADERBOARD_FAST_REVALIDATE_SEC },
);

export async function getSlowLeaderboards(): Promise<SlowLeaderboards> {
  const { byHours } = await getCachedSlowTopRows();
  return { byHours: buildCategory(mapRows(byHours), null, null) };
}

export async function getFastLeaderboards(): Promise<FastLeaderboards> {
  const { byServerSlots, byCoins, likesRaw, dislikesRaw } = await getCachedFastTopRows();
  return {
    byLikes: buildCategory(mapRows(likesRaw), null, null),
    byDislikes: buildCategory(mapRows(dislikesRaw), null, null),
    byAvailableServerSlots: buildCategory(mapRows(byServerSlots), null, null),
    byCoins: buildCategory(mapRows(byCoins), null, null),
  };
}

export async function getPublicLeaderboards(): Promise<LeaderboardsData> {
  const [slow, fast] = await Promise.all([getSlowLeaderboards(), getFastLeaderboards()]);
  return { ...slow, ...fast };
}

export async function getViewerMeRanksSlow(
  viewer: {
    nickname: string;
    avatarUrl: string | null;
    playtimeSeconds: number;
    hiddenFromLeaderboards: boolean;
  },
): Promise<Pick<ViewerMeRanks, "byHours"> | null> {
  if (viewer.hiddenFromLeaderboards) return null;
  const meHours = await rankByPlaytime(viewer);
  return { byHours: meHours };
}

export async function getViewerMeRanksFast(
  viewer: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    availableServerSlots: number;
    coinsBalance: number;
    hiddenFromLeaderboards: boolean;
  },
): Promise<Omit<ViewerMeRanks, "byHours"> | null> {
  if (viewer.hiddenFromLeaderboards) return null;

  const { likes, dislikes } = await getProfileReactionCounts(viewer.id);
  const [meSlots, meCoins, meLikes, meDislikes] = await Promise.all([
    rankByServerSlots(viewer),
    rankByCoins(viewer),
    withTimeout(rankByReaction(viewer, "like", likes), 5_000, null),
    withTimeout(rankByReaction(viewer, "dislike", dislikes), 5_000, null),
  ]);

  return {
    byLikes: meLikes,
    byDislikes: meDislikes,
    byAvailableServerSlots: meSlots,
    byCoins: meCoins,
  };
}

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
  const [slow, fast] = await Promise.all([
    getViewerMeRanksSlow(viewer),
    getViewerMeRanksFast(viewer),
  ]);
  if (!slow && !fast) return null;
  return {
    byHours: slow?.byHours ?? null,
    byLikes: fast?.byLikes ?? null,
    byDislikes: fast?.byDislikes ?? null,
    byAvailableServerSlots: fast?.byAvailableServerSlots ?? null,
    byCoins: fast?.byCoins ?? null,
  };
}

/** Full leaderboards including "your rank" — prefer split fast/slow + polling. */
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
