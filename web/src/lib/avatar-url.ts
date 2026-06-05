/** ms timestamp for cache-busting avatar URLs after upload/delete. */
export function avatarVersionKey(
  hasAvatar: boolean,
  updatedAt: Date | string | number | null | undefined,
): number | undefined {
  if (!hasAvatar || updatedAt == null) return undefined;
  const ms =
    updatedAt instanceof Date
      ? updatedAt.getTime()
      : typeof updatedAt === "number"
        ? updatedAt
        : Date.parse(String(updatedAt));
  return Number.isFinite(ms) ? ms : undefined;
}

/** URL for avatar image (served separately from JSON — avoids huge base64 in APIs). */
export function userAvatarSrc(userId: string, cacheBust?: number | string) {
  const base = `/api/users/${encodeURIComponent(userId)}/avatar`;
  if (cacheBust === undefined || cacheBust === "") return base;
  return `${base}?v=${encodeURIComponent(String(cacheBust))}`;
}