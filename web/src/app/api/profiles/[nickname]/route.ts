import { getCurrentUser } from "@/server/auth/session";
import { getPublicProfile } from "@/server/profile/public";
import { json, err } from "@/lib/api";

type Params = { params: Promise<{ nickname: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { nickname } = await params;
  const viewer = await getCurrentUser();

  const profile = await getPublicProfile(nickname, viewer);
  if (!profile) return err("Профиль не найден", 404);

  return json({ profile });
}
