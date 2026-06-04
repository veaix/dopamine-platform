import type { SessionDbUser } from "@/server/auth/session";

export function toLeaderboardViewer(user: SessionDbUser) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: null as string | null,
    playtimeSeconds: user.playtimeSeconds,
    availableServerSlots: user.availableServerSlots,
    coinsBalance: user.coinsBalance,
    hiddenFromLeaderboards: Boolean(user.hiddenFromLeaderboards),
  };
}

export type LeaderboardViewer = ReturnType<typeof toLeaderboardViewer>;
