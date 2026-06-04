import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";

export type SecurityEventType =
  | "rate_limit"
  | "honeypot"
  | "form_too_fast"
  | "disposable_email"
  | "turnstile_fail"
  | "unverified_ip_block"
  | "registration_ip_limit";

export async function logSecurityEvent(
  eventType: SecurityEventType,
  ip: string | null,
  details: Record<string, unknown> = {},
) {
  try {
    await db.insert(schema.securityEvents).values({
      id: newId(),
      eventType,
      ipAddress: ip,
      detailsJson: JSON.stringify(details),
    });
  } catch {
    // never block auth flow on logging failure
  }
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number; message: string };

export async function checkRateLimit(
  bucketKey: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStartMs = now.getTime() - windowMs;

  return db.transaction(async (tx) => {
    const existing = await tx.query.rateLimitBuckets.findFirst({
      where: (b, { eq: eqFn }) => eqFn(b.bucketKey, bucketKey),
    });

    if (!existing || existing.windowStart.getTime() < windowStartMs) {
      await tx
        .insert(schema.rateLimitBuckets)
        .values({ bucketKey, count: 1, windowStart: now })
        .onConflictDoUpdate({
          target: schema.rateLimitBuckets.bucketKey,
          set: { count: 1, windowStart: now },
        });
      return { ok: true as const };
    }

    if (existing.count >= limit) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((existing.windowStart.getTime() + windowMs - now.getTime()) / 1000),
      );
      return {
        ok: false as const,
        retryAfterSec,
        message: `Слишком много попыток. Подождите ${retryAfterSec} сек.`,
      };
    }

    const updated = await tx
      .update(schema.rateLimitBuckets)
      .set({ count: sql`${schema.rateLimitBuckets.count} + 1` })
      .where(
        and(
          eq(schema.rateLimitBuckets.bucketKey, bucketKey),
          sql`${schema.rateLimitBuckets.count} < ${limit}`,
        ),
      )
      .returning({ count: schema.rateLimitBuckets.count });

    if (!updated.length) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((existing.windowStart.getTime() + windowMs - now.getTime()) / 1000),
      );
      return {
        ok: false as const,
        retryAfterSec,
        message: `Слишком много попыток. Подождите ${retryAfterSec} сек.`,
      };
    }

    return { ok: true as const };
  });
}

export async function enforceRateLimit(
  action: string,
  ip: string | null,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const key = ip ? `${action}:ip:${ip}` : `${action}:unknown`;
  const result = await checkRateLimit(key, limit, windowMs);
  if (!result.ok) {
    await logSecurityEvent("rate_limit", ip, { action, limit, windowMs });
  }
  return result;
}

export function rateLimitResponse(result: Extract<RateLimitResult, { ok: false }>) {
  return Response.json(
    { error: result.message },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSec) } },
  );
}
