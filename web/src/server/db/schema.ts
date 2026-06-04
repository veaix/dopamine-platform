import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    nickname: text("nickname").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("user"),
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp" }),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    bioEditedAt: integer("bio_edited_at", { mode: "timestamp" }),
    socialLinksJson: text("social_links_json").notNull().default("{}"),
    playtimeSeconds: integer("playtime_seconds").notNull().default(0),
    totalServersCreated: integer("total_servers_created").notNull().default(0),
    availableServerSlots: integer("available_server_slots").notNull().default(0),
    coinsBalance: integer("coins_balance").notNull().default(0),
    isBlocked: integer("is_blocked", { mode: "boolean" }).notNull().default(false),
    totpSecret: text("totp_secret"),
    totpEnabled: integer("totp_enabled", { mode: "boolean" }).notNull().default(false),
    lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
    lastLoginIp: text("last_login_ip"),
    registrationIp: text("registration_ip"),
    trialWindowStartedAt: integer("trial_window_started_at", { mode: "timestamp" }),
    trialServerUsedAt: integer("trial_server_used_at", { mode: "timestamp" }),
    hiddenFromLeaderboards: integer("hidden_from_leaderboards", { mode: "boolean" })
      .notNull()
      .default(false),
    adminPermissionsJson: text("admin_permissions_json"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userNicknameUq: uniqueIndex("users_nickname_uq").on(table.nickname),
    userEmailUq: uniqueIndex("users_email_uq").on(table.email),
  }),
);

export const emailCodes = sqliteTable("email_codes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  consumedAt: integer("consumed_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const pendingRegistrations = sqliteTable(
  "pending_registrations",
  {
    id: text("id").primaryKey(),
    nickname: text("nickname").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    registrationIp: text("registration_ip"),
    code: text("code").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pendingEmailUq: uniqueIndex("pending_reg_email_uq").on(table.email),
    pendingNicknameUq: uniqueIndex("pending_reg_nickname_uq").on(table.nickname),
  }),
);

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  refreshTokenHash: text("refresh_token_hash").notNull(),
  deviceLabel: text("device_label"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  label: text("label").notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const friendRequests = sqliteTable(
  "friend_requests",
  {
    id: text("id").primaryKey(),
    fromUserId: text("from_user_id").notNull(),
    toUserId: text("to_user_id").notNull(),
    status: text("status").notNull().default("pending"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    friendReqUniquePair: uniqueIndex("friend_req_unique_pair").on(table.fromUserId, table.toUserId),
  }),
);

export const profileReactions = sqliteTable(
  "profile_reactions",
  {
    id: text("id").primaryKey(),
    targetUserId: text("target_user_id").notNull(),
    actorUserId: text("actor_user_id").notNull(),
    reaction: text("reaction").notNull(), // like | dislike
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    profileReactionUnique: uniqueIndex("profile_reaction_unique").on(table.targetUserId, table.actorUserId),
  }),
);

export const profileViews = sqliteTable(
  "profile_views",
  {
    id: text("id").primaryKey(),
    targetUserId: text("target_user_id").notNull(),
    viewerUserId: text("viewer_user_id").notNull(),
    viewedAt: integer("viewed_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    profileViewUnique: uniqueIndex("profile_view_unique").on(table.targetUserId, table.viewerUserId),
  }),
);

export const activationKeys = sqliteTable(
  "activation_keys",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    grantServers: integer("grant_servers").notNull().default(1),
    grantCoins: integer("grant_coins").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    expiresAt: integer("expires_at", { mode: "timestamp" }),
    maxUses: integer("max_uses").notNull().default(1),
    usesCount: integer("uses_count").notNull().default(0),
    createdByUserId: text("created_by_user_id"),
    ownerUserId: text("owner_user_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    activationKeyCodeUq: uniqueIndex("activation_keys_code_uq").on(table.code),
  }),
);

export const keyRedemptions = sqliteTable("key_redemptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  activationKeyId: text("activation_key_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const friendKeyGifts = sqliteTable("friend_key_gifts", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id").notNull(),
  toUserId: text("to_user_id").notNull(),
  activationKeyId: text("activation_key_id").notNull(),
  status: text("status").notNull().default("pending"), // pending | accepted | rejected | revoked
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const promoCodes = sqliteTable(
  "promo_codes",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    rewardCoins: integer("reward_coins").notNull().default(0),
    maxUses: integer("max_uses").notNull().default(1),
    usesCount: integer("uses_count").notNull().default(0),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    kind: text("kind").notNull().default("platform"),
    ownerUserId: text("owner_user_id"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    promoCodeUq: uniqueIndex("promo_codes_code_uq").on(table.code),
  }),
);

export const promoRedemptions = sqliteTable(
  "promo_redemptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    promoCodeId: text("promo_code_id").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    promoRedemptionUnique: uniqueIndex("promo_redemption_unique").on(table.userId, table.promoCodeId),
  }),
);

// Prepared for future real-money providers (YooKassa/Stripe/etc).
export const paymentIntents = sqliteTable("payment_intents", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  provider: text("provider").notNull(),
  providerIntentId: text("provider_intent_id"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull().default("RUB"),
  coinsToGrant: integer("coins_to_grant").notNull(),
  status: text("status").notNull().default("created"),
  metadataJson: text("metadata_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const loginEvents = sqliteTable("login_events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const coinLedger = sqliteTable("coin_ledger", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(), // +income / -expense
  reason: text("reason").notNull(), // promo, admin, slot_purchase, payment
  refType: text("ref_type"),
  refId: text("ref_id"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const adminAuditLog = sqliteTable("admin_audit_log", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id").notNull(),
  adminNickname: text("admin_nickname").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  detailsJson: text("details_json").notNull().default("{}"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const rateLimitBuckets = sqliteTable("rate_limit_buckets", {
  bucketKey: text("bucket_key").primaryKey(),
  count: integer("count").notNull().default(1),
  windowStart: integer("window_start", { mode: "timestamp" }).notNull(),
});

export const securityEvents = sqliteTable("security_events", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(),
  ipAddress: text("ip_address"),
  detailsJson: text("details_json").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const platformSettings = sqliteTable("platform_settings", {
  id: text("id").primaryKey(),
  registrationMaxPerIp: integer("registration_max_per_ip").notNull().default(3),
  maxUnverifiedPerIp: integer("max_unverified_per_ip").notNull().default(5),
  trialServerEnabled: integer("trial_server_enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  devices: many(devices),
}));
