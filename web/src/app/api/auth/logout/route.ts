import { cookies } from "next/headers";
import { json, withSchema } from "@/lib/api";
import { clearSessionCookies, revokeRefreshToken } from "@/lib/auth";

export const POST = withSchema(async () => {
  const jar = await cookies();
  const refresh = jar.get("dopamine_refresh")?.value;
  if (refresh) await revokeRefreshToken(refresh);
  await clearSessionCookies();
  return json({ ok: true });
});
