import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName } from "@/server/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
  return NextResponse.json({ ok: true });
}
