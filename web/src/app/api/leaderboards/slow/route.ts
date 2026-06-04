import { NextResponse } from "next/server";
import { getSlowLeaderboards } from "@/server/leaderboards";
import { LEADERBOARD_SLOW_REVALIDATE_SEC } from "@/server/leaderboards/ttl";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const data = await getSlowLeaderboards();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${LEADERBOARD_SLOW_REVALIDATE_SEC}, stale-while-revalidate=${LEADERBOARD_SLOW_REVALIDATE_SEC}`,
      },
    });
  } catch (e) {
    console.error("[leaderboards/slow]", e);
    return NextResponse.json({ byHours: { top: [], me: null } }, { status: 200 });
  }
}
