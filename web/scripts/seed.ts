import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "../.env.local") });

async function main() {
  const { ensureSchema, getDb } = await import("../src/lib/db");
  const { users } = await import("../src/db/schema");
  const { hashPassword } = await import("../src/lib/crypto");
  const { nanoid } = await import("nanoid");
  const { getAppSetting, setAppSetting, ensureUserEntitlement } = await import("../src/lib/entitlements");

  await ensureSchema();
  const db = getDb();

  const existing = await db.select().from(users).limit(1);
  const email = process.env.CREATOR_EMAIL || "creator@dopamine.local";
  const password = process.env.CREATOR_PASSWORD || "ChangeMeNow123!";

  if (!existing[0]) {
    const id = nanoid();
    await db.insert(users).values({
      id,
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      role: "creator",
    });
    await ensureUserEntitlement(id);
    console.log(`Created creator: ${email} / ${password}`);
  } else {
    console.log("Users already exist, skip creator seed");
  }

  const gated = await getAppSetting("servers_gated", "");
  if (gated === "") {
    await setAppSetting("servers_gated", "true");
  }

  console.log("Seed complete. servers_gated =", await getAppSetting("servers_gated", "true"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
