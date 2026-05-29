import { eq } from "drizzle-orm";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { err, json, withSchema } from "@/lib/api";
import { getDeviceToken } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { devices } from "@/db/schema";
import { getDeviceWithUser, resolveEntitlements } from "@/lib/entitlements";

const bodySchema = z.object({
  runningServers: z.number().int().min(0).max(1000).default(0),
  appVersion: z.string().max(32).optional(),
  os: z.string().max(64).optional(),
  ts: z.number().int().optional(),
});

function verifyHeartbeatSig(token: string, body: string, sig: string | null): boolean {
  if (!sig) return process.env.NODE_ENV !== "production";
  const secret = process.env.DEVICE_TOKEN_PEPPER || "dev-pepper";
  const expected = createHmac("sha256", secret).update(`${token}:${body}`).digest("hex");
  return sig === expected;
}

export const POST = withSchema(async (req) => {
  const deviceToken = getDeviceToken(req);
  if (!deviceToken) return err("unauthorized", 401);

  const rawBody = await req.text();
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(JSON.parse(rawBody || "{}"));
  } catch {
    return err("validation", 400);
  }

  const sig = req.headers.get("x-heartbeat-sig");
  if (!verifyHeartbeatSig(deviceToken, rawBody, sig)) {
    return err("invalid_signature", 401);
  }

  const linked = await getDeviceWithUser(deviceToken);
  if (!linked) return err("unauthorized", 401);

  const db = getDb();
  await db
    .update(devices)
    .set({
      runningServers: parsed.runningServers,
      appVersion: parsed.appVersion ?? linked.device.appVersion,
      os: parsed.os ?? linked.device.os,
      lastSeenAt: new Date(),
    })
    .where(eq(devices.id, linked.device.id));

  const sessionUser = {
    id: linked.user.id,
    email: linked.user.email,
    role: linked.user.role as "user" | "tester" | "creator",
  };
  const ent = await resolveEntitlements(sessionUser);

  return json({ ok: true, entitlements: ent });
});
