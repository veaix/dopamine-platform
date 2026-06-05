import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { getCurrentUser } from "@/server/auth/session";
import { json, err } from "@/lib/api";
import { BIO_EDIT_COOLDOWN_MS, getDashboardUser } from "@/server/dashboard/profile";
import { loadDashboardUserRow } from "@/server/dashboard/load-user";
import { avatarVersionKey } from "@/lib/avatar-url";
import { validateAvatarDataUrl } from "@/server/security/avatar";
import { ensureTrialWindowStarted } from "@/server/trial-server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const row = await loadDashboardUserRow(user.id);
  if (!row) return err("Требуется вход", 401);

  await ensureTrialWindowStarted(user.id);
  return json({ user: await getDashboardUser(row) });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) return err("Требуется вход", 401);

  const body = (await request.json().catch(() => null)) as {
    bio?: string;
    social?: Record<string, string>;
    avatarUrl?: string | null;
  } | null;
  if (!body) return err("Неверные данные");

  const patch: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.bio === "string") {
    const editedAt = user.bioEditedAt?.getTime() ?? 0;
    if (Date.now() - editedAt < BIO_EDIT_COOLDOWN_MS) {
      const hoursLeft = Math.ceil((editedAt + BIO_EDIT_COOLDOWN_MS - Date.now()) / (60 * 60 * 1000));
      return err(`Описание можно менять раз в 24 часа. Подождите ~${hoursLeft} ч.`, 429);
    }
    patch.bio = body.bio.slice(0, 500);
    patch.bioEditedAt = new Date();
  }

  if (body.social && typeof body.social === "object") {
    patch.socialLinksJson = JSON.stringify(body.social);
  }

  if (body.avatarUrl === null) patch.avatarUrl = null;
  if (typeof body.avatarUrl === "string") {
    const valid = validateAvatarDataUrl(body.avatarUrl);
    if (!valid) return err("Допустимы только JPEG, PNG, WebP или GIF до ~200KB", 400);
    patch.avatarUrl = valid;
  }

  if (Object.keys(patch).length <= 1) return err("Нечего обновлять", 400);

  await db.update(schema.users).set(patch).where(eq(schema.users.id, user.id));

  if (body.avatarUrl !== undefined) {
    const row = await loadDashboardUserRow(user.id);
    const hasAvatar = row?.hasAvatar ?? false;
    return json({
      ok: true,
      hasAvatar,
      avatarVersion: row ? avatarVersionKey(hasAvatar, row.updatedAt) : undefined,
    });
  }

  return json({ ok: true });
}
