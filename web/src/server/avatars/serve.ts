import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  if (!dataUrl.startsWith("data:image/")) return null;
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  const header = dataUrl.slice(0, comma).toLowerCase();
  if (!header.endsWith(";base64")) return null;
  const mime = header.slice("data:".length, header.length - ";base64".length);
  const b64 = dataUrl.slice(comma + 1).replace(/\s/g, "");
  try {
    const buf = Buffer.from(b64, "base64");
    if (!buf.length) return null;
    return { mime, bytes: new Uint8Array(buf) };
  } catch {
    return null;
  }
}

export async function loadUserAvatar(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ avatarUrl: schema.users.avatarUrl })
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  const url = row?.avatarUrl?.trim();
  return url || null;
}

export async function loadUserAvatarByNickname(nickname: string): Promise<{
  userId: string;
  avatarUrl: string;
} | null> {
  const [row] = await db
    .select({ id: schema.users.id, avatarUrl: schema.users.avatarUrl })
    .from(schema.users)
    .where(eq(schema.users.nickname, nickname))
    .limit(1);
  const url = row?.avatarUrl?.trim();
  if (!row || !url) return null;
  return { userId: row.id, avatarUrl: url };
}

export function avatarResponse(avatarUrl: string): Response {
  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return Response.redirect(avatarUrl, 302);
  }

  const parsed = parseDataUrl(avatarUrl);
  if (!parsed) {
    return new Response(null, { status: 404 });
  }

  return new Response(Buffer.from(parsed.bytes), {
    status: 200,
    headers: {
      "Content-Type": parsed.mime,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
