const CANONICAL_ORIGIN = "https://www.dopamine.cfd";

/** Всегда возвращает origin с www.dopamine.cfd (apex → www). */
export function siteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  let raw = fromEnv?.replace(/\/$/, "");
  if (!raw) {
    if (process.env.VERCEL_URL) raw = `https://${process.env.VERCEL_URL}`;
    else return CANONICAL_ORIGIN;
  }
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (u.hostname === "dopamine.cfd") u.hostname = "www.dopamine.cfd";
    return u.origin;
  } catch {
    return CANONICAL_ORIGIN;
  }
}

export function apiUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    try {
      const u = new URL(fromEnv.replace(/\/$/, ""));
      if (u.hostname === "dopamine.cfd") u.hostname = "www.dopamine.cfd";
      return u.origin;
    } catch {
      /* fall through */
    }
  }
  return siteUrl();
}
