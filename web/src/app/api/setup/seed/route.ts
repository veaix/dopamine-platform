import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { err, json, withSchema } from "@/lib/api";
import { hashPassword } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import { ensureUserEntitlement, getAppSetting, setAppSetting } from "@/lib/entitlements";

/** One-time creator bootstrap on Vercel (only if no users). Header: x-setup-secret */
export const POST = withSchema(async (req) => {
  const secret = process.env.SETUP_SECRET;
  if (!secret || req.headers.get("x-setup-secret") !== secret) {
    return err("forbidden", 403);
  }

  const db = getDb();
  const email = process.env.CREATOR_EMAIL;
  const password = process.env.CREATOR_PASSWORD;
  if (!email || !password) return err("missing_creator_env", 500);

  const normalized = email.toLowerCase();
  const byEmail = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

  if (byEmail[0]) {
    await db.update(users).set({ role: "creator" }).where(eq(users.email, normalized));
    await ensureUserEntitlement(byEmail[0].id);
    if ((await getAppSetting("servers_gated", "")) === "") {
      await setAppSetting("servers_gated", "true");
    }
    return json({ ok: true, promoted: true, email: normalized });
  }

  const existing = await db.select().from(users).limit(1);
  if (existing[0]) return json({ ok: true, skipped: true });

  const id = nanoid();
  await db.insert(users).values({
    id,
    email: normalized,
    passwordHash: await hashPassword(password),
    role: "creator",
  });
  await ensureUserEntitlement(id);
  if ((await getAppSetting("servers_gated", "")) === "") {
    await setAppSetting("servers_gated", "true");
  }

  return json({ ok: true, created: true, email: normalized });
});
