import { NextResponse } from "next/server";
import { getFastLeaderboards } from "@/server/leaderboards";
import { LEADERBOARD_FAST_REVALIDATE_SEC } from "@/server/leaderboards/ttl";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const data = await getFastLeaderboards();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": `public, s-maxage=${LEADERBOARD_FAST_REVALIDATE_SEC}, stale-while-revalidate=${LEADERBOARD_FAST_REVALIDATE_SEC * 2}`,
      },
    });
  } catch (e) {
    console.error("[leaderboards/fast]", e);
    return NextResponse.json(
      {
        byLikes: { top: [], me: null },
        byDislikes: { top: [], me: null },
        byAvailableServerSlots: { top: [], me: null },
        byCoins: { top: [], me: null },
      },
      { status: 200 },
    );
  }
}
