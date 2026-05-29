import { eq } from "drizzle-orm";
import { err, json, withSchemaParams } from "@/lib/api";
import { requireCreator } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";

export const POST = withSchemaParams<{ id: string }>(async (_req, ctx) => {
  const auth = await requireCreator();
  if (!auth.ok) return auth.response;
  const actor = auth.user;
  const { id } = await ctx.params;
  if (id === actor.id) return err("cannot_ban_self", 400);
  const db = getDb();
  await db.update(users).set({ bannedAt: new Date() }).where(eq(users.id, id));
  await writeAudit("admin.user.ban", actor.id, { targetId: id });
  return json({ ok: true });
});
