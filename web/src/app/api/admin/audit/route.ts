import { desc } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { json } from "@/lib/api";

export async function GET(request: Request) {
  const { error } = await requireAdminApi("audit");
  if (error) return error;

  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") ?? 100), 500);

  const rows = await db
    .select()
    .from(schema.adminAuditLog)
    .orderBy(desc(schema.adminAuditLog.createdAt))
    .limit(limit);

  return json({
    entries: rows.map((r) => ({
      id: r.id,
      adminNickname: r.adminNickname,
      action: r.action,
      targetType: r.targetType,
      targetId: r.targetId,
      details: JSON.parse(r.detailsJson || "{}") as Record<string, unknown>,
      ipAddress: r.ipAddress,
      createdAt: r.createdAt,
    })),
  });
}
