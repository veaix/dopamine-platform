import { avatarVersionKey } from "@/lib/avatar-url";

export type SessionUser = {
  id: string;
  nickname: string;
  role: string;
  hasAvatar: boolean;
  avatarVersion?: number;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
};

export function toSessionUser(user: {
  id: string;
  nickname: string;
  role: string;
  hasAvatar: boolean;
  updatedAt: Date;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
}): SessionUser {
  return {
    id: user.id,
    nickname: user.nickname,
    role: user.role,
    hasAvatar: user.hasAvatar,
    avatarVersion: avatarVersionKey(user.hasAvatar, user.updatedAt),
    coinsBalance: user.coinsBalance,
    availableServerSlots: user.availableServerSlots,
    playtimeSeconds: user.playtimeSeconds,
  };
}
