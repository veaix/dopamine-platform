import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";

const PACKS = {
  small: { amountMinor: 99_00, coins: 120 },
  medium: { amountMinor: 299_00, coins: 400 },
} as const;

type PackKey = keyof typeof PACKS;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Требуется вход" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { pack?: PackKey; provider?: string } | null;
  const pack = body?.pack;
  if (!pack || !PACKS[pack]) return NextResponse.json({ error: "Неизвестный пакет" }, { status: 400 });

  const id = newId();
  const config = PACKS[pack];

  await db.insert(schema.paymentIntents).values({
    id,
    userId: user.id,
    provider: body?.provider ?? "future",
    amountMinor: config.amountMinor,
    coinsToGrant: config.coins,
    status: "created",
  });

  return NextResponse.json({
    ok: true,
    intentId: id,
    note: "Платежные провайдеры будут подключены позже. Схема уже готова.",
  });
}
