import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";

export async function GET() {
  const { error } = await requireAdminApi("promo");
  if (error) return error;

  const promos = await db.select().from(schema.promoCodes);
  const ownerIds = [...new Set(promos.map((p) => p.ownerUserId).filter(Boolean))] as string[];
  const owners =
    ownerIds.length > 0
      ? await db
          .select({ id: schema.users.id, nickname: schema.users.nickname })
          .from(schema.users)
          .where(inArray(schema.users.id, ownerIds))
      : [];
  const ownerMap = new Map(owners.map((o) => [o.id, o.nickname]));

  return json({
    promos: promos.map((p) => ({
      ...p,
      ownerNickname: p.ownerUserId ? ownerMap.get(p.ownerUserId) ?? null : null,
    })),
  });
}

export async function POST(request: Request) {
  const { admin, error } = await requireAdminApi("promo");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    code?: string;
    rewardCoins?: number;
    maxUses?: number;
    isActive?: boolean;
  } | null;

  const code = body?.code?.trim().toUpperCase();
  if (!code || code.length < 3) return err("Некорректный код", 400);

  const rewardCoins = Math.min(Math.max(Number(body?.rewardCoins ?? 0), 0), 1_000_000);
  const maxUses = Math.min(Math.max(Number(body?.maxUses ?? 1), 1), 1_000_000);

  await db.insert(schema.promoCodes).values({
    id: newId(),
    code,
    rewardCoins,
    maxUses,
    isActive: body?.isActive !== false,
    kind: "platform",
  });

  await logAdminAction({
    admin: admin!,
    action: "promo.create",
    targetType: "promo",
    targetId: code,
    details: { rewardCoins, maxUses },
    request,
  });

  return json({ ok: true, code });
}

export async function PATCH(request: Request) {
  const { admin, error } = await requireAdminApi("promo");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    id?: string;
    code?: string;
    rewardCoins?: number;
    maxUses?: number;
    isActive?: boolean;
    ownerUserId?: string | null;
    kind?: string;
  } | null;

  const id = body?.id;
  if (!id) return err("id обязателен", 400);

  const patch: Partial<typeof schema.promoCodes.$inferInsert> = {};
  if (typeof body?.code === "string") patch.code = body.code.trim().toUpperCase();
  if (typeof body?.rewardCoins === "number") patch.rewardCoins = body.rewardCoins;
  if (typeof body?.maxUses === "number") patch.maxUses = body.maxUses;
  if (typeof body?.isActive === "boolean") patch.isActive = body.isActive;
  if (body?.ownerUserId === null) patch.ownerUserId = null;
  if (typeof body?.ownerUserId === "string") patch.ownerUserId = body.ownerUserId;
  if (typeof body?.kind === "string") patch.kind = body.kind;

  await db.update(schema.promoCodes).set(patch).where(eq(schema.promoCodes.id, id));

  await logAdminAction({
    admin: admin!,
    action: "promo.update",
    targetType: "promo",
    targetId: id,
    details: patch,
    request,
  });

  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const { admin, error } = await requireAdminApi("promo");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id;
  if (!id) return err("id обязателен", 400);

  await db.delete(schema.promoRedemptions).where(eq(schema.promoRedemptions.promoCodeId, id));
  await db.delete(schema.promoCodes).where(eq(schema.promoCodes.id, id));

  await logAdminAction({
    admin: admin!,
    action: "promo.delete",
    targetType: "promo",
    targetId: id,
    details: {},
    request,
  });

  return json({ ok: true });
}
