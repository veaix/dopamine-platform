import { NextResponse } from "next/server";
import { getPublicLeaderboards } from "@/server/leaderboards";
import { EMPTY_LEADERBOARDS } from "@/server/leaderboards/empty";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const data = await getPublicLeaderboards();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
      },
    });
  } catch (e) {
    console.error("[leaderboards]", e);
    return NextResponse.json(EMPTY_LEADERBOARDS, { status: 200 });
  }
}
