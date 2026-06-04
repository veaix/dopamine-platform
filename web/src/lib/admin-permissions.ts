import type { users } from "@/server/db/schema";

export const ADMIN_PERMISSIONS = [
  "stats",
  "audit",
  "email",
  "payments",
  "moderation",
  "devices",
  "fraud",
  "keys",
  "promo",
  "users",
  "roles",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  stats: "Статистика",
  audit: "Журнал действий",
  email: "Рассылка email",
  payments: "Ручные начисления",
  moderation: "Модерация профилей",
  devices: "Устройства лаунчера",
  fraud: "Антифрод",
  keys: "Ключи",
  promo: "Промокоды",
  users: "Пользователи",
  roles: "Роли и права",
};

const DEFAULT_ADMIN: AdminPermission[] = [
  "stats",
  "audit",
  "email",
  "payments",
  "moderation",
  "devices",
  "fraud",
  "keys",
  "promo",
  "users",
];

type UserRow = typeof users.$inferSelect;

export function isCreator(user: UserRow) {
  return user.role === "creator";
}

export function parsePermissions(user: UserRow): AdminPermission[] {
  if (user.role === "creator") return [...ADMIN_PERMISSIONS];
  if (user.role !== "admin") return [];
  if (!user.adminPermissionsJson) return DEFAULT_ADMIN;
  try {
    const parsed = JSON.parse(user.adminPermissionsJson) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_ADMIN;
    return parsed.filter((p): p is AdminPermission =>
      ADMIN_PERMISSIONS.includes(p as AdminPermission),
    );
  } catch {
    return DEFAULT_ADMIN;
  }
}

export function hasPermission(user: UserRow, permission: AdminPermission) {
  return parsePermissions(user).includes(permission);
}

export function permissionsPayload(user: UserRow) {
  return {
    role: user.role,
    isCreator: isCreator(user),
    permissions: parsePermissions(user),
  };
}
