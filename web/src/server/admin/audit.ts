import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";
import type { users } from "@/server/db/schema";

type AdminUser = typeof users.$inferSelect;

export async function logAdminAction(params: {
  admin: AdminUser;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  request?: Request;
}) {
  const ip =
    params.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    params.request?.headers.get("x-real-ip") ??
    null;

  await db.insert(schema.adminAuditLog).values({
    id: newId(),
    adminUserId: params.admin.id,
    adminNickname: params.admin.nickname,
    action: params.action,
    targetType: params.targetType ?? null,
    targetId: params.targetId ?? null,
    detailsJson: JSON.stringify(params.details ?? {}),
    ipAddress: ip,
  });
}
