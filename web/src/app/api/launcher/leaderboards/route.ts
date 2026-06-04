import { NextResponse } from "next/server";
import { getUserByDeviceToken } from "@/server/auth/device";
import { getLeaderboards } from "@/server/leaderboards";

export async function GET(request: Request) {
  const viewer = await getUserByDeviceToken(request);
  const data = await getLeaderboards(viewer);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=60" },
  });
}
