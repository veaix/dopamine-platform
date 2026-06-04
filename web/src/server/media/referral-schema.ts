import { createClient, type Client } from "@libsql/client";

let ensured = false;

function dbClient(): Client {
  const url = process.env.TURSO_DATABASE_URL?.trim() || "file:./data/dopamine.db";
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
}

async function addColumnIgnoreExists(c: Client, sql: string) {
  try {
    await c.execute(sql);
  } catch (e) {
    const msg = String(e).toLowerCase();
    if (msg.includes("duplicate column") || msg.includes("already exists")) return;
    throw e;
  }
}

/** Гарантирует колонки referral в promo_codes (на случай если build-migrate не отработал). */
export async function ensureReferralPromoSchema() {
  if (ensured) return;
  const c = dbClient();

  await addColumnIgnoreExists(
    c,
    `ALTER TABLE promo_codes ADD COLUMN kind TEXT NOT NULL DEFAULT 'platform'`,
  );
  await addColumnIgnoreExists(c, `ALTER TABLE promo_codes ADD COLUMN owner_user_id TEXT`);

  try {
    await c.execute(`
      UPDATE promo_codes
      SET kind = 'referral'
      WHERE owner_user_id IS NOT NULL AND (kind IS NULL OR kind = 'platform')
    `);
  } catch {
    /* non-fatal */
  }

  ensured = true;
}

export function toIsoTimestamp(value: unknown): string | null {
  if (value == null) return null;

  let ms: number | null = null;
  if (value instanceof Date) ms = value.getTime();
  else if (typeof value === "number") ms = value;
  else if (typeof value === "string") ms = new Date(value).getTime();

  if (ms == null || Number.isNaN(ms)) return null;
  try {
    return new Date(ms).toISOString();
  } catch {
    return null;
  }
}
