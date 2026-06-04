import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getLeaderboards } from "@/server/leaderboards";
import { EMPTY_LEADERBOARDS } from "@/server/leaderboards/empty";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    const viewer = await getCurrentUser();
    const data = await getLeaderboards(viewer);
    const cacheControl = viewer
      ? "private, no-store"
      : "public, s-maxage=60, stale-while-revalidate=120";

    return NextResponse.json(data, { headers: { "Cache-Control": cacheControl } });
  } catch (e) {
    console.error("[leaderboards]", e);
    return NextResponse.json(EMPTY_LEADERBOARDS, { status: 200 });
  }
}
