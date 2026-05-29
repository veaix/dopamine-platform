import { eq } from "drizzle-orm";
import { z } from "zod";
import { err, json, withSchema } from "@/lib/api";
import { createRefreshSession, setSessionCookies, signAccessToken, type SessionUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = withSchema(async (req) => {
  const body = bodySchema.parse(await req.json());
  const db = getDb();
  const row = (await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1))[0];
  if (!row || !(await verifyPassword(body.password, row.passwordHash))) {
    return err("invalid_credentials", 401);
  }
  if (row.bannedAt) return err("banned", 403);

  const sessionUser: SessionUser = {
    id: row.id,
    email: row.email,
    role: row.role as SessionUser["role"],
  };
  const access = await signAccessToken(sessionUser);
  const refresh = await createRefreshSession(row.id);
  await setSessionCookies(access, refresh);
  await writeAudit("user.login", row.id);

  return json({ ok: true, user: sessionUser });
});
