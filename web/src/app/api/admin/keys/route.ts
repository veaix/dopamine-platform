import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { json, err } from "@/lib/api";

export async function GET(request: Request) {
  const { error } = await requireAdminApi("keys");
  if (error) return error;

  const url = new URL(request.url);
  const filter = url.searchParams.get("filter") ?? "all";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);

  const rows = await db
    .select({
      id: schema.activationKeys.id,
      code: schema.activationKeys.code,
      grantServers: schema.activationKeys.grantServers,
      grantCoins: schema.activationKeys.grantCoins,
      maxUses: schema.activationKeys.maxUses,
      usesCount: schema.activationKeys.usesCount,
      isActive: schema.activationKeys.isActive,
      expiresAt: schema.activationKeys.expiresAt,
      createdAt: schema.activationKeys.createdAt,
    })
    .from(schema.activationKeys)
    .limit(limit);
  const keyIds = rows.map((k) => k.id);

  const redemptions =
    keyIds.length > 0
      ? await db
          .select({ activationKeyId: schema.keyRedemptions.activationKeyId })
          .from(schema.keyRedemptions)
          .where(inArray(schema.keyRedemptions.activationKeyId, keyIds))
      : [];

  const redemptionCount = new Map<string, number>();
  for (const r of redemptions) {
    redemptionCount.set(r.activationKeyId, (redemptionCount.get(r.activationKeyId) ?? 0) + 1);
  }

  const now = new Date();
  const withMeta = rows.map((k) => {
    const unused = k.usesCount < k.maxUses;
    const expired = k.expiresAt ? k.expiresAt < now : false;
    return {
      id: k.id,
      code: k.code,
      grantServers: k.grantServers,
      grantCoins: k.grantCoins,
      maxUses: k.maxUses,
      usesCount: k.usesCount,
      isActive: k.isActive,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      redemptionCount: redemptionCount.get(k.id) ?? 0,
      status: !k.isActive
        ? "inactive"
        : expired
          ? "expired"
          : unused
            ? "unused"
            : "depleted",
    };
  });

  const filtered = withMeta.filter((k) => {
    if (filter === "unused") return k.status === "unused";
    if (filter === "used") return k.usesCount > 0;
    if (filter === "expired") return k.status === "expired" || k.status === "inactive";
    return true;
  });

  return json({ keys: filtered });
}

export async function DELETE(request: Request) {
  const { admin, error } = await requireAdminApi("keys");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    ids?: string[];
    codes?: string[];
  } | null;

  const ids = body?.ids ?? [];
  const codes = body?.codes ?? [];
  if (ids.length === 0 && codes.length === 0) return err("Укажите ids или codes", 400);

  let deleted = 0;

  if (ids.length > 0) {
    await db.delete(schema.keyRedemptions).where(inArray(schema.keyRedemptions.activationKeyId, ids));
    await db.delete(schema.activationKeys).where(inArray(schema.activationKeys.id, ids));
    deleted += ids.length;
  }

  for (const code of codes) {
    const key = await db.query.activationKeys.findFirst({
      where: (k, { eq: eqFn }) => eqFn(k.code, code.trim().toUpperCase()),
    });
    if (!key) continue;
    await db.delete(schema.keyRedemptions).where(eq(schema.keyRedemptions.activationKeyId, key.id));
    await db.delete(schema.activationKeys).where(eq(schema.activationKeys.id, key.id));
    deleted++;
  }

  await logAdminAction({
    admin: admin!,
    action: "keys.delete",
    targetType: "keys",
    details: { deleted, ids: ids.length, codes: codes.length },
    request,
  });

  return json({ ok: true, deleted });
}
