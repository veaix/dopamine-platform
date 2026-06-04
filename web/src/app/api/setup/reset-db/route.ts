import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join } from "path";
import { json, err } from "@/lib/api";

export const runtime = "nodejs";

function assertSetupSecret(request: Request) {
  const secret = request.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.SETUP_SECRET) return false;
  return true;
}

import { isProductionSetupBlocked } from "@/server/security/setup-guard";

export async function POST(request: Request) {
  if (isProductionSetupBlocked()) return err("Not found", 404);
  if (!assertSetupSecret(request)) return err("Forbidden", 403);

  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) return err("TURSO_DATABASE_URL is not set", 500);

  const client = createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_litestream_%'",
  );

  for (const row of tables.rows) {
    const name = String(row.name);
    await client.execute(`DROP TABLE IF EXISTS "${name}"`);
  }

  const migrationPath = join(process.cwd(), "drizzle", "0000_noisy_randall_flagg.sql");
  const sql = readFileSync(migrationPath, "utf8");
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.execute(statement);
  }

  return json({ ok: true, tablesDropped: tables.rows.length, statementsApplied: statements.length });
}
