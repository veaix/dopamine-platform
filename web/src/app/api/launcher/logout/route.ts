import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hashToken } from "@/server/utils/crypto";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const bearer = request.headers.get("authorization");
  const token = bearer?.startsWith("Bearer ") ? bearer.slice("Bearer ".length) : null;
  if (!token) return err("Unauthorized", 401);

  await db.delete(schema.devices).where(eq(schema.devices.tokenHash, hashToken(token)));
  return json({ ok: true });
}
