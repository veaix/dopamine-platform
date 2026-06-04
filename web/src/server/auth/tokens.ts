import { SignJWT, jwtVerify } from "jose";

const PLACEHOLDER = "dev_access_secret_change_me";

function accessSecretBytes() {
  const rawSecret = process.env.JWT_ACCESS_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!rawSecret || rawSecret === PLACEHOLDER || rawSecret.length < 32) {
      throw new Error("JWT_ACCESS_SECRET must be set to a strong value (32+ chars) in production");
    }
  }
  return new TextEncoder().encode(rawSecret ?? PLACEHOLDER);
}

/** Matches session cookie maxAge in auth routes (7 days) */
const ACCESS_TTL = "7d";

type AccessPayload = {
  sub: string;
  role: string;
};

export async function signAccessToken(payload: AccessPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(accessSecretBytes());
}

export async function verifyAccessToken(token: string) {
  const result = await jwtVerify(token, accessSecretBytes());
  return result.payload as AccessPayload & { exp: number; iat: number };
}

export const accessTokenMaxAgeSec = 60 * 60 * 24 * 7;
