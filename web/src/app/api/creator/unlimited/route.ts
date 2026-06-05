import { requireCreatorApi } from "@/server/admin/guard";
import { logAdminAction } from "@/server/admin/audit";
import { isCreatorUnlimitedSettingEnabled } from "@/server/creator-unlimited";
import { updateCreatorUnlimitedEnabled } from "@/server/security/platform-settings";
import { json, err } from "@/lib/api";

export async function GET() {
  const { error } = await requireCreatorApi();
  if (error) return error;

  const enabled = await isCreatorUnlimitedSettingEnabled();
  return json({ ok: true, enabled });
}

export async function PATCH(request: Request) {
  const { user, error } = await requireCreatorApi();
  if (error) return error;

  const body = (await request.json().catch(() => null)) as { enabled?: boolean } | null;
  if (typeof body?.enabled !== "boolean") return err("Укажите enabled: true/false", 400);

  const updated = await updateCreatorUnlimitedEnabled(body.enabled);

  await logAdminAction({
    admin: user!,
    action: "creator.unlimited_toggle",
    targetType: "platform_settings",
    targetId: "default",
    details: { enabled: updated.creatorUnlimitedEnabled },
    request,
  });

  return json({ ok: true, enabled: updated.creatorUnlimitedEnabled });
}
