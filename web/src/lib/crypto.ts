import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const PEPPER = () => process.env.DEVICE_TOKEN_PEPPER || "dev-pepper-change-me";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashToken(token: string): string {
  return createHash("sha256")
    .update(`${PEPPER()}:${token}`)
    .digest("hex");
}

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const buf = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[buf[i]! % chars.length];
  }
  return code;
}

export function formatActivationKey(raw: string): string {
  const clean = raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (clean.length <= 4) return clean;
  const parts = clean.match(/.{1,4}/g) || [];
  return `DOP-${parts.slice(0, 4).join("-")}`;
}

export function normalizeActivationKey(input: string): string {
  return input.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

export function hashActivationKey(code: string): string {
  return createHash("sha256").update(`key:${normalizeActivationKey(code)}`).digest("hex");
}
