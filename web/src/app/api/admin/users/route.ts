import { like, or } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { json } from "@/lib/api";
export async function GET(request: Request) {
  const { error } = await requireAdminApi("users");
  if (error) return error;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const rows = q
    ? await db
        .select()
        .from(schema.users)
        .where(
          or(
            like(schema.users.nickname, `%${q}%`),
            like(schema.users.email, `%${q}%`),
            like(schema.users.lastLoginIp, `%${q}%`),
          ),
        )
        .limit(100)
    : await db.select().from(schema.users).limit(100);

  return json({
    users: rows.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      email: u.email,
      role: u.role,
      coinsBalance: u.coinsBalance,
      availableServerSlots: u.availableServerSlots,
      playtimeSeconds: u.playtimeSeconds,
      isBlocked: u.isBlocked,
      lastLoginAt: u.lastLoginAt,
      lastLoginIp: u.lastLoginIp,
      createdAt: u.createdAt,
    })),
  });
}
