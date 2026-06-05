import { getFraudLimits } from "@/server/security/platform-settings";
import type { TrialServerInfo } from "@/server/trial-server";

export const CREATOR_DISPLAY_COINS = 999_999_999;
export const CREATOR_DISPLAY_SLOTS = 999_999;

const FAR_FUTURE_MS = 1000 * 60 * 60 * 24 * 365 * 50;

export async function isCreatorUnlimitedSettingEnabled(): Promise<boolean> {
  const limits = await getFraudLimits();
  return limits.creatorUnlimitedEnabled;
}

export async function hasCreatorUnlimited(user: { role: string } | null | undefined): Promise<boolean> {
  if (!user || user.role !== "creator") return false;
  return isCreatorUnlimitedSettingEnabled();
}

export function creatorUnlimitedTrialInfo(): TrialServerInfo {
  const ends = new Date(Date.now() + FAR_FUTURE_MS).toISOString();
  return {
    enabled: true,
    windowActive: true,
    canCreateTrialServer: true,
    trialServerUsed: false,
    trialExpiresAt: ends,
    trialWindowEndsAt: ends,
    shouldPurgeTrialServer: false,
    remainingMs: FAR_FUTURE_MS,
  };
}

export function applyCreatorEconomyDisplay<T extends { coinsBalance: number; availableServerSlots: number }>(
  data: T,
  unlimited: boolean,
): T & { creatorUnlimited: boolean } {
  if (!unlimited) {
    return { ...data, creatorUnlimited: false };
  }
  return {
    ...data,
    coinsBalance: CREATOR_DISPLAY_COINS,
    availableServerSlots: CREATOR_DISPLAY_SLOTS,
    creatorUnlimited: true,
  };
}
