import { unstable_cache } from "next/cache";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getProfileReactionCounts } from "@/lib/profile-stats";

const TOP_LIMIT = 10;
const CACHE_SECONDS = 120;
const visible = eq(schema.users.hiddenFromLeaderboards, false);

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

function mapRows<T extends { value: unknown }>(rows: T[]) {
  return rows.map((r) => ({ ...r, value: Number(r.value) })) as (Omit<T, "value"> & { value: number })[];
}

async function rankByPlaytime(user: { nickname: string; avatarUrl: string | null; playtimeSeconds: number }) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(visible, gt(schema.users.playtimeSeconds, user.playtimeSeconds)));
  return {
    rank: Number(count) + 1,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
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
    avatarUrl: user.avatarUrl,
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
    avatarUrl: user.avatarUrl,
    value: user.coinsBalance,
  };
}

async function rankByReaction(
  user: { nickname: string; avatarUrl: string | null },
  reaction: "like" | "dislike",
  userCount: number,
) {
  const subq = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .leftJoin(
      schema.profileReactions,
      sql`${schema.profileReactions.targetUserId} = ${schema.users.id} and ${schema.profileReactions.reaction} = ${reaction}`,
    )
    .where(visible)
    .groupBy(schema.users.id)
    .having(sql`count(${schema.profileReactions.id}) > ${userCount}`)
    .as("higher_reactions");

  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(subq);

  return {
    rank: Number(count) + 1,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    value: userCount,
  };
}

const getCachedTopLists = unstable_cache(
  async () => {
    const [byHours, likesRaw, dislikesRaw, byServerSlots, byCoins] = await Promise.all([
      db
        .select({
          nickname: schema.users.nickname,
          avatarUrl: schema.users.avatarUrl,
          value: schema.users.playtimeSeconds,
        })
        .from(schema.users)
        .where(visible)
        .orderBy(desc(schema.users.playtimeSeconds))
        .limit(TOP_LIMIT),
      db
        .select({
          nickname: schema.users.nickname,
          avatarUrl: schema.users.avatarUrl,
          value: sql<number>`count(${schema.profileReactions.id})`,
        })
        .from(schema.users)
        .leftJoin(
          schema.profileReactions,
          sql`${schema.profileReactions.targetUserId} = ${schema.users.id} and ${schema.profileReactions.reaction} = 'like'`,
        )
        .where(visible)
        .groupBy(schema.users.id)
        .orderBy(desc(sql`count(${schema.profileReactions.id})`))
        .limit(TOP_LIMIT),
      db
        .select({
          nickname: schema.users.nickname,
          avatarUrl: schema.users.avatarUrl,
          value: sql<number>`count(${schema.profileReactions.id})`,
        })
        .from(schema.users)
        .leftJoin(
          schema.profileReactions,
          sql`${schema.profileReactions.targetUserId} = ${schema.users.id} and ${schema.profileReactions.reaction} = 'dislike'`,
        )
        .where(visible)
        .groupBy(schema.users.id)
        .orderBy(desc(sql`count(${schema.profileReactions.id})`))
        .limit(TOP_LIMIT),
      db
        .select({
          nickname: schema.users.nickname,
          avatarUrl: schema.users.avatarUrl,
          value: schema.users.availableServerSlots,
        })
        .from(schema.users)
        .where(visible)
        .orderBy(desc(schema.users.availableServerSlots))
        .limit(TOP_LIMIT),
      db
        .select({
          nickname: schema.users.nickname,
          avatarUrl: schema.users.avatarUrl,
          value: schema.users.coinsBalance,
        })
        .from(schema.users)
        .where(visible)
        .orderBy(desc(schema.users.coinsBalance))
        .limit(TOP_LIMIT),
    ]);

    return { byHours, likesRaw, dislikesRaw, byServerSlots, byCoins };
  },
  ["leaderboards-top-lists"],
  { revalidate: CACHE_SECONDS },
);

export async function getLeaderboards(viewer: {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  playtimeSeconds: number;
  availableServerSlots: number;
  coinsBalance: number;
  hiddenFromLeaderboards: boolean;
} | null): Promise<LeaderboardsData> {
  const { byHours, likesRaw, dislikesRaw, byServerSlots, byCoins } = await getCachedTopLists();

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
      rankByReaction(viewer, "like", likes),
      rankByReaction(viewer, "dislike", dislikes),
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
