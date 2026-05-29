import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { err, json, withSchema } from "@/lib/api";
import { createRefreshSession, setSessionCookies, signAccessToken } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { ensureUserEntitlement } from "@/lib/entitlements";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
});

export const POST = withSchema(async (req) => {
  const body = bodySchema.parse(await req.json());
  const db = getDb();
  const existing = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);
  if (existing[0]) return err("email_taken", 409);

  const user = {
    id: nanoid(),
    email: body.email.toLowerCase(),
    passwordHash: await hashPassword(body.password),
    role: "user" as const,
  };
  await db.insert(users).values(user);
  await ensureUserEntitlement(user.id);
  await writeAudit("user.register", user.id);

  const sessionUser = { id: user.id, email: user.email, role: user.role };
  const access = await signAccessToken(sessionUser);
  const refresh = await createRefreshSession(user.id);
  await setSessionCookies(access, refresh);

  return json({ ok: true, user: sessionUser });
});
