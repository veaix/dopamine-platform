import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { getLeaderboards } from "@/server/leaderboards";
import { EMPTY_LEADERBOARDS } from "@/server/leaderboards/empty";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
  try {
    const viewer = await getCurrentUser();
    const data = await withTimeout(getLeaderboards(viewer), 25_000, EMPTY_LEADERBOARDS);
    const cacheControl = viewer
      ? "private, no-store"
      : "public, s-maxage=60, stale-while-revalidate=120";

    return NextResponse.json(data, { headers: { "Cache-Control": cacheControl } });
  } catch (e) {
    console.error("[leaderboards]", e);
    return NextResponse.json(EMPTY_LEADERBOARDS, { status: 200 });
  }
}
