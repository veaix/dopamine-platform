export type SessionUser = {
  id: string;
  nickname: string;
  role: string;
  avatarUrl: string | null;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
};

function trimAvatarUrl(url: string | null | undefined) {
  if (!url) return null;
  if (url.startsWith("data:") || url.length > 512) return null;
  return url;
}

export function toSessionUser(user: {
  id: string;
  nickname: string;
  role: string;
  avatarUrl?: string | null;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
}): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname,
    role: user.role,
    avatarUrl: trimAvatarUrl(user.avatarUrl ?? null),
    coinsBalance: user.coinsBalance,
    availableServerSlots: user.availableServerSlots,
    playtimeSeconds: user.playtimeSeconds,
  };
}
