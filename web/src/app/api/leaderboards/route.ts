import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getLeaderboards } from "@/server/leaderboards";

export async function GET() {
  const viewer = await getCurrentUser();
  const data = await getLeaderboards(viewer);
  const cacheControl = viewer
    ? "private, no-store"
    : "public, s-maxage=120, stale-while-revalidate=300";

  return NextResponse.json(data, { headers: { "Cache-Control": cacheControl } });
}
