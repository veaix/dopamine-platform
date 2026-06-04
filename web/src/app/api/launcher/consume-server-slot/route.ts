import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/server/db";
import { getUserByDeviceToken } from "@/server/auth/device";
import { getTrialServerInfoForUser } from "@/server/trial-server";

export async function POST(request: Request) {
  const user = await getUserByDeviceToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const trial = await getTrialServerInfoForUser(user);

  if (user.availableServerSlots >= 1) {
    const rows = await db
      .update(schema.users)
      .set({
        availableServerSlots: user.availableServerSlots - 1,
        totalServersCreated: user.totalServersCreated + 1,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.users.id, user.id), gt(schema.users.availableServerSlots, 0)))
      .returning({ id: schema.users.id });

    if (!rows.length) {
      return NextResponse.json({ error: "Нет доступных слотов" }, { status: 403 });
    }

    return NextResponse.json({ ok: true, consumed: "slot" as const });
  }

  if (!trial.enabled) {
    return NextResponse.json(
      { error: "Пробные серверы временно отключены администратором" },
      { status: 403 },
    );
  }

  if (!trial.canCreateTrialServer) {
    return NextResponse.json(
      {
        error: trial.trialServerUsed
          ? "Пробный сервер уже использован"
          : trial.windowActive
            ? "Нужен доступ к созданию сервера (ключ или покупка за монеты)"
            : "Пробный период создания сервера истёк (5 часов с первого входа)",
      },
      { status: 403 },
    );
  }

  const now = new Date();
  const marked = await db
    .update(schema.users)
    .set({
      trialServerUsedAt: now,
      totalServersCreated: user.totalServersCreated + 1,
      updatedAt: now,
    })
    .where(and(eq(schema.users.id, user.id), isNull(schema.users.trialServerUsedAt)))
    .returning({ id: schema.users.id });

  if (!marked.length) {
    return NextResponse.json({ error: "Пробный сервер уже использован" }, { status: 403 });
  }

  const refreshed = await db.query.users.findFirst({
    where: (u, { eq: eqFn }) => eqFn(u.id, user.id),
  });
  const trialAfter = await getTrialServerInfoForUser(refreshed ?? user);

  return NextResponse.json({
    ok: true,
    consumed: "trial" as const,
    trialExpiresAt: trialAfter.trialExpiresAt,
  });
}
