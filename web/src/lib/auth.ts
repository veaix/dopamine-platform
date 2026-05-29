import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users, refreshSessions } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/crypto";
import { nanoid } from "nanoid";

const ACCESS_COOKIE = "dopamine_access";
const REFRESH_COOKIE = "dopamine_refresh";

export type SessionUser = {
  id: string;
  email: string;
  role: "user" | "tester" | "creator";
};

function accessSecret() {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_ACCESS_SECRET is not configured");
  return new TextEncoder().encode(s);
}

function refreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s || s.length < 16) throw new Error("JWT_REFRESH_SECRET is not configured");
  return new TextEncoder().encode(s);
}

export async function signAccessToken(user: SessionUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(accessSecret());
}

export async function verifyAccessToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret());
    if (!payload.sub || typeof payload.email !== "string" || typeof payload.role !== "string") {
      return null;
    }
    const role = payload.role as SessionUser["role"];
    if (!["user", "tester", "creator"].includes(role)) return null;
    return { id: String(payload.sub), email: payload.email, role };
  } catch {
    return null;
  }
}

export async function createRefreshSession(userId: string): Promise<string> {
  const token = generateToken(48);
  const db = getDb();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await db.insert(refreshSessions).values({
    id: nanoid(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });
  return token;
}

export async function rotateRefreshSession(oldToken: string): Promise<{ access: string; refresh: string; user: SessionUser } | null> {
  const db = getDb();
  const hash = hashToken(oldToken);
  const rows = await db.select().from(refreshSessions).where(eq(refreshSessions.tokenHash, hash)).limit(1);
  const row = rows[0];
  if (!row || row.expiresAt.getTime() < Date.now()) return null;

  const userRows = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  const user = userRows[0];
  if (!user || user.bannedAt) return null;

  await db.delete(refreshSessions).where(eq(refreshSessions.id, row.id));

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role as SessionUser["role"],
  };
  const refresh = await createRefreshSession(user.id);
  const access = await signAccessToken(sessionUser);
  return { access, refresh, user: sessionUser };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const db = getDb();
  await db.delete(refreshSessions).where(eq(refreshSessions.tokenHash, hashToken(token)));
}

export async function setSessionCookies(access: string, refresh: string): Promise<void> {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(ACCESS_COOKIE, access, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });
  jar.set(REFRESH_COOKIE, refresh, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });
}

export async function clearSessionCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) {
    const user = await verifyAccessToken(access);
    if (user) {
      const db = getDb();
      const row = (await db.select().from(users).where(eq(users.id, user.id)).limit(1))[0];
      if (row && !row.bannedAt) return user;
    }
  }

  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) return null;

  const rotated = await rotateRefreshSession(refresh);
  if (!rotated) {
    await clearSessionCookies();
    return null;
  }

  await setSessionCookies(rotated.access, rotated.refresh);
  return rotated.user;
}

export function getBearerToken(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice(7).trim() || null;
}

export function getDeviceToken(req: Request): string | null {
  const direct = req.headers.get("x-device-token");
  if (direct) return direct.trim();
  const bearer = getBearerToken(req);
  if (bearer?.startsWith("dev_")) return bearer;
  return null;
}
