/** URL for avatar image (served separately from JSON — avoids huge base64 in APIs). */
export function userAvatarSrc(userId: string, cacheBust?: number | string) {
  const base = `/api/users/${encodeURIComponent(userId)}/avatar`;
  if (cacheBust === undefined || cacheBust === "") return base;
  return `${base}?v=${encodeURIComponent(String(cacheBust))}`;
}
