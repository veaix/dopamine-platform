import { err, json, withSchema } from "@/lib/api";
import { getBearerToken, getDeviceToken, getSessionUser, verifyAccessToken } from "@/lib/auth";
import { getDeviceWithUser, resolveEntitlements } from "@/lib/entitlements";
import type { SessionUser } from "@/lib/auth";

async function resolveUser(req: Request): Promise<SessionUser | null> {
  const session = await getSessionUser();
  if (session) return session;

  const bearer = getBearerToken(req);
  if (bearer) {
    const u = await verifyAccessToken(bearer);
    if (u) return u;
  }

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

export const GET = withSchema(async (req) => {
  const user = await resolveUser(req);
  if (!user) return err("unauthorized", 401);
  const ent = await resolveEntitlements(user);
  return json({ entitlements: ent });
});
