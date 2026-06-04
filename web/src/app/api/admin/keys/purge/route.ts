import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const { admin, error } = await requireAdminApi("keys");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    unusedOlderThanDays?: number;
    deleteExpired?: boolean;
    deleteInactive?: boolean;
    deleteDepleted?: boolean;
  } | null;

  const days = Number(body?.unusedOlderThanDays ?? 0);
  const deleteExpired = Boolean(body?.deleteExpired);
  const deleteInactive = Boolean(body?.deleteInactive);
  const deleteDepleted = Boolean(body?.deleteDepleted);

  if (days <= 0 && !deleteExpired && !deleteInactive && !deleteDepleted) {
    return err("Выберите хотя бы одно условие удаления", 400);
  }

  const allKeys = await db.select().from(schema.activationKeys);
  const now = new Date();
  const cutoff = days > 0 ? new Date(now.getTime() - days * 24 * 60 * 60 * 1000) : null;

  const toDelete: string[] = [];

  for (const k of allKeys) {
    const unused = k.usesCount === 0;
    const expired = k.expiresAt ? k.expiresAt < now : false;
    const depleted = k.usesCount >= k.maxUses;

    if (deleteInactive && !k.isActive) toDelete.push(k.id);
    if (deleteExpired && expired) toDelete.push(k.id);
    if (deleteDepleted && depleted) toDelete.push(k.id);
    if (cutoff && unused && k.createdAt < cutoff) toDelete.push(k.id);
  }

  const uniqueIds = [...new Set(toDelete)];
  for (const id of uniqueIds) {
    await db.delete(schema.keyRedemptions).where(eq(schema.keyRedemptions.activationKeyId, id));
    await db.delete(schema.activationKeys).where(eq(schema.activationKeys.id, id));
  }

  await logAdminAction({
    admin: admin!,
    action: "keys.purge",
    targetType: "keys",
    details: { deleted: uniqueIds.length, days, deleteExpired, deleteInactive, deleteDepleted },
    request,
  });

  return json({ ok: true, deleted: uniqueIds.length });
}
