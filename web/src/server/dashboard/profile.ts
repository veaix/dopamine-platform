import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getProfileReactionCounts } from "@/lib/profile-stats";
import { getTrialServerInfoForUser, type TrialServerInfo } from "@/server/trial-server";
import { avatarVersionKey } from "@/lib/avatar-url";
import { parseSocialLinks } from "@/lib/social";
import type { DashboardUserRow } from "@/server/dashboard/load-user";

export const NICKNAME_CHANGE_COINS = 5;
export const BIO_EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type DashboardUser = {
  id: string;
  nickname: string;
  email: string;
  role: string;
  hasAvatar: boolean;
  avatarVersion?: number;
  bio: string | null;
  social: ReturnType<typeof parseSocialLinks>;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
  totpEnabled: boolean;
  likes: number;
  dislikes: number;
  canRedeemWelcomePromo: boolean;
  bioEditedAt: string | null;
  canEditBio: boolean;
  bioEditCooldownHours: number;
  nicknameChangeCost: number;
  trial: TrialServerInfo;
};

const getCachedWelcomePromo = unstable_cache(
  async () =>
    db.query.promoCodes.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.code, "WELCOME5"),
      columns: { id: true, isActive: true },
    }),
  ["promo-welcome5"],
  { revalidate: 300 },
);

export async function getDashboardUser(user: DashboardUserRow): Promise<DashboardUser> {
  const [reactions, welcomePromo, trial] = await Promise.all([
    getProfileReactionCounts(user.id),
    getCachedWelcomePromo(),
    getTrialServerInfoForUser(user),
  ]);

  let welcomePromoRedeemed = false;
  if (welcomePromo) {
    const redeemed = await db.query.promoRedemptions.findFirst({
      where: (pr, { and: andFn }) =>
        andFn(eq(pr.userId, user.id), eq(pr.promoCodeId, welcomePromo.id)),
      columns: { id: true },
    });
    welcomePromoRedeemed = Boolean(redeemed);
  }

  const { likes, dislikes } = reactions;

  const bioEditedAtMs = user.bioEditedAt?.getTime() ?? 0;
  const bioCooldownLeft = bioEditedAtMs + BIO_EDIT_COOLDOWN_MS - Date.now();
  const canEditBio = bioCooldownLeft <= 0;

  return {
    id: user.id,
    nickname: user.nickname,
    email: user.email,
    role: user.role,
    hasAvatar: user.hasAvatar,
    avatarVersion: avatarVersionKey(user.hasAvatar, user.updatedAt),
    bio: user.bio,
    social: parseSocialLinks(user.socialLinksJson),
    coinsBalance: user.coinsBalance,
    availableServerSlots: user.availableServerSlots,
    playtimeSeconds: user.playtimeSeconds,
    totpEnabled: user.totpEnabled,
    likes,
    dislikes,
    canRedeemWelcomePromo: Boolean(welcomePromo?.isActive) && !welcomePromoRedeemed,
    bioEditedAt: user.bioEditedAt?.toISOString() ?? null,
    canEditBio,
    bioEditCooldownHours: canEditBio ? 0 : Math.ceil(bioCooldownLeft / (60 * 60 * 1000)),
    nicknameChangeCost: NICKNAME_CHANGE_COINS,
    trial,
  };
}
