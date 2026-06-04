import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getUserByDeviceToken } from "@/server/auth/device";
import { json, err } from "@/lib/api";
import { checkRateLimit } from "@/server/security/rate-limit";
import { hashToken } from "@/server/utils/crypto";
import {
  LAUNCHER_HEARTBEAT_LIMIT,
  LAUNCHER_HEARTBEAT_MAX_SECONDS,
  LAUNCHER_HEARTBEAT_WINDOW_MS,
} from "@/server/launcher/constants";

export async function POST(request: Request) {
  const user = await getUserByDeviceToken(request);
  if (!user) return err("Unauthorized", 401);

  const rate = await checkRateLimit(
    `launcher:heartbeat:user:${user.id}`,
    LAUNCHER_HEARTBEAT_LIMIT,
    LAUNCHER_HEARTBEAT_WINDOW_MS,
  );
  if (!rate.ok) return err(rate.message, 429);

  const body = (await request.json().catch(() => null)) as { seconds?: number } | null;
  const seconds = Math.min(
    Math.max(Math.floor(Number(body?.seconds ?? 0)), 0),
    LAUNCHER_HEARTBEAT_MAX_SECONDS,
  );

  if (seconds > 0) {
    await db
      .update(schema.users)
      .set({
        playtimeSeconds: sql`${schema.users.playtimeSeconds} + ${seconds}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));
  }

  const token = request.headers.get("authorization")?.slice("Bearer ".length) ?? "";
  if (token) {
    const tokenHash = hashToken(token);
    const device = await db.query.devices.findFirst({
      where: (d, { eq: eqFn }) => eqFn(d.tokenHash, tokenHash),
    });
    if (device) {
      await db
        .update(schema.devices)
        .set({ lastSeenAt: new Date() })
        .where(eq(schema.devices.id, device.id));
    }
  }

  return json({ ok: true });
}
