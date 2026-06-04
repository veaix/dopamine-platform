import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { getUserByDeviceToken } from "@/server/auth/device";
import { getTrialServerInfoForUser } from "@/server/trial-server";

export async function GET(request: Request) {
  const user = await getUserByDeviceToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trial = await getTrialServerInfoForUser(user);

  return NextResponse.json({
    user: {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      role: user.role,
    },
    entitlements: {
      canOpenServerCreateFlow:
        user.availableServerSlots > 0 || trial.canCreateTrialServer || trial.trialServerUsed,
      canCreateServerNow: user.availableServerSlots > 0 || trial.canCreateTrialServer,
      availableServerSlots: user.availableServerSlots,
      coinsBalance: user.coinsBalance,
      playtimeSeconds: user.playtimeSeconds,
      trial,
    },
  });
}
