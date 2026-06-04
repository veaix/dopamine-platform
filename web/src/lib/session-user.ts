export type SessionUser = {
  id: string;
  nickname: string;
  role: string;
  avatarUrl: string | null;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
};

export function toSessionUser(user: {
  id: string;
  nickname: string;
  role: string;
  avatarUrl: string | null;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
}): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname,
    role: user.role,
    avatarUrl: user.avatarUrl,
    coinsBalance: user.coinsBalance,
    availableServerSlots: user.availableServerSlots,
    playtimeSeconds: user.playtimeSeconds,
  };
}
