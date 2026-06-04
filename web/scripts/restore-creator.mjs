/**
 * Restore creator account when users table was wiped.
 * Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/restore-creator.mjs
 */
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN;
const email = (process.env.CREATOR_EMAIL ?? "savapley@gmail.com").toLowerCase();
const password = process.env.CREATOR_PASSWORD ?? "DopamineCfd2026!";
const nickname = process.env.CREATOR_NICKNAME ?? "creator";

if (!url) {
  console.error("TURSO_DATABASE_URL required");
  process.exit(1);
}

const c = createClient({ url, authToken });

const existing = await c.execute({
  sql: "SELECT id FROM users WHERE email = ?",
  args: [email],
});

if (existing.rows.length) {
  console.log("Creator already exists:", email);
  process.exit(0);
}

const id = randomBytes(16).toString("hex");
const passwordHash = await bcrypt.hash(password, 12);
await c.execute({
  sql: `INSERT INTO users (
    id, nickname, email, password_hash, role, email_verified_at,
    coins_balance, available_server_slots, is_blocked, totp_enabled,
    playtime_seconds, total_servers_created, social_links_json,
    hidden_from_leaderboards
  ) VALUES (?, ?, ?, ?, 'creator', CURRENT_TIMESTAMP, 0, 99, 0, 0, 0, 0, '{}', 0)`,
  args: [id, nickname, email, passwordHash],
});

const promo = await c.execute("SELECT id FROM promo_codes WHERE code = 'WELCOME5' LIMIT 1");
if (!promo.rows.length) {
  await c.execute({
    sql: `INSERT INTO promo_codes (id, code, reward_coins, max_uses, uses_count, is_active)
          VALUES (?, 'WELCOME5', 5, 999999, 0, 1)`,
    args: [randomBytes(16).toString("hex")],
  });
}

console.log("Creator restored:", email, "| nickname:", nickname);
