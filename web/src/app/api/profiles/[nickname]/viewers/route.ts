import { getPublicProfileCore } from "@/server/profile/public";
import { getRecentProfileViewers } from "@/server/profile/views";
import { getCurrentUser } from "@/server/auth/session";
import { json, err } from "@/lib/api";

type Params = { params: Promise<{ nickname: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { nickname } = await params;
  const viewer = await getCurrentUser();
  const core = await getPublicProfileCore(nickname, viewer);
  if (!core) return err("Профиль не найден", 404);

  const viewers = await getRecentProfileViewers(core.targetUserId);
  return json({ viewers });
}
