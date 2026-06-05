import { avatarNotFoundResponse, avatarResponse, loadUserAvatarMeta } from "@/server/avatars/serve";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const meta = await loadUserAvatarMeta(id);
  if (!meta) return avatarNotFoundResponse();
  return avatarResponse(meta.avatarUrl, meta.cacheTag);
}
