import { siteUrl } from "@/lib/site-url";

/** CI publishes tagged builds here; override with LAUNCHER_GITHUB_REPO if needed. */
const DEFAULT_REPO = "veaix/dopamine-MinecraftLauncher";

type GhAsset = {
  name: string;
  browser_download_url: string;
  size: number;
};

type GhRelease = {
  tag_name: string;
  name: string;
  html_url: string;
  published_at: string;
  assets: GhAsset[];
};

export type LauncherRelease = {
  tag: string;
  name: string;
  pageUrl: string;
  publishedAt: string;
  setup: { name: string; url: string; size: number };
  portable?: { name: string; url: string; size: number };
};

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "dopamine-web",
  };
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.LAUNCHER_GITHUB_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function pickAsset(assets: GhAsset[], kind: "setup" | "portable") {
  const exe = assets.filter(
    (a) =>
      /\.exe$/i.test(a.name) &&
      !/blockmap/i.test(a.name) &&
      (kind === "setup" ? /setup/i.test(a.name) : /portable/i.test(a.name)),
  );
  return exe[0] ?? null;
}

/** Прокси-URL на нашем домене — не светит GitHub пользователю в браузере. */
export function proxyDownloadUrl(filename: string) {
  return `${siteUrl()}/api/launcher/files/${encodeURIComponent(filename)}`;
}

export function proxyUpdateUrl(path: string) {
  const clean = path.replace(/^\//, "");
  return `${siteUrl()}/api/launcher/update/${clean}`;
}

export async function fetchLatestGhRelease(): Promise<GhRelease | null> {
  const repo = (process.env.LAUNCHER_GITHUB_REPO ?? DEFAULT_REPO).trim();
  const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: githubHeaders(),
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as GhRelease;
}

export async function getLatestLauncherRelease(): Promise<LauncherRelease | null> {
  const data = await fetchLatestGhRelease();
  if (!data) return null;

  const setup = pickAsset(data.assets ?? [], "setup");
  if (!setup) return null;

  const portable = pickAsset(data.assets ?? [], "portable");

  return {
    tag: data.tag_name,
    name: data.name || data.tag_name,
    pageUrl: data.html_url,
    publishedAt: data.published_at,
    setup: {
      name: setup.name,
      url: proxyDownloadUrl(setup.name),
      size: setup.size,
    },
    portable: portable
      ? { name: portable.name, url: proxyDownloadUrl(portable.name), size: portable.size }
      : undefined,
  };
}

export async function findReleaseAsset(filename: string): Promise<GhAsset | null> {
  const data = await fetchLatestGhRelease();
  if (!data) return null;
  return data.assets?.find((a) => a.name === filename) ?? null;
}

export async function fetchLatestYml(): Promise<string | null> {
  const asset = await findReleaseAsset("latest.yml");
  if (!asset) return null;

  const res = await fetch(asset.browser_download_url, {
    headers: githubHeaders(),
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;

  let yml = await res.text();
  const base = `${siteUrl()}/api/launcher/update/`;
  yml = yml.replace(/^(\s*-\s*url:\s*)(.+)$/gm, (_, prefix, url) => {
    const name = String(url).trim().split("/").pop() ?? url;
    return `${prefix}${base}${name}`;
  });
  yml = yml.replace(/^path:\s*(.+)$/m, (_, path) => {
    const name = String(path).trim().split("/").pop() ?? path;
    return `path: ${base}${name}`;
  });
  return yml;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
