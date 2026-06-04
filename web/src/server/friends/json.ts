import { json } from "@/lib/api";
import { getFriendsBundle } from "./bundle";

export async function jsonWithFriends(userId: string, extra?: Record<string, unknown>) {
  const friends = await getFriendsBundle(userId);
  return json({ ok: true, friends, ...extra });
}
