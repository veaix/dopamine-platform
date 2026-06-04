import { findReleaseAsset } from "@/server/launcher/releases";

type Params = { params: Promise<{ filename: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { filename } = await params;
  const safe = decodeURIComponent(filename || "");
  if (!safe || safe.includes("..") || safe.includes("/") || safe.includes("\\")) {
    return new Response("Bad request", { status: 400 });
  }

  const asset = await findReleaseAsset(safe);
  if (!asset) return new Response("Not found", { status: 404 });

  return Response.redirect(asset.browser_download_url, 302);
}
