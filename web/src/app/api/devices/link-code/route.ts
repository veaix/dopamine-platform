import { nanoid } from "nanoid";
import { err, json, withSchema } from "@/lib/api";
import { getSessionUser } from "@/lib/auth";
import { generateLinkCode } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { deviceLinkCodes } from "@/db/schema";

export const POST = withSchema(async () => {
  const user = await getSessionUser();
  if (!user) return err("unauthorized", 401);

  const code = generateLinkCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const db = getDb();
  await db.insert(deviceLinkCodes).values({
    id: nanoid(),
    userId: user.id,
    code,
    expiresAt,
  });

  return json({
    code,
    expiresAt: expiresAt.toISOString(),
    hint: "Enter this code in dopamine launcher → Settings → Account",
  });
});
