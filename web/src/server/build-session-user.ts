import { toSessionUser, type SessionUser } from "@/lib/session-user";
import type { SessionDbUser } from "@/server/auth/session-user-columns";
import { applyCreatorEconomyDisplay, hasCreatorUnlimited } from "@/server/creator-unlimited";

export async function buildSessionUser(user: SessionDbUser): Promise<SessionUser> {
  const unlimited = await hasCreatorUnlimited(user);
  const economy = applyCreatorEconomyDisplay(
    { coinsBalance: user.coinsBalance, availableServerSlots: user.availableServerSlots },
    unlimited,
  );
  return {
    ...toSessionUser(user),
    coinsBalance: economy.coinsBalance,
    availableServerSlots: economy.availableServerSlots,
    creatorUnlimited: economy.creatorUnlimited,
  };
}
