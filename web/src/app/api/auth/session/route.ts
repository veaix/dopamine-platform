import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authCookieName, getCurrentUser } from "@/server/auth/session";
import { toSessionUser } from "@/lib/session-user";

export async function GET() {
  const cookieStore = await cookies();
  const hadToken = Boolean(cookieStore.get(authCookieName)?.value);
  const user = await getCurrentUser();

  if (!user && hadToken) {
    cookieStore.delete(authCookieName);
  }

  if (!user) {
    return NextResponse.json({ user: null }, { headers: { "Cache-Control": "private, no-store" } });
  }

  return NextResponse.json(
    { user: toSessionUser(user) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
