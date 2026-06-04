import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getProfileReactionCounts } from "@/lib/profile-stats";
import {
  ensureTrialWindowStarted,
  getTrialServerInfoForUser,
  type TrialServerInfo,
} from "@/server/trial-server";
import { parseSocialLinks } from "@/lib/social";

export const NICKNAME_CHANGE_COINS = 5;
export const BIO_EDIT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type DashboardUser = {
  id: string;
  nickname: string;
  email: string;
  role: string;
  avatarUrl: string | null;
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

export async function getDashboardUser(user: {
  id: string;
  nickname: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  socialLinksJson: string;
  coinsBalance: number;
  availableServerSlots: number;
  playtimeSeconds: number;
  totpEnabled: boolean;
  bioEditedAt: Date | null;
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
}): Promise<DashboardUser> {
  const [reactions, welcomePromo] = await Promise.all([
    getProfileReactionCounts(user.id),
    db.query.promoCodes.findFirst({
      where: (p, { eq: eqFn }) => eqFn(p.code, "WELCOME5"),
    }),
  ]);

  let welcomePromoRedeemed = false;
  if (welcomePromo) {
    const redeemed = await db.query.promoRedemptions.findFirst({
      where: (pr, { and: andFn }) =>
        andFn(eq(pr.userId, user.id), eq(pr.promoCodeId, welcomePromo.id)),
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
    avatarUrl: user.avatarUrl,
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
    trial: await getTrialServerInfoForUser(user),
  };
}
