import type { LeaderboardsData } from "./index";

const emptyCategory = { top: [], me: null };

export const EMPTY_LEADERBOARDS: LeaderboardsData = {
  byHours: emptyCategory,
  byLikes: emptyCategory,
  byDislikes: emptyCategory,
  byAvailableServerSlots: emptyCategory,
  byCoins: emptyCategory,
};
