import { avatarResponse, loadUserAvatar } from "@/server/avatars/serve";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const avatarUrl = await loadUserAvatar(id);
  if (!avatarUrl) return new Response(null, { status: 404 });
  return avatarResponse(avatarUrl);
}
