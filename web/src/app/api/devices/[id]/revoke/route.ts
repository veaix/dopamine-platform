import { and, eq } from "drizzle-orm";
import { err, json, withSchemaParams } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { devices } from "@/db/schema";
import { writeAudit } from "@/lib/audit";

export const POST = withSchemaParams<{ id: string }>(async (_req, ctx) => {
  const user = await getSessionUser();
  if (!user) return err("unauthorized", 401);
  const { id } = await ctx.params;
  const db = getDb();
  const existing = await db
    .select({ id: devices.id })
    .from(devices)
    .where(and(eq(devices.id, id), eq(devices.userId, user.id)))
    .limit(1);
  if (!existing[0]) return err("not_found", 404);
  await db.update(devices).set({ revokedAt: new Date() }).where(eq(devices.id, id));
  await writeAudit("device.revoke", user.id, { deviceId: id });
  return json({ ok: true });
});
