import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { json, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdminApi("devices");
  if (error) return error;

  const { id } = await params;
  const devices = await db.query.devices.findMany({
    where: (d, { eq: eqFn }) => eqFn(d.userId, id),
  });

  return json({
    devices: devices.map((d) => ({
      id: d.id,
      label: d.label,
      createdAt: d.createdAt,
      lastSeenAt: d.lastSeenAt,
    })),
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const { admin, error } = await requireAdminApi("devices");
  if (error) return error;

  const { id } = await params;
  const user = await db.query.users.findFirst({ where: (u, { eq: eqFn }) => eqFn(u.id, id) });
  if (!user) return err("Not found", 404);

  const devices = await db.query.devices.findMany({
    where: (d, { eq: eqFn }) => eqFn(d.userId, id),
  });

  await db.delete(schema.devices).where(eq(schema.devices.userId, id));

  await logAdminAction({
    admin: admin!,
    action: "user.revoke_devices",
    targetType: "user",
    targetId: id,
    details: { count: devices.length, nickname: user.nickname },
    request,
  });

  return json({ ok: true, revoked: devices.length });
}
