import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getTrialServerEnabled } from "@/server/security/platform-settings";

export const TRIAL_SERVER_WINDOW_MS = 5 * 60 * 60 * 1000;

export type TrialServerInfo = {
  enabled: boolean;
  windowActive: boolean;
  canCreateTrialServer: boolean;
  trialServerUsed: boolean;
  /** Countdown while window is active; null after expiry. */
  trialExpiresAt: string | null;
  /** Absolute end of the 5h trial window (for launcher purge). */
  trialWindowEndsAt: string | null;
  /** Launcher should delete local trial server(s) when true. */
  shouldPurgeTrialServer: boolean;
  remainingMs: number;
};

export type TrialServerSyncPayload = {
  trialServerUsed: boolean;
  trialWindowEndsAt: string | null;
  shouldPurgeTrialServer: boolean;
  trialActive: boolean;
};

const TRIAL_DISABLED: TrialServerInfo = {
  enabled: false,
  windowActive: false,
  canCreateTrialServer: false,
  trialServerUsed: false,
  trialExpiresAt: null,
  trialWindowEndsAt: null,
  shouldPurgeTrialServer: false,
  remainingMs: 0,
};

function trialWindowAnchor(user: {
  trialWindowStartedAt?: Date | null;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}): Date | null {
  if (user.trialWindowStartedAt) return user.trialWindowStartedAt;
  if (user.emailVerifiedAt) return user.emailVerifiedAt;
  if (user.createdAt) return user.createdAt;
  return null;
}

/** Authoritative trial expiry + purge flag for launcher sync (survives missing local metadata). */
export function getTrialServerSyncInfo(user: {
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}): TrialServerSyncPayload {
  const anchor = trialWindowAnchor(user);
  if (!anchor) {
    return {
      trialServerUsed: Boolean(user.trialServerUsedAt),
      trialWindowEndsAt: null,
      shouldPurgeTrialServer: false,
      trialActive: false,
    };
  }

  const windowEnd = anchor.getTime() + TRIAL_SERVER_WINDOW_MS;
  const trialWindowEndsAt = new Date(windowEnd).toISOString();
  const trialServerUsed = Boolean(user.trialServerUsedAt);
  const trialActive = Date.now() < windowEnd;
  const shouldPurgeTrialServer = trialServerUsed && !trialActive;

  return {
    trialServerUsed,
    trialWindowEndsAt,
    shouldPurgeTrialServer,
    trialActive,
  };
}

export function getTrialServerInfo(user: {
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}): TrialServerInfo {
  const sync = getTrialServerSyncInfo(user);
  const anchor = trialWindowAnchor(user);

  if (!anchor) {
    return {
      enabled: true,
      windowActive: false,
      canCreateTrialServer: false,
      trialServerUsed: sync.trialServerUsed,
      trialExpiresAt: null,
      trialWindowEndsAt: null,
      shouldPurgeTrialServer: sync.shouldPurgeTrialServer,
      remainingMs: 0,
    };
  }

  const windowEnd = anchor.getTime() + TRIAL_SERVER_WINDOW_MS;
  const remainingMs = Math.max(0, windowEnd - Date.now());
  const windowActive = remainingMs > 0;

  return {
    enabled: true,
    windowActive,
    canCreateTrialServer: windowActive && !sync.trialServerUsed,
    trialServerUsed: sync.trialServerUsed,
    trialExpiresAt: windowActive ? sync.trialWindowEndsAt : null,
    trialWindowEndsAt: sync.trialWindowEndsAt,
    shouldPurgeTrialServer: sync.shouldPurgeTrialServer,
    remainingMs,
  };
}

export async function getTrialServerInfoForUser(user: {
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
  emailVerifiedAt?: Date | null;
  createdAt?: Date;
}): Promise<TrialServerInfo> {
  const enabled = await getTrialServerEnabled();
  if (!enabled) return TRIAL_DISABLED;
  return getTrialServerInfo(user);
}

export async function ensureTrialWindowStarted(userId: string) {
  if (!(await getTrialServerEnabled())) return;

  const user = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, userId),
    columns: {
      id: true,
      trialWindowStartedAt: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
  if (!user || user.trialWindowStartedAt) return;

  const anchor = trialWindowAnchor(user);
  if (!anchor) return;

  await db
    .update(schema.users)
    .set({ trialWindowStartedAt: anchor, updatedAt: new Date() })
    .where(and(eq(schema.users.id, userId), isNull(schema.users.trialWindowStartedAt)));
}
