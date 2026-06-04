import type { LeaderboardsData, MeRank, TopCategory } from "@/server/leaderboards/index";

export type ViewerMeRanks = {
  byHours: MeRank | null;
  byLikes: MeRank | null;
  byDislikes: MeRank | null;
  byAvailableServerSlots: MeRank | null;
  byCoins: MeRank | null;
};

function inTop(top: { nickname: string }[], nickname: string) {
  return top.some((r) => r.nickname === nickname);
}

function attachMe(cat: TopCategory, me: MeRank | null, nickname: string): TopCategory {
  if (!me || inTop(cat.top, nickname)) return cat;
  return { top: cat.top, me };
}

export function mergeMeRanks(
  data: LeaderboardsData,
  me: ViewerMeRanks,
  nickname: string,
): LeaderboardsData {
  return {
    byHours: attachMe(data.byHours, me.byHours, nickname),
    byLikes: attachMe(data.byLikes, me.byLikes, nickname),
    byDislikes: attachMe(data.byDislikes, me.byDislikes, nickname),
    byAvailableServerSlots: attachMe(data.byAvailableServerSlots, me.byAvailableServerSlots, nickname),
    byCoins: attachMe(data.byCoins, me.byCoins, nickname),
  };
}
