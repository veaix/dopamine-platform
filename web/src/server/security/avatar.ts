const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_CHARS = 280_000; // ~200KB base64

export function validateAvatarDataUrl(value: string): string | null {
  if (!value.startsWith("data:image/")) return null;
  if (value.length > MAX_CHARS) return null;

  const comma = value.indexOf(",");
  if (comma < 0) return null;

  const header = value.slice(0, comma).toLowerCase();
  const payload = value.slice(comma + 1);

  if (!header.endsWith(";base64")) return null;
  const mime = header.slice("data:".length, header.length - ";base64".length);
  if (!ALLOWED.has(mime)) return null;
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(payload)) return null;

  return value;
}
