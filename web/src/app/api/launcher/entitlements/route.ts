import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { getUserByDeviceToken } from "@/server/auth/device";
import { getTrialServerInfoForUser } from "@/server/trial-server";
import {
  applyCreatorEconomyDisplay,
  creatorUnlimitedTrialInfo,
  hasCreatorUnlimited,
} from "@/server/creator-unlimited";

export async function GET(request: Request) {
  const user = await getUserByDeviceToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const unlimited = await hasCreatorUnlimited(user);
  const trial = unlimited ? creatorUnlimitedTrialInfo() : await getTrialServerInfoForUser(user);
  const economy = applyCreatorEconomyDisplay(
    {
      coinsBalance: user.coinsBalance,
      availableServerSlots: user.availableServerSlots,
    },
    unlimited,
  );

  return NextResponse.json({
    user: {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    entitlements: {
      canOpenServerCreateFlow: unlimited || user.availableServerSlots > 0 || trial.canCreateTrialServer || trial.trialServerUsed,
      canCreateServerNow: unlimited || user.availableServerSlots > 0 || trial.canCreateTrialServer,
      availableServerSlots: economy.availableServerSlots,
      coinsBalance: economy.coinsBalance,
      playtimeSeconds: user.playtimeSeconds,
      creatorUnlimited: economy.creatorUnlimited,
      trial,
    },
  });
}
