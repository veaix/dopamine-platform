import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { admin, error } = await requireAdminApi("payments");
  if (error) return error;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    amount?: number;
    comment?: string;
  } | null;

  const amount = Math.floor(Number(body?.amount ?? 0));
  const comment = body?.comment?.trim()?.slice(0, 500) ?? "";

  if (!amount || amount < -1_000_000 || amount > 1_000_000) {
    return err("Сумма от -1000000 до 1000000", 400);
  }

  const [user] = await db
    .select({ coinsBalance: schema.users.coinsBalance, nickname: schema.users.nickname })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .limit(1);
  if (!user) return err("Not found", 404);

  const nextBalance = Math.max(0, user.coinsBalance + amount);
  await db
    .update(schema.users)
    .set({ coinsBalance: nextBalance, updatedAt: new Date() })
    .where(eq(schema.users.id, id));

  await db.insert(schema.coinLedger).values({
    id: newId(),
    userId: id,
    amount,
    reason: "admin_grant",
    refType: "admin",
    refId: admin!.id,
  });

  await logAdminAction({
    admin: admin!,
    action: "user.grant_coins",
    targetType: "user",
    targetId: id,
    details: { amount, comment, newBalance: nextBalance, nickname: user.nickname },
    request,
  });

  return json({ ok: true, coinsBalance: nextBalance });
}
