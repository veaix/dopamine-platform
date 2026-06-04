export function trimAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.length > 512) return null;
  return url;
}
