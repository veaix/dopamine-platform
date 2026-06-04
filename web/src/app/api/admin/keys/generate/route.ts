import { randomBytes } from "node:crypto";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
function makeKey(prefix?: string) {
  const part = randomBytes(3).toString("hex").toUpperCase();
  const part2 = randomBytes(3).toString("hex").toUpperCase();
  const base = `DOP-${part}-${part2}`;
  return prefix ? `${prefix.toUpperCase()}-${base}` : base;
}

export async function POST(request: Request) {
  const { admin, error } = await requireAdminApi("keys");
  if (error) return error;

  const body = (await request.json().catch(() => null)) as {
    count?: number;
    grantServers?: number;
    grantCoins?: number;
    maxUses?: number;
    expiresInDays?: number | string | null;
    prefix?: string;
    isActive?: boolean;
  } | null;

  const count = Math.min(Math.max(Number(body?.count ?? 1), 1), 200);
  const grantServers = Math.min(Math.max(Number(body?.grantServers ?? 0), 0), 100);
  const grantCoins = Math.min(Math.max(Number(body?.grantCoins ?? 0), 0), 1_000_000);
  const maxUses = Math.min(Math.max(Number(body?.maxUses ?? 1), 1), 10_000);
  const prefix = typeof body?.prefix === "string" ? body.prefix.trim().slice(0, 12) : undefined;
  const isActive = body?.isActive !== false;

  if (grantServers === 0 && grantCoins === 0) {
    return err("Укажите grantServers или grantCoins больше 0", 400);
  }

  let expiresAt: Date | null = null;
  const expiresRaw = body?.expiresInDays;
  if (expiresRaw != null && String(expiresRaw).trim() !== "") {
    const d = Number(expiresRaw);
    if (d > 0) {
      expiresAt = new Date(Date.now() + d * 24 * 60 * 60 * 1000);
    }
  }

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = makeKey(prefix);
    codes.push(code);
    await db.insert(schema.activationKeys).values({
      id: newId(),
      code,
      grantServers,
      grantCoins,
      maxUses,
      expiresAt,
      isActive,
      createdByUserId: admin!.id,
    });
  }

  await logAdminAction({
    admin: admin!,
    action: "keys.generate",
    targetType: "keys",
    details: { count, grantServers, grantCoins, maxUses, codes: codes.slice(0, 5) },
    request,
  });

  return json({
    ok: true,
    codes,
    options: { count, grantServers, grantCoins, maxUses, expiresAt, isActive },
  });
}
