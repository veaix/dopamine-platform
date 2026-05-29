import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { err, json, withSchema } from "@/lib/api";
import { generateToken, hashToken } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { deviceLinkCodes, devices, users } from "@/db/schema";
import { resolveEntitlements } from "@/lib/entitlements";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  code: z.string().min(4).max(12),
  deviceName: z.string().min(1).max(80).default("dopamine"),
  appVersion: z.string().max(32).optional(),
  os: z.string().max(64).optional(),
});

export const POST = withSchema(async (req) => {
  const body = bodySchema.parse(await req.json());
  const db = getDb();
  const normalized = body.code.trim().toUpperCase();
  const linkRow = (
    await db
      .select()
      .from(deviceLinkCodes)
      .where(and(eq(deviceLinkCodes.code, normalized), isNull(deviceLinkCodes.usedAt)))
      .limit(1)
  )[0];

  if (!linkRow || linkRow.expiresAt.getTime() < Date.now()) {
    return err("invalid_or_expired_code", 400);
  }

  const user = (await db.select().from(users).where(eq(users.id, linkRow.userId)).limit(1))[0];
  if (!user || user.bannedAt) return err("banned", 403);

  const deviceToken = `dev_${generateToken(32)}`;
  const deviceId = nanoid();

  await db.insert(devices).values({
    id: deviceId,
    userId: user.id,
    name: body.deviceName,
    tokenHash: hashToken(deviceToken),
    os: body.os ?? null,
    appVersion: body.appVersion ?? null,
    lastSeenAt: new Date(),
  });

  await db
    .update(deviceLinkCodes)
    .set({ usedAt: new Date() })
    .where(eq(deviceLinkCodes.id, linkRow.id));

  await writeAudit("device.link", user.id, { deviceId });

  const sessionUser = {
    id: user.id,
    email: user.email,
    role: user.role as "user" | "tester" | "creator",
  };
  const ent = await resolveEntitlements(sessionUser);

  return json({
    ok: true,
    deviceToken,
    deviceId,
    user: { email: user.email, role: user.role },
    entitlements: ent,
  });
});
