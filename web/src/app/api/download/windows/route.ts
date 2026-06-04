import { NextResponse } from "next/server";
import { getLatestLauncherRelease } from "@/lib/launcher-release";

export const runtime = "nodejs";

/** Постоянная ссылка на последний Windows-установщик (редирект на GitHub Releases). */
export async function GET() {
  const release = await getLatestLauncherRelease();
  if (!release) {
    return NextResponse.json({ error: "Release not found" }, { status: 502 });
  }

  return NextResponse.redirect(release.setup.url, 302);
}
