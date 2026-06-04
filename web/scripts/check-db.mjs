import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url) {
  console.error("TURSO_DATABASE_URL not set");
  process.exit(1);
}

const c = createClient({ url, authToken });

const users = await c.execute("SELECT COUNT(*) as cnt FROM users");
const tables = await c.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
);
const sample = await c.execute("SELECT id, nickname, email, role FROM users LIMIT 5");
const audit = await c.execute("SELECT COUNT(*) as cnt FROM admin_audit_log").catch(() => ({ rows: [{ cnt: "n/a" }] }));

console.log("users count:", users.rows[0].cnt);
console.log("audit log count:", audit.rows[0].cnt);
console.log("tables:", tables.rows.map((r) => r.name).join(", "));
console.log("sample:", JSON.stringify(sample.rows, null, 2));
