import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import {
  ADMIN_PERMISSIONS,
  isCreator,
  type AdminPermission,
} from "@/lib/admin-permissions";
import { json, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { admin, error } = await requireAdminApi("roles");
  if (error) return error;

  if (!isCreator(admin!)) return err("Только creator может менять права", 403);

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    permissions?: string[];
    role?: string;
  } | null;

  const target = await db.query.users.findFirst({ where: (u, { eq: eqFn }) => eqFn(u.id, id) });
  if (!target) return err("Not found", 404);
  if (target.role === "creator" && id !== admin!.id) {
    return err("Нельзя менять другого creator", 400);
  }

  const patch: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };

  if (typeof body?.role === "string") {
    if (!["user", "admin", "mediagigant"].includes(body.role)) return err("Роль user, admin или mediagigant", 400);
    if (id === admin!.id) return err("Нельзя понизить себя", 400);
    patch.role = body.role;
    if (body.role === "admin" && !body.permissions) {
      patch.adminPermissionsJson = JSON.stringify([
        "stats",
        "audit",
        "email",
        "payments",
        "moderation",
        "devices",
        "fraud",
        "keys",
        "promo",
        "users",
      ]);
    }
    if (body.role === "user" || body.role === "mediagigant") patch.adminPermissionsJson = null;
  }

  if (Array.isArray(body?.permissions)) {
    if (target.role !== "admin" && patch.role !== "admin") {
      return err("Права только для роли admin", 400);
    }
    const perms = body.permissions.filter((p): p is AdminPermission =>
      ADMIN_PERMISSIONS.includes(p as AdminPermission),
    );
    patch.adminPermissionsJson = JSON.stringify(perms);
  }

  await db.update(schema.users).set(patch).where(eq(schema.users.id, id));

  await logAdminAction({
    admin: admin!,
    action: "user.permissions",
    targetType: "user",
    targetId: id,
    details: { role: patch.role, permissions: body?.permissions, nickname: target.nickname },
    request,
  });

  return json({ ok: true });
}
