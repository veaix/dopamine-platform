import { and, eq, gt, isNull, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { err, json, withSchema } from "@/lib/api";
import { getBearerToken, getDeviceToken, getSessionUser, verifyAccessToken } from "@/lib/auth";
import { hashActivationKey, normalizeActivationKey } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { activationKeys, keyRedemptions } from "@/db/schema";
import { applyGrants, getDeviceWithUser, resolveEntitlements, type Grants } from "@/lib/entitlements";
import type { SessionUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const bodySchema = z.object({
  code: z.string().min(4).max(64),
});

async function resolveUser(req: Request): Promise<SessionUser | null> {
  const session = await getSessionUser();
  if (session) return session;
  const bearer = getBearerToken(req);
  if (bearer) return verifyAccessToken(bearer);
  const deviceToken = getDeviceToken(req);
  if (deviceToken) {
    const linked = await getDeviceWithUser(deviceToken);
    if (linked) {
      return {
        id: linked.user.id,
        email: linked.user.email,
        role: linked.user.role as SessionUser["role"],
      };
    }
  }
  return null;
}

export const POST = withSchema(async (req) => {
  const user = await resolveUser(req);
  if (!user) return err("unauthorized", 401);

  const body = bodySchema.parse(await req.json());
  const codeHash = hashActivationKey(normalizeActivationKey(body.code));
  const db = getDb();

  const key = (
    await db
      .select()
      .from(activationKeys)
      .where(
        and(
          eq(activationKeys.codeHash, codeHash),
          isNull(activationKeys.revokedAt),
          gt(activationKeys.usesLeft, 0),
          or(isNull(activationKeys.expiresAt), gt(activationKeys.expiresAt, new Date())),
        ),
      )
      .limit(1)
  )[0];

  if (!key) return err("invalid_key", 400);

  const already = await db
    .select()
    .from(keyRedemptions)
    .where(and(eq(keyRedemptions.keyId, key.id), eq(keyRedemptions.userId, user.id)))
    .limit(1);
  if (already[0] && key.maxUses === 1) return err("already_redeemed", 409);

  let grants: Grants;
  try {
    grants = JSON.parse(key.grantsJson) as Grants;
  } catch {
    return err("invalid_key_grants", 500);
  }

  await applyGrants(user.id, grants, `key:${key.id}`);
  await db
    .update(activationKeys)
    .set({ usesLeft: key.usesLeft - 1 })
    .where(eq(activationKeys.id, key.id));
  await db.insert(keyRedemptions).values({
    id: nanoid(),
    keyId: key.id,
    userId: user.id,
  });

  await writeAudit("key.redeem", user.id, { keyId: key.id });
  const ent = await resolveEntitlements(user);
  return json({ ok: true, entitlements: ent });
});
