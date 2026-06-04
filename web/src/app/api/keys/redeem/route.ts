import { and, eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { getUserByDeviceToken } from "@/server/auth/device";
import { newId } from "@/server/utils/ids";
import { json, err } from "@/lib/api";
import { clientIp } from "@/server/admin/client-ip";
import { checkRateLimit, enforceRateLimit } from "@/server/security/rate-limit";

const REDEEM_IP_LIMIT = 20;
const REDEEM_USER_LIMIT = 10;
const REDEEM_WINDOW_MS = 60 * 1000;

async function resolveUser(request: Request) {
  const sessionUser = await getCurrentUser();
  if (sessionUser) return sessionUser;
  return getUserByDeviceToken(request);
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const ipRate = await enforceRateLimit("keys:redeem", ip, REDEEM_IP_LIMIT, REDEEM_WINDOW_MS);
  if (!ipRate.ok) return err(ipRate.message, 429);

  const user = await resolveUser(request);
  if (!user) return err("Требуется вход", 401);
  if (user.isBlocked) return err("Аккаунт заблокирован", 403);

  const userRate = await checkRateLimit(`keys:redeem:user:${user.id}`, REDEEM_USER_LIMIT, REDEEM_WINDOW_MS);
  if (!userRate.ok) return err(userRate.message, 429);

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code?.trim().toUpperCase();
  if (!code) return err("Укажите ключ", 400);

  const key = await db.query.activationKeys.findFirst({
    where: (k, { and: andFn, eq: eqFn }) => andFn(eqFn(k.code, code), eqFn(k.isActive, true)),
  });
  if (!key) return err("Ключ не найден", 404);
  if (key.usesCount >= key.maxUses) return err("Ключ уже использован", 409);
  if (key.expiresAt && key.expiresAt < new Date()) return err("Ключ истёк", 410);

  const { isKeyLockedForGift } = await import("@/server/keys/inventory");
  if (await isKeyLockedForGift(key.id)) return err("Ключ в процессе дарения другу", 409);
  if (key.ownerUserId === user.id) {
    return err("Этот ключ нужно передать другому — активируйте чужой ключ или подарите другу", 400);
  }

  const already = await db.query.keyRedemptions.findFirst({
    where: (kr, { and: andFn }) => andFn(eq(kr.userId, user.id), eq(kr.activationKeyId, key.id)),
  });
  if (already && key.maxUses <= 1) return err("Вы уже активировали этот ключ", 409);

  const [updatedKey] = await db
    .update(schema.activationKeys)
    .set({ usesCount: key.usesCount + 1, ownerUserId: null })
    .where(and(eq(schema.activationKeys.id, key.id), eq(schema.activationKeys.usesCount, key.usesCount)))
    .returning();
  if (!updatedKey) return err("Ключ уже использован", 409);

  await db.insert(schema.keyRedemptions).values({ id: newId(), userId: user.id, activationKeyId: key.id });
  await db
    .update(schema.users)
    .set({
      availableServerSlots: user.availableServerSlots + key.grantServers,
      coinsBalance: user.coinsBalance + key.grantCoins,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  return json({
    ok: true,
    grantedServers: key.grantServers,
    grantedCoins: key.grantCoins,
  });
}
