/**
 * Safe schema sync for Turso/SQLite — never drops or recreates tables.
 * Run during Vercel build instead of `drizzle-kit push --force`.
 */
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || url.startsWith("file:")) {
  console.log("[migrate] skip (no remote TURSO_DATABASE_URL)");
  process.exit(0);
}

const c = createClient({ url, authToken });

async function hasColumn(table, column) {
  const info = await c.execute(`PRAGMA table_info(${table})`);
  return info.rows.some((row) => String(row.name) === column);
}

async function addColumn(table, column, sqlType) {
  if (await hasColumn(table, column)) return;
  await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqlType}`);
  console.log(`[migrate] + ${table}.${column}`);
}

async function run(sql) {
  await c.execute(sql);
}

try {
  await run(`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id TEXT PRIMARY KEY NOT NULL,
      admin_user_id TEXT NOT NULL,
      admin_nickname TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumn("users", "registration_ip", "TEXT");
  await addColumn("users", "trial_window_started_at", "INTEGER");
  await addColumn("users", "trial_server_used_at", "INTEGER");

  await addColumn("platform_settings", "trial_server_enabled", "INTEGER NOT NULL DEFAULT 1");
  await addColumn("platform_settings", "creator_unlimited_enabled", "INTEGER NOT NULL DEFAULT 1");

  // Anchor trial window to account creation / email verify — not deploy-time login.
  await run(`
    UPDATE users
    SET trial_window_started_at = COALESCE(email_verified_at, created_at)
    WHERE trial_window_started_at IS NULL
  `);
  await run(`
    UPDATE users
    SET trial_window_started_at = COALESCE(email_verified_at, created_at)
    WHERE trial_window_started_at IS NOT NULL
      AND COALESCE(email_verified_at, created_at) IS NOT NULL
      AND trial_window_started_at > COALESCE(email_verified_at, created_at) + 300000
  `);
  await addColumn("users", "total_servers_created", "INTEGER NOT NULL DEFAULT 0");
  await addColumn("users", "hidden_from_leaderboards", "INTEGER NOT NULL DEFAULT 0");
  await addColumn("users", "admin_permissions_json", "TEXT");
  await addColumn("users", "bio_edited_at", "INTEGER");
  await addColumn("activation_keys", "owner_user_id", "TEXT");
  await addColumn("promo_codes", "kind", "TEXT NOT NULL DEFAULT 'platform'");
  await addColumn("promo_codes", "owner_user_id", "TEXT");
  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS promo_referral_owner_uq
    ON promo_codes (owner_user_id)
    WHERE kind = 'referral' AND owner_user_id IS NOT NULL
  `);
  await run(`
    UPDATE promo_codes
    SET kind = 'referral'
    WHERE owner_user_id IS NOT NULL AND (kind IS NULL OR kind = 'platform')
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS friend_key_gifts (
      id TEXT PRIMARY KEY NOT NULL,
      from_user_id TEXT NOT NULL,
      to_user_id TEXT NOT NULL,
      activation_key_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS profile_views (
      id TEXT PRIMARY KEY NOT NULL,
      target_user_id TEXT NOT NULL,
      viewer_user_id TEXT NOT NULL,
      viewed_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE UNIQUE INDEX IF NOT EXISTS profile_view_unique
    ON profile_views (target_user_id, viewer_user_id)
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS rate_limit_buckets (
      bucket_key TEXT PRIMARY KEY NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      window_start INTEGER NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY NOT NULL,
      event_type TEXT NOT NULL,
      ip_address TEXT,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id TEXT PRIMARY KEY NOT NULL,
      registration_max_per_ip INTEGER NOT NULL DEFAULT 3,
      max_unverified_per_ip INTEGER NOT NULL DEFAULT 5,
      updated_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY NOT NULL,
      user_id TEXT NOT NULL,
      label TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at INTEGER
    )
  `);
  await addColumn("devices", "expires_at", "INTEGER");

  await run(`
    CREATE TABLE IF NOT EXISTS pending_registrations (
      id TEXT PRIMARY KEY NOT NULL,
      nickname TEXT NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      registration_ip TEXT,
      code TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`CREATE UNIQUE INDEX IF NOT EXISTS pending_reg_email_uq ON pending_registrations (email)`);
  await run(`CREATE UNIQUE INDEX IF NOT EXISTS pending_reg_nickname_uq ON pending_registrations (nickname)`);

  await run(`CREATE INDEX IF NOT EXISTS idx_friend_requests_to_status ON friend_requests (to_user_id, status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_friend_requests_from_status ON friend_requests (from_user_id, status)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_key_redemptions_key ON key_redemptions (activation_key_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_login_events_user ON login_events (user_id, created_at)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_profile_views_target ON profile_views (target_user_id, viewed_at)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_users_playtime ON users (hidden_from_leaderboards, playtime_seconds)`);
  await run(
    `CREATE INDEX IF NOT EXISTS idx_profile_reactions_target ON profile_reactions (target_user_id, reaction)`,
  );

  console.log("[migrate] done");
} catch (e) {
  console.error("[migrate] failed:", e);
  process.exit(1);
}
