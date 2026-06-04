import { eq, inArray } from "drizzle-orm";
import { db, schema } from "@/server/db";

export type FriendEntry = {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
};

export type FriendRequestEntry = {
  requestId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
};

export type KeyGiftEntry = {
  giftId: string;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  grantServers: number;
  grantCoins: number;
};

export type FriendsData = {
  friends: FriendEntry[];
  incoming: FriendRequestEntry[];
  outgoing: FriendRequestEntry[];
  incomingGifts: KeyGiftEntry[];
  outgoingGifts: KeyGiftEntry[];
};

export async function getFriendsBundle(userId: string): Promise<FriendsData> {
  const accepted = await db.query.friendRequests.findMany({
    where: (fr, { and: andFn, eq: eqFn, or: orFn }) =>
      andFn(
        eqFn(fr.status, "accepted"),
        orFn(eqFn(fr.fromUserId, userId), eqFn(fr.toUserId, userId)),
      ),
    columns: { fromUserId: true, toUserId: true },
  });

  const friendIds = accepted.map((r) => (r.fromUserId === userId ? r.toUserId : r.fromUserId));

  const [friendsRows, incomingRows, outgoingRows, incomingGiftRows, outgoingGiftRows] =
    await Promise.all([
      friendIds.length
        ? db
            .select({
              userId: schema.users.id,
              nickname: schema.users.nickname,
              avatarUrl: schema.users.avatarUrl,
            })
            .from(schema.users)
            .where(inArray(schema.users.id, friendIds))
        : Promise.resolve([]),
      db.query.friendRequests.findMany({
        where: (fr, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(fr.toUserId, userId), eqFn(fr.status, "pending")),
        columns: { id: true, fromUserId: true },
      }),
      db.query.friendRequests.findMany({
        where: (fr, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(fr.fromUserId, userId), eqFn(fr.status, "pending")),
        columns: { id: true, toUserId: true },
      }),
      db.query.friendKeyGifts.findMany({
        where: (g, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(g.toUserId, userId), eqFn(g.status, "pending")),
      }),
      db.query.friendKeyGifts.findMany({
        where: (g, { and: andFn, eq: eqFn }) =>
          andFn(eqFn(g.fromUserId, userId), eqFn(g.status, "pending")),
      }),
    ]);

  const userIds = new Set<string>();
  for (const r of incomingRows) userIds.add(r.fromUserId);
  for (const r of outgoingRows) userIds.add(r.toUserId);
  for (const g of incomingGiftRows) userIds.add(g.fromUserId);
  for (const g of outgoingGiftRows) userIds.add(g.toUserId);

  const users =
    userIds.size > 0
      ? await db
          .select({
            id: schema.users.id,
            nickname: schema.users.nickname,
            avatarUrl: schema.users.avatarUrl,
          })
          .from(schema.users)
          .where(inArray(schema.users.id, [...userIds]))
      : [];

  const userById = new Map(users.map((u) => [u.id, u]));

  const giftKeyIds = [...incomingGiftRows, ...outgoingGiftRows].map((g) => g.activationKeyId);
  const giftKeys =
    giftKeyIds.length > 0
      ? await db
          .select({
            id: schema.activationKeys.id,
            grantServers: schema.activationKeys.grantServers,
            grantCoins: schema.activationKeys.grantCoins,
          })
          .from(schema.activationKeys)
          .where(inArray(schema.activationKeys.id, giftKeyIds))
      : [];
  const keyById = new Map(giftKeys.map((k) => [k.id, k]));

  const incoming: FriendRequestEntry[] = incomingRows
    .map((r) => {
      const u = userById.get(r.fromUserId);
      if (!u) return null;
      return { requestId: r.id, userId: u.id, nickname: u.nickname, avatarUrl: u.avatarUrl };
    })
    .filter(Boolean) as FriendRequestEntry[];

  const outgoing: FriendRequestEntry[] = outgoingRows
    .map((r) => {
      const u = userById.get(r.toUserId);
      if (!u) return null;
      return { requestId: r.id, userId: u.id, nickname: u.nickname, avatarUrl: u.avatarUrl };
    })
    .filter(Boolean) as FriendRequestEntry[];

  function mapGift(
    g: (typeof incomingGiftRows)[number],
    otherUserId: string,
  ): KeyGiftEntry | null {
    const u = userById.get(otherUserId);
    const key = keyById.get(g.activationKeyId);
    if (!u || !key) return null;
    return {
      giftId: g.id,
      userId: u.id,
      nickname: u.nickname,
      avatarUrl: u.avatarUrl,
      grantServers: key.grantServers,
      grantCoins: key.grantCoins,
    };
  }

  const incomingGifts = incomingGiftRows
    .map((g) => mapGift(g, g.fromUserId))
    .filter(Boolean) as KeyGiftEntry[];

  const outgoingGifts = outgoingGiftRows
    .map((g) => mapGift(g, g.toUserId))
    .filter(Boolean) as KeyGiftEntry[];

  return {
    friends: friendsRows as FriendEntry[],
    incoming,
    outgoing,
    incomingGifts,
    outgoingGifts,
  };
}
