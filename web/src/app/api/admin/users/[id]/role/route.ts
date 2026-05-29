import { eq } from "drizzle-orm";
import { z } from "zod";
import { err, json, withSchemaParams } from "@/lib/api";
import { requireCreator } from "@/lib/admin";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  role: z.enum(["user", "tester", "creator"]),
});

export const PATCH = withSchemaParams<{ id: string }>(async (req, ctx) => {
  const auth = await requireCreator();
  if (!auth.ok) return auth.response;
  const actor = auth.user;
  const { id } = await ctx.params;
  const body = bodySchema.parse(await req.json());
  const db = getDb();
  await db.update(users).set({ role: body.role }).where(eq(users.id, id));
  await writeAudit("admin.user.role", actor.id, { targetId: id, role: body.role });
  return json({ ok: true });
});
