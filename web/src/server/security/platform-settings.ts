import { db, schema } from "@/server/db";

const SETTINGS_ID = "default";
const DEFAULT_MAX_PER_IP = 3;
const DEFAULT_MAX_UNVERIFIED = 5;

export type FraudLimits = {
  registrationMaxPerIp: number;
  maxUnverifiedPerIp: number;
  trialServerEnabled: boolean;
  source: "database" | "env" | "default";
};

function fromEnv() {
  const maxPerIp = Number(process.env.REGISTRATION_MAX_PER_IP ?? DEFAULT_MAX_PER_IP);
  const maxUnverified = Number(process.env.REGISTRATION_MAX_UNVERIFIED_PER_IP ?? DEFAULT_MAX_UNVERIFIED);
  const trialOff = process.env.TRIAL_SERVER_ENABLED === "0" || process.env.TRIAL_SERVER_ENABLED === "false";
  return {
    registrationMaxPerIp: Number.isFinite(maxPerIp) && maxPerIp > 0 ? maxPerIp : DEFAULT_MAX_PER_IP,
    maxUnverifiedPerIp:
      Number.isFinite(maxUnverified) && maxUnverified > 0 ? maxUnverified : DEFAULT_MAX_UNVERIFIED,
    trialServerEnabled: !trialOff,
  };
}

function clampLimit(n: number, fallback: number) {
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(1, Math.round(n)));
}

export async function getFraudLimits(): Promise<FraudLimits> {
  const row = await db.query.platformSettings.findFirst({
    where: (s, { eq: eqFn }) => eqFn(s.id, SETTINGS_ID),
  });

  const env = fromEnv();

  if (row) {
    return {
      registrationMaxPerIp: row.registrationMaxPerIp,
      maxUnverifiedPerIp: row.maxUnverifiedPerIp,
      trialServerEnabled: row.trialServerEnabled,
      source: "database",
    };
  }

  const hasEnv =
    process.env.REGISTRATION_MAX_PER_IP !== undefined ||
    process.env.REGISTRATION_MAX_UNVERIFIED_PER_IP !== undefined ||
    process.env.TRIAL_SERVER_ENABLED !== undefined;

  return {
    registrationMaxPerIp: env.registrationMaxPerIp,
    maxUnverifiedPerIp: env.maxUnverifiedPerIp,
    trialServerEnabled: env.trialServerEnabled,
    source: hasEnv ? "env" : "default",
  };
}

export async function getTrialServerEnabled(): Promise<boolean> {
  const limits = await getFraudLimits();
  return limits.trialServerEnabled;
}

export async function updateFraudLimits(input: {
  registrationMaxPerIp: number;
  maxUnverifiedPerIp: number;
  trialServerEnabled?: boolean;
}) {
  const registrationMaxPerIp = clampLimit(input.registrationMaxPerIp, DEFAULT_MAX_PER_IP);
  const maxUnverifiedPerIp = clampLimit(input.maxUnverifiedPerIp, DEFAULT_MAX_UNVERIFIED);
  const now = new Date();

  const existing = await db.query.platformSettings.findFirst({
    where: (s, { eq: eqFn }) => eqFn(s.id, SETTINGS_ID),
  });

  const trialServerEnabled =
    typeof input.trialServerEnabled === "boolean"
      ? input.trialServerEnabled
      : (existing?.trialServerEnabled ?? true);

  await db
    .insert(schema.platformSettings)
    .values({
      id: SETTINGS_ID,
      registrationMaxPerIp,
      maxUnverifiedPerIp,
      trialServerEnabled,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: schema.platformSettings.id,
      set: { registrationMaxPerIp, maxUnverifiedPerIp, trialServerEnabled, updatedAt: now },
    });

  return { registrationMaxPerIp, maxUnverifiedPerIp, trialServerEnabled };
}

export async function updateTrialServerEnabled(enabled: boolean) {
  const limits = await getFraudLimits();
  return updateFraudLimits({
    registrationMaxPerIp: limits.registrationMaxPerIp,
    maxUnverifiedPerIp: limits.maxUnverifiedPerIp,
    trialServerEnabled: enabled,
  });
}
