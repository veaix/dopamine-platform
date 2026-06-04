import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function hashToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export function generateSixDigitCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
