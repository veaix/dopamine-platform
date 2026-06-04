import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getViewerMeRanksSlow } from "@/server/leaderboards";
import { toLeaderboardViewer } from "@/server/leaderboards/viewer";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  try {
    const viewer = toLeaderboardViewer(user);
    const me = await getViewerMeRanksSlow(viewer);
    return NextResponse.json(
      { nickname: viewer.nickname, me },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    console.error("[leaderboards/me/slow]", e);
    return NextResponse.json({ nickname: user.nickname, me: null }, { status: 200 });
  }
}
