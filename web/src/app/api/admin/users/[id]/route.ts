import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db";
import { requireAdminApi } from "@/server/admin/guard";
import { setProfileReactionCounts } from "@/server/admin/reactions";
import { logAdminAction } from "@/server/admin/audit";
import { hashPassword } from "@/server/utils/crypto";
import { getProfileReactionCounts } from "@/lib/profile-stats";
import { isCreator, parsePermissions } from "@/lib/admin-permissions";
import { json, err } from "@/lib/api";
import {
  adminUserDetailJson,
  loadAdminUserDetail,
} from "@/server/admin/user-columns";
import { validateNickname } from "@/lib/nickname";
import { isNicknameTaken } from "@/server/auth/pending-registration";
import { revokeUserDevices } from "@/server/auth/device";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { error } = await requireAdminApi("users");
  if (error) return error;

  try {
    const { id } = await params;
    const user = await loadAdminUserDetail(id);
    if (!user) return err("Not found", 404);

    const [reactions, devices, logins] = await Promise.all([
      getProfileReactionCounts(user.id),
      db.query.devices.findMany({
        where: (d, { eq: eqFn }) => eqFn(d.userId, id),
        columns: { id: true, label: true, lastSeenAt: true },
      }),
      db.query.loginEvents.findMany({
        where: (l, { eq: eqFn }) => eqFn(l.userId, id),
        columns: { ipAddress: true, createdAt: true },
        limit: 20,
      }),
    ]);

    const { likes, dislikes } = reactions;

    return json({
      user: adminUserDetailJson(user),
      likes,
      dislikes,
      devices: devices.map((d) => ({
        id: d.id,
        label: d.label,
        lastSeenAt:
          d.lastSeenAt instanceof Date && !Number.isNaN(d.lastSeenAt.getTime())
            ? d.lastSeenAt.toISOString()
            : null,
      })),
      permissions: parsePermissions(user),
      loginEvents: logins.map((e) => ({
        ipAddress: e.ipAddress,
        createdAt:
          e.createdAt instanceof Date && !Number.isNaN(e.createdAt.getTime())
            ? e.createdAt.toISOString()
            : new Date(0).toISOString(),
      })),
    });
  } catch (e) {
    console.error("[admin/users/:id] GET failed:", e);
    return err("Не удалось загрузить профиль пользователя", 500);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { admin, error } = await requireAdminApi("users");
  if (error) return error;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return err("Bad request", 400);

  const existing = await db.query.users.findFirst({ where: (u, { eq: eqFn }) => eqFn(u.id, id) });
  if (!existing) return err("Not found", 404);

  const patch: Partial<typeof schema.users.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.nickname === "string") {
    const nickname = body.nickname.trim();
    const nickErr = validateNickname(nickname);
    if (nickErr) return err(nickErr, 400);
    if (await isNicknameTaken(nickname, { exceptUserId: id })) return err("Ник занят", 409);
    patch.nickname = nickname;
  }

  if (typeof body.email === "string") {
    const email = body.email.trim().toLowerCase();
    const clash = await db.query.users.findFirst({
      where: (u, { and: andFn, eq: eqFn, ne: neFn }) =>
        andFn(eqFn(u.email, email), neFn(u.id, id)),
    });
    if (clash) return err("Email занят", 409);
    patch.email = email;
  }

  if (typeof body.role === "string") {
    const permCheck = await requireAdminApi("roles");
    if (permCheck.error) return permCheck.error;
    if (!isCreator(admin!)) return err("Только creator назначает роли", 403);
    const role = body.role;
    if (!["user", "admin", "creator", "mediagigant"].includes(role)) return err("Недопустимая роль", 400);
    if (id === admin!.id && role !== admin!.role) return err("Нельзя сменить свою роль", 400);
    patch.role = role;
  }

  if (typeof body.bio === "string") patch.bio = body.bio.slice(0, 500);
  if (typeof body.coinsBalance === "number") patch.coinsBalance = Math.max(0, Math.floor(body.coinsBalance));
  if (typeof body.availableServerSlots === "number") {
    patch.availableServerSlots = Math.max(0, Math.floor(body.availableServerSlots));
  }
  if (typeof body.playtimeSeconds === "number") {
    patch.playtimeSeconds = Math.max(0, Math.floor(body.playtimeSeconds));
  }
  if (typeof body.totalServersCreated === "number") {
    patch.totalServersCreated = Math.max(0, Math.floor(body.totalServersCreated));
  }
  if (typeof body.isBlocked === "boolean") patch.isBlocked = body.isBlocked;
  if (typeof body.hiddenFromLeaderboards === "boolean") {
    patch.hiddenFromLeaderboards = body.hiddenFromLeaderboards;
  }
  if (typeof body.totpEnabled === "boolean") {
    patch.totpEnabled = body.totpEnabled;
    if (!body.totpEnabled) patch.totpSecret = null;
  }
  if (body.emailVerified === true) patch.emailVerifiedAt = existing.emailVerifiedAt ?? new Date();
  if (body.emailVerified === false) patch.emailVerifiedAt = null;

  if (typeof body.newPassword === "string" && body.newPassword.length >= 8) {
    patch.passwordHash = await hashPassword(body.newPassword);
    await revokeUserDevices(id);
  }

  if (Object.keys(patch).length > 1) {
    await db.update(schema.users).set(patch).where(eq(schema.users.id, id));
    await logAdminAction({
      admin: admin!,
      action: "user.update",
      targetType: "user",
      targetId: id,
      details: { fields: Object.keys(patch).filter((k) => k !== "updatedAt"), nickname: existing.nickname },
      request,
    });
  }

  if (typeof body.likes === "number" || typeof body.dislikes === "number") {
    const current = await getProfileReactionCounts(id);
    await setProfileReactionCounts(
      id,
      typeof body.likes === "number" ? body.likes : current.likes,
      typeof body.dislikes === "number" ? body.dislikes : current.dislikes,
    );
  }

  const user = await loadAdminUserDetail(id);
  const reactions = await getProfileReactionCounts(id);
  return json({
    ok: true,
    user: user ? adminUserDetailJson(user) : null,
    likes: reactions.likes,
    dislikes: reactions.dislikes,
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const { admin, error } = await requireAdminApi("users");
  if (error) return error;

  const { id } = await params;
  if (id === admin!.id) return err("Нельзя удалить себя", 400);

  const existing = await db.query.users.findFirst({ where: (u, { eq: eqFn }) => eqFn(u.id, id) });

  await db.delete(schema.profileReactions).where(eq(schema.profileReactions.targetUserId, id));
  await db.delete(schema.profileReactions).where(eq(schema.profileReactions.actorUserId, id));
  await db.delete(schema.profileViews).where(eq(schema.profileViews.targetUserId, id));
  await db.delete(schema.profileViews).where(eq(schema.profileViews.viewerUserId, id));
  await db.delete(schema.friendRequests).where(eq(schema.friendRequests.fromUserId, id));
  await db.delete(schema.friendRequests).where(eq(schema.friendRequests.toUserId, id));
  await db.delete(schema.devices).where(eq(schema.devices.userId, id));
  await db.delete(schema.users).where(eq(schema.users.id, id));

  await logAdminAction({
    admin: admin!,
    action: "user.delete",
    targetType: "user",
    targetId: id,
    details: { nickname: existing?.nickname },
    request,
  });

  return json({ ok: true });
}
