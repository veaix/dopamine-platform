import { and, eq, gt, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hasCreatorUnlimited } from "@/server/creator-unlimited";

export type ConsumedKind = "slot" | "trial";

export async function refundServerConsumption(
  userId: string,
  consumed: ConsumedKind,
): Promise<{ ok: boolean; error?: string }> {
  const user = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, userId),
    columns: { id: true, role: true },
  });
  if (user && (await hasCreatorUnlimited(user))) {
    return { ok: true };
  }
  if (consumed === "slot") {
    const rows = await db
      .update(schema.users)
      .set({
        availableServerSlots: sql`${schema.users.availableServerSlots} + 1`,
        totalServersCreated: sql`max(0, ${schema.users.totalServersCreated} - 1)`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.users.id, userId), gt(schema.users.totalServersCreated, 0)))
      .returning({ id: schema.users.id });

    if (!rows.length) return { ok: false, error: "nothing_to_refund" };
    return { ok: true };
  }

  const rows = await db
    .update(schema.users)
    .set({
      trialServerUsedAt: null,
      totalServersCreated: sql`CASE WHEN ${schema.users.totalServersCreated} > 0 THEN ${schema.users.totalServersCreated} - 1 ELSE 0 END`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.users.id, userId), isNotNull(schema.users.trialServerUsedAt)))
    .returning({ id: schema.users.id });

  if (!rows.length) return { ok: false, error: "nothing_to_refund" };
  return { ok: true };
}
