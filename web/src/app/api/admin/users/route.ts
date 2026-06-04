import { requireAdminApi } from "@/server/admin/guard";
import { adminUserListJson, searchAdminUsers } from "@/server/admin/user-columns";
import { err, json } from "@/lib/api";

export async function GET(request: Request) {
  const { error } = await requireAdminApi("users");
  if (error) return error;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  try {
    const rows = await searchAdminUsers(q);
    return json({ users: rows.map(adminUserListJson) });
  } catch (e) {
    console.error("[admin/users] GET failed:", e);
    return err("Не удалось загрузить список пользователей", 500);
  }
}
