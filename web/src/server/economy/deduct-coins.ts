import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hasCreatorUnlimited } from "@/server/creator-unlimited";

export async function deductCoins(
  userId: string,
  amount: number,
): Promise<{ coinsBalance: number } | null> {
  if (amount <= 0) return null;

  const user = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, userId),
    columns: { id: true, role: true, coinsBalance: true },
  });
  if (!user) return null;
  if (await hasCreatorUnlimited(user)) {
    return { coinsBalance: user.coinsBalance };
  }

  const rows = await db
    .update(schema.users)
    .set({
      coinsBalance: sql`${schema.users.coinsBalance} - ${amount}`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.users.id, userId), gte(schema.users.coinsBalance, amount)))
    .returning({ coinsBalance: schema.users.coinsBalance });

  return rows[0] ?? null;
}
