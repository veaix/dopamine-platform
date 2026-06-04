import { getCurrentUser } from "@/server/auth/session";
import {
  applyKeyToUser,
  assertUserOwnsAvailableKey,
} from "@/server/keys/inventory";
import { json, err } from "@/lib/api";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as { keyId?: string } | null;
  const keyId = body?.keyId?.trim();
  if (!keyId) return err("Укажите ключ", 400);

  const key = await assertUserOwnsAvailableKey(user.id, keyId);
  if (!key) return err("Ключ недоступен", 404);

  await applyKeyToUser(user, key);

  return json({
    ok: true,
    grantedServers: key.grantServers,
    grantedCoins: key.grantCoins,
  });
}
