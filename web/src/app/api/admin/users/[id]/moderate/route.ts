import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { json, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { admin, error } = await requireAdminApi("moderation");
  if (error) return error;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    clearAvatar?: boolean;
    clearBio?: boolean;
    hiddenFromLeaderboards?: boolean;
  } | null;

  const user = await db.query.users.findFirst({ where: (u, { eq: eqFn }) => eqFn(u.id, id) });
  if (!user) return err("Not found", 404);

  const patch: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };
  const applied: string[] = [];

  if (body?.clearAvatar) {
    patch.avatarUrl = null;
    applied.push("clearAvatar");
  }
  if (body?.clearBio) {
    patch.bio = null;
    applied.push("clearBio");
  }
  if (typeof body?.hiddenFromLeaderboards === "boolean") {
    patch.hiddenFromLeaderboards = body.hiddenFromLeaderboards;
    applied.push(body.hiddenFromLeaderboards ? "hideFromTops" : "showInTops");
  }

  if (applied.length === 0) return err("Нечего применять", 400);

  await db.update(schema.users).set(patch).where(eq(schema.users.id, id));

  await logAdminAction({
    admin: admin!,
    action: "user.moderate",
    targetType: "user",
    targetId: id,
    details: { applied, nickname: user.nickname },
    request,
  });

  return json({ ok: true, applied });
}
