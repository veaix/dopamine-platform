import { NextResponse } from "next/server";
import { getLatestLauncherRelease } from "@/lib/launcher-release";

export const runtime = "nodejs";

export async function GET() {
  const release = await getLatestLauncherRelease();
  if (!release?.portable) {
    return NextResponse.json({ error: "Portable build not found" }, { status: 404 });
  }

  return NextResponse.redirect(release.portable.url, 302);
}
