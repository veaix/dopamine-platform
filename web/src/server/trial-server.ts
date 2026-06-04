import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getTrialServerEnabled } from "@/server/security/platform-settings";

export const TRIAL_SERVER_WINDOW_MS = 5 * 60 * 60 * 1000;

export type TrialServerInfo = {
  enabled: boolean;
  windowActive: boolean;
  canCreateTrialServer: boolean;
  trialServerUsed: boolean;
  trialExpiresAt: string | null;
  remainingMs: number;
};

const TRIAL_DISABLED: TrialServerInfo = {
  enabled: false,
  windowActive: false,
  canCreateTrialServer: false,
  trialServerUsed: false,
  trialExpiresAt: null,
  remainingMs: 0,
};

export function getTrialServerInfo(user: {
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
}): TrialServerInfo {
  if (!user.trialWindowStartedAt) {
    return {
      enabled: true,
      windowActive: false,
      canCreateTrialServer: false,
      trialServerUsed: false,
      trialExpiresAt: null,
      remainingMs: 0,
    };
  }

  const windowEnd = user.trialWindowStartedAt.getTime() + TRIAL_SERVER_WINDOW_MS;
  const remainingMs = Math.max(0, windowEnd - Date.now());
  const windowActive = remainingMs > 0;
  const trialServerUsed = Boolean(user.trialServerUsedAt);

  return {
    enabled: true,
    windowActive,
    canCreateTrialServer: windowActive && !trialServerUsed,
    trialServerUsed,
    trialExpiresAt: windowActive ? new Date(windowEnd).toISOString() : null,
    remainingMs,
  };
}

export async function getTrialServerInfoForUser(user: {
  trialWindowStartedAt: Date | null;
  trialServerUsedAt: Date | null;
}): Promise<TrialServerInfo> {
  const enabled = await getTrialServerEnabled();
  if (!enabled) return TRIAL_DISABLED;
  return getTrialServerInfo(user);
}

function trialWindowAnchor(user: {
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): Date {
  return user.emailVerifiedAt ?? user.createdAt;
}

export async function ensureTrialWindowStarted(userId: string) {
  if (!(await getTrialServerEnabled())) return;

  const user = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, userId),
  });
  if (!user || user.trialWindowStartedAt) return;

  const anchor = trialWindowAnchor(user);
  await db
    .update(schema.users)
    .set({ trialWindowStartedAt: anchor, updatedAt: new Date() })
    .where(and(eq(schema.users.id, userId), isNull(schema.users.trialWindowStartedAt)));
}
