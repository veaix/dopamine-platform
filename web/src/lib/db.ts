import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";
import fs from "node:fs";
import path from "node:path";

export type Db = LibSQLDatabase<typeof schema>;

let client: Client | null = null;
let db: Db | null = null;

function resolveDatabaseUrl(): string {
  if (process.env.TURSO_DATABASE_URL) {
    return process.env.TURSO_DATABASE_URL;
  }
  const url = process.env.DATABASE_URL || "file:./data/dopamine.db";
  if (url.startsWith("file:")) {
    const filePath = url.replace(/^file:/, "");
    const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return `file:${abs}`;
  }
  return url;
}

export function getClient(): Client {
  if (!client) getDb();
  return client!;
}

export function getDb(): Db {
  if (db) return db;
  const url = resolveDatabaseUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN;
  client = createClient(
    url.startsWith("libsql://") || url.startsWith("https://")
      ? { url, authToken }
      : { url },
  );
  db = drizzle(client, { schema });
  return db;
}

export async function ensureSchema(): Promise<void> {
  const c = getClient();
  await c.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      banned_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS refresh_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      os TEXT,
      app_version TEXT,
      running_servers INTEGER NOT NULL DEFAULT 0,
      last_seen_at INTEGER,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS device_link_codes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS entitlements (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      can_create_servers INTEGER NOT NULL DEFAULT 0,
      max_servers INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      source TEXT NOT NULL DEFAULT 'default',
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS activation_keys (
      id TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL UNIQUE,
      label TEXT,
      grants_json TEXT NOT NULL,
      max_uses INTEGER NOT NULL DEFAULT 1,
      uses_left INTEGER NOT NULL DEFAULT 1,
      expires_at INTEGER,
      revoked_at INTEGER,
      created_by TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS key_redemptions (
      id TEXT PRIMARY KEY,
      key_id TEXT NOT NULL REFERENCES activation_keys(id),
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      redeemed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
  await c.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      meta_json TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
}
