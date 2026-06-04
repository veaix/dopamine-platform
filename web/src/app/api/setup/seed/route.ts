import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { hashPassword } from "@/server/utils/crypto";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { isProductionSetupBlocked } from "@/server/security/setup-guard";

export async function POST(request: Request) {
  if (isProductionSetupBlocked()) return err("Not found", 404);
  const secret = request.headers.get("x-setup-secret");
  if (!secret || secret !== process.env.SETUP_SECRET) return err("Forbidden", 403);

  const email = (process.env.CREATOR_EMAIL ?? "creator@dopamine.local").toLowerCase();
  const password = process.env.CREATOR_PASSWORD ?? "ChangeMeNow123!";

  const existing = await db.query.users.findFirst({
    where: (users, { eq: eqFn }) => eqFn(users.email, email),
  });

  if (!existing) {
    await db.insert(schema.users).values({
      id: newId(),
      nickname: "creator",
      email,
      passwordHash: await hashPassword(password),
      role: "creator",
      emailVerifiedAt: new Date(),
    });
  }

  await db
    .insert(schema.promoCodes)
    .values({ id: newId(), code: "WELCOME5", rewardCoins: 5, maxUses: 999_999 })
    .onConflictDoNothing();

  return json({ ok: true, email });
}
