import { getCurrentUser } from "@/server/auth/session";
import { getFriendsBundle } from "@/server/friends/bundle";
import { json, err } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);
  return json(await getFriendsBundle(user.id));
}
