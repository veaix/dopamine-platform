import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hashToken } from "@/server/utils/crypto";
import { newId } from "@/server/utils/ids";
import { isEmailVerifiedForAuth } from "./email-verification";
import {
  DEVICE_TOKEN_TTL_MS,
  LAUNCHER_DEVICE_LABEL,
  MAX_DEVICES_PER_USER,
} from "@/server/launcher/constants";

export async function revokeUserDevices(userId: string) {
  await db.delete(schema.devices).where(eq(schema.devices.userId, userId));
}

function deviceIsExpired(device: {
  expiresAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
}): boolean {
  const now = Date.now();
  if (device.expiresAt) return device.expiresAt.getTime() <= now;
  const anchor = device.lastSeenAt ?? device.createdAt;
  return anchor.getTime() + DEVICE_TOKEN_TTL_MS <= now;
}

export async function getUserByDeviceToken(request: Request) {
  const bearer = request.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : null;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const device = await db.query.devices.findFirst({
    where: (devices, { eq: eqFn }) => eqFn(devices.tokenHash, tokenHash),
  });
  if (!device || deviceIsExpired(device)) return null;

  const user = await db.query.users.findFirst({
    where: (users, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(users.id, device.userId), eqFn(users.isBlocked, false)),
  });
  if (!user || !isEmailVerifiedForAuth(user)) return null;
  return user;
}

async function pruneOldDevices(userId: string) {
  const rows = await db.query.devices.findMany({
    where: (d, { eq: eqFn }) => eqFn(d.userId, userId),
    orderBy: (d, { asc: ascFn }) => [ascFn(d.lastSeenAt), ascFn(d.createdAt)],
  });
  if (rows.length < MAX_DEVICES_PER_USER) return;

  const toDrop = rows.slice(0, rows.length - MAX_DEVICES_PER_USER + 1).map((r) => r.id);
  if (toDrop.length) {
    await db.delete(schema.devices).where(inArray(schema.devices.id, toDrop));
  }
}

/** One active launcher token per user; rotates secret, sets expiry. */
export async function issueLauncherDeviceToken(userId: string, label = LAUNCHER_DEVICE_LABEL) {
  const normalizedLabel = label.trim() || LAUNCHER_DEVICE_LABEL;
  const expiresAt = new Date(Date.now() + DEVICE_TOKEN_TTL_MS);

  await db
    .delete(schema.devices)
    .where(and(eq(schema.devices.userId, userId), eq(schema.devices.label, normalizedLabel)));

  await pruneOldDevices(userId);

  const rawToken = `dpl_${newId()}`;
  await db.insert(schema.devices).values({
    id: newId(),
    userId,
    label: normalizedLabel,
    tokenHash: hashToken(rawToken),
    expiresAt,
    lastSeenAt: new Date(),
  });

  return rawToken;
}
