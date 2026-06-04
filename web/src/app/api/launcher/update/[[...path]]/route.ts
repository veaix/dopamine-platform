import { fetchLatestYml, findReleaseAsset } from "@/server/launcher/releases";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ path?: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const segments = (await params).path ?? [];
  const joined = segments.map(decodeURIComponent).join("/");

  if (joined === "latest.yml") {
    const yml = await fetchLatestYml();
    if (!yml) return new Response("Update feed unavailable", { status: 404 });
    return new Response(yml, {
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  }

  const safe = segments.join("/");
  if (!safe || safe.includes("..") || safe.includes("\\")) {
    return new Response("Bad request", { status: 400 });
  }

  const filename = segments[segments.length - 1] ?? "";
  const asset = await findReleaseAsset(filename);
  if (!asset) return new Response("Not found", { status: 404 });

  return Response.redirect(asset.browser_download_url, 302);
}
