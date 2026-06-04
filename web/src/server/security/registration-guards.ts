import { and, eq, gte } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getFraudLimits } from "@/server/security/platform-settings";
import {
  countLegacyUnverifiedFromIp,
  countPendingFromIp,
} from "@/server/auth/pending-registration";

const UNVERIFIED_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function checkRegistrationIpLimits(ip: string | null) {
  if (!ip) return { ok: true as const };

  const { registrationMaxPerIp: maxPerIp, maxUnverifiedPerIp: maxUnverified } = await getFraudLimits();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentUsersFromIp = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.registrationIp, ip), gte(schema.users.createdAt, dayAgo)));

  const pendingToday = await countPendingFromIp(ip, dayAgo);
  if (recentUsersFromIp.length + pendingToday >= maxPerIp) {
    return {
      ok: false as const,
      reason: "registration_ip_limit" as const,
      message: "С этого IP уже зарегистрировано слишком много аккаунтов за сутки",
    };
  }

  const weekAgo = new Date(Date.now() - UNVERIFIED_WINDOW_MS);
  const pendingWeek = await countPendingFromIp(ip, weekAgo);
  const legacyUnverified = await countLegacyUnverifiedFromIp(ip, weekAgo);

  if (pendingWeek + legacyUnverified >= maxUnverified) {
    return {
      ok: false as const,
      reason: "unverified_ip_block" as const,
      message: "С этого IP слишком много незавершённых регистраций. Подтвердите email или попробуйте позже.",
    };
  }

  return { ok: true as const };
}
