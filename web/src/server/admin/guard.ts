import { getCurrentUser } from "@/server/auth/session";
import { isAdmin } from "@/lib/admin";
import { hasPermission, type AdminPermission } from "@/lib/admin-permissions";
import { err } from "@/lib/api";

export async function requireAdminApi(permission?: AdminPermission) {
  const admin = await getCurrentUser();
  if (!admin || !isAdmin(admin)) return { admin: null, error: err("Forbidden", 403) };
  if (permission && !hasPermission(admin, permission)) {
    return { admin: null, error: err("Недостаточно прав", 403) };
  }
  return { admin, error: null };
}
