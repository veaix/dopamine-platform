import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getViewerMeRanks } from "@/server/leaderboards";
import { toLeaderboardViewer } from "@/server/leaderboards/viewer";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Требуется вход" }, { status: 401 });
  }

  try {
    const viewer = toLeaderboardViewer(user);
    const me = await withTimeout(getViewerMeRanks(viewer), 8_000, null);

    return NextResponse.json(
      { nickname: viewer.nickname, me },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    console.error("[leaderboards/me]", e);
    return NextResponse.json({ nickname: user.nickname, me: null }, { status: 200 });
  }
}
