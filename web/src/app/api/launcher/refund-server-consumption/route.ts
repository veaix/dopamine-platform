import { NextResponse } from "next/server";
import { getUserByDeviceToken } from "@/server/auth/device";
import {
  refundServerConsumption,
  type ConsumedKind,
} from "@/server/launcher/server-consumption";

export async function POST(request: Request) {
  const user = await getUserByDeviceToken(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { consumed?: ConsumedKind } | null;
  const consumed = body?.consumed;
  if (consumed !== "slot" && consumed !== "trial") {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const result = await refundServerConsumption(user.id, consumed);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "refund_failed" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
