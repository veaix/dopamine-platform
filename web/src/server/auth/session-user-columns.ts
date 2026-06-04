import type { users } from "@/server/db/schema";

/** Columns for auth checks — excludes avatar_url (often huge base64). */
export const sessionUserColumns = {
  id: true,
  nickname: true,
  email: true,
  passwordHash: true,
  role: true,
  isBlocked: true,
  emailVerifiedAt: true,
  coinsBalance: true,
  availableServerSlots: true,
  playtimeSeconds: true,
  hiddenFromLeaderboards: true,
  adminPermissionsJson: true,
  bioEditedAt: true,
  totpEnabled: true,
  totpSecret: true,
} as const satisfies Partial<Record<keyof typeof users, true>>;

export type SessionDbUser = {
  id: string;
  nickname: string;
  email: string;
  passwordHash: string;
  role: string;
  isBlocked: boolean;
  emailVerifiedAt: Date | null;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
  hiddenFromLeaderboards: boolean;
  adminPermissionsJson: string | null;
  bioEditedAt: Date | null;
  totpEnabled: boolean;
  totpSecret: string | null;
  hasAvatar: boolean;
};
