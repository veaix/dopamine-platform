import type { NextResponse } from "next/server";
import { err } from "@/lib/api";
import { getSessionUser, type SessionUser } from "@/lib/auth";

export type CreatorAuth =
  | { ok: true; user: SessionUser }
  | { ok: false; response: NextResponse };

export async function requireCreator(): Promise<CreatorAuth> {
  const user = await getSessionUser();
  if (!user) return { ok: false, response: err("unauthorized", 401) };
  if (user.role !== "creator") return { ok: false, response: err("forbidden", 403) };
  return { ok: true, user };
}
