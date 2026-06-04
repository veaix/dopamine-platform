import { desc, sql, isNull, and, gte, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { json, err } from "@/lib/api";
import { getFraudLimits, updateFraudLimits } from "@/server/security/platform-settings";

function safeJsonParse(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function toIso(d: Date | null | undefined): string {
  if (!d || Number.isNaN(d.getTime())) return new Date(0).toISOString();
  return d.toISOString();
}

export async function GET() {
  const { error } = await requireAdminApi("fraud");
  if (error) return error;

  try {
    return await getFraudPayload();
  } catch (e) {
    console.error("[admin/fraud] GET failed:", e);
    return err("Не удалось загрузить данные антифрода", 500);
  }
}

async function getFraudPayload() {
  const limits = await getFraudLimits();

  const [registrationDupes, loginDupes, recentEvents, unverifiedDupes] = await Promise.all([
    db
      .select({
        ip: schema.users.registrationIp,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .where(sql`${schema.users.registrationIp} is not null and ${schema.users.registrationIp} != ''`)
      .groupBy(schema.users.registrationIp)
      .having(sql`count(*) > 1`)
      .orderBy(sql`count(*) desc`)
      .limit(50),
    db
      .select({
        ip: schema.users.lastLoginIp,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .where(sql`${schema.users.lastLoginIp} is not null and ${schema.users.lastLoginIp} != ''`)
      .groupBy(schema.users.lastLoginIp)
      .having(sql`count(*) > 1`)
      .orderBy(sql`count(*) desc`)
      .limit(50),
    db
      .select({
        id: schema.securityEvents.id,
        eventType: schema.securityEvents.eventType,
        ipAddress: schema.securityEvents.ipAddress,
        detailsJson: schema.securityEvents.detailsJson,
        createdAt: schema.securityEvents.createdAt,
      })
      .from(schema.securityEvents)
      .orderBy(desc(schema.securityEvents.createdAt))
      .limit(80),
    db
      .select({
        ip: schema.users.registrationIp,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .where(
        and(
          sql`${schema.users.registrationIp} is not null and ${schema.users.registrationIp} != ''`,
          isNull(schema.users.emailVerifiedAt),
          gte(schema.users.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
        ),
      )
      .groupBy(schema.users.registrationIp)
      .having(sql`count(*) >= 2`)
      .orderBy(sql`count(*) desc`)
      .limit(30),
  ]);

  const dupeSlice = registrationDupes.slice(0, 15);
  const dupeIps = dupeSlice.map((r) => r.ip).filter((ip): ip is string => Boolean(ip));
  const usersByIp = new Map<string, { nickname: string; email: string }[]>();

  if (dupeIps.length > 0) {
    const rows = await db
      .select({
        nickname: schema.users.nickname,
        email: schema.users.email,
        ip: schema.users.registrationIp,
      })
      .from(schema.users)
      .where(inArray(schema.users.registrationIp, dupeIps));

    for (const u of rows) {
      if (!u.ip) continue;
      const list = usersByIp.get(u.ip) ?? [];
      if (list.length < 20) list.push({ nickname: u.nickname, email: u.email });
      usersByIp.set(u.ip, list);
    }
  }

  const recentByRegIp = dupeSlice.map((row) => ({
    ip: row.ip,
    count: Number(row.count),
    users: row.ip ? (usersByIp.get(row.ip) ?? []) : [],
  }));

  return json({
    registrationMaxPerIp: limits.registrationMaxPerIp,
    maxUnverifiedPerIp: limits.maxUnverifiedPerIp,
    trialServerEnabled: limits.trialServerEnabled,
    limitsSource: limits.source,
    registrationDuplicates: recentByRegIp,
    unverifiedIpClusters: unverifiedDupes.map((r) => ({
      ip: r.ip,
      count: Number(r.count),
    })),
    loginIpClusters: loginDupes.map((r) => ({
      ip: r.ip,
      count: Number(r.count),
    })),
    recentSecurityEvents: recentEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      ipAddress: e.ipAddress,
      details: safeJsonParse(e.detailsJson),
      createdAt: toIso(e.createdAt),
    })),
    protections: {
      turnstile: Boolean(process.env.TURNSTILE_SECRET_KEY),
      disposableEmailBlock: true,
      rateLimits: true,
      honeypot: true,
    },
  });
}

export async function PATCH(request: Request) {
  const { admin, error } = await requireAdminApi("fraud");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    registrationMaxPerIp?: number;
    maxUnverifiedPerIp?: number;
    trialServerEnabled?: boolean;
  } | null;

  const current = await getFraudLimits();

  const registrationMaxPerIp =
    typeof body?.registrationMaxPerIp === "number"
      ? body.registrationMaxPerIp
      : current.registrationMaxPerIp;
  const maxUnverifiedPerIp =
    typeof body?.maxUnverifiedPerIp === "number"
      ? body.maxUnverifiedPerIp
      : current.maxUnverifiedPerIp;
  const trialServerEnabled =
    typeof body?.trialServerEnabled === "boolean"
      ? body.trialServerEnabled
      : current.trialServerEnabled;

  if (
    typeof registrationMaxPerIp !== "number" ||
    typeof maxUnverifiedPerIp !== "number" ||
    typeof trialServerEnabled !== "boolean"
  ) {
    return err("Некорректные параметры настроек", 400);
  }

  const updated = await updateFraudLimits({
    registrationMaxPerIp,
    maxUnverifiedPerIp,
    trialServerEnabled,
  });

  await logAdminAction({
    admin: admin!,
    action: "fraud.update_limits",
    targetType: "platform_settings",
    targetId: "default",
    details: updated,
    request,
  });

  return json({ ok: true, ...updated, limitsSource: "database" as const });
}
