import { getUserByDeviceToken } from "@/server/auth/device";
import { ensureTrialWindowStarted, getTrialServerSyncInfo } from "@/server/trial-server";
import { json, err } from "@/lib/api";

/** Launcher polls this to purge expired trial servers using authoritative server time. */
export async function GET(request: Request) {
  const user = await getUserByDeviceToken(request);
  if (!user) return err("Unauthorized", 401);

  await ensureTrialWindowStarted(user.id);

  const refreshed = await getUserByDeviceToken(request);
  const subject = refreshed ?? user;

  return json({
    ok: true,
    ...getTrialServerSyncInfo(subject),
  });
}
