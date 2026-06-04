import { and, eq, inArray, desc } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { newId } from "@/server/utils/ids";
import { maskGiftKeyCode } from "@/server/keys/codes";

export type OwnedGiftKey = {
  id: string;
  codePreview: string;
  grantServers: number;
  grantCoins: number;
  createdAt: Date;
  giftStatus: "available" | "pending_gift";
  pendingGiftId: string | null;
};

export async function getOwnedGiftKeys(userId: string): Promise<OwnedGiftKey[]> {
  const keys = await db
    .select()
    .from(schema.activationKeys)
    .where(
      and(
        eq(schema.activationKeys.ownerUserId, userId),
        eq(schema.activationKeys.isActive, true),
        eq(schema.activationKeys.usesCount, 0),
      ),
    )
    .orderBy(desc(schema.activationKeys.createdAt));

  if (!keys.length) return [];

  const keyIds = keys.map((k) => k.id);
  const pendingGifts = await db.query.friendKeyGifts.findMany({
    where: (g, { and: andFn, eq: eqFn, inArray: inArrayFn }) =>
      andFn(inArrayFn(g.activationKeyId, keyIds), eqFn(g.status, "pending")),
  });
  const pendingByKey = new Map(pendingGifts.map((g) => [g.activationKeyId, g.id]));

  return keys.map((k) => {
    const pendingGiftId = pendingByKey.get(k.id) ?? null;
    return {
      id: k.id,
      codePreview: maskGiftKeyCode(k.code),
      grantServers: k.grantServers,
      grantCoins: k.grantCoins,
      createdAt: k.createdAt,
      giftStatus: pendingGiftId ? "pending_gift" : "available",
      pendingGiftId,
    };
  });
}

export async function isKeyLockedForGift(activationKeyId: string) {
  const pending = await db.query.friendKeyGifts.findFirst({
    where: (g, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(g.activationKeyId, activationKeyId), eqFn(g.status, "pending")),
  });
  return Boolean(pending);
}

export async function assertUserOwnsAvailableKey(userId: string, keyId: string) {
  const key = await db.query.activationKeys.findFirst({
    where: (k, { and: andFn, eq: eqFn }) =>
      andFn(eqFn(k.id, keyId), eqFn(k.ownerUserId, userId), eqFn(k.isActive, true)),
  });
  if (!key || key.usesCount >= key.maxUses) return null;
  if (await isKeyLockedForGift(key.id)) return null;
  return key;
}

export async function areFriends(userId: string, otherUserId: string) {
  const row = await db.query.friendRequests.findFirst({
    where: (fr, { and: andFn, eq: eqFn, or: orFn }) =>
      andFn(
        eqFn(fr.status, "accepted"),
        orFn(
          andFn(eqFn(fr.fromUserId, userId), eqFn(fr.toUserId, otherUserId)),
          andFn(eqFn(fr.fromUserId, otherUserId), eqFn(fr.toUserId, userId)),
        ),
      ),
  });
  return Boolean(row);
}

export async function applyKeyToUser(
  user: { id: string; availableServerSlots: number; coinsBalance: number },
  key: { id: string; grantServers: number; grantCoins: number; usesCount: number },
) {
  await db.insert(schema.keyRedemptions).values({
    id: newId(),
    userId: user.id,
    activationKeyId: key.id,
  });
  await db
    .update(schema.activationKeys)
    .set({
      usesCount: key.usesCount + 1,
      ownerUserId: null,
    })
    .where(eq(schema.activationKeys.id, key.id));
  await db
    .update(schema.users)
    .set({
      availableServerSlots: user.availableServerSlots + key.grantServers,
      coinsBalance: user.coinsBalance + key.grantCoins,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));
}
