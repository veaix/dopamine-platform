import { NextResponse } from "next/server";
import { indexableSiteUrls, pingIndexNow } from "@/lib/indexnow";

export async function POST(request: Request) {
  const secret = process.env.INDEXNOW_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "INDEXNOW_SECRET not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let urls = indexableSiteUrls();
  try {
    const body = (await request.json()) as { urls?: string[] };
    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urls = body.urls;
    }
  } catch {
    // use default urls
  }

  const results = await pingIndexNow(urls);
  return NextResponse.json({ ok: true, urls, results });
}
