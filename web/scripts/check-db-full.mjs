import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL not set");
  process.exit(1);
}

const c = createClient({ url, authToken });

const tables = [
  "users",
  "sessions",
  "login_events",
  "devices",
  "email_codes",
  "activation_keys",
  "promo_codes",
  "coin_ledger",
  "friend_requests",
  "admin_audit_log",
];

for (const t of tables) {
  const r = await c.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
  console.log(`${t}:`, r.rows[0].cnt);
}

// Check for sqlite remnants / old tables
const all = await c.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
);
console.log("\nall tables:", all.rows.map((r) => r.name).join(", "));

// Check users table schema
const info = await c.execute("PRAGMA table_info(users)");
console.log("\nusers columns:", info.rows.map((r) => r.name).join(", "));
