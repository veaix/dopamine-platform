import { AdminClient } from "@/components/admin-client";
import { PageShell } from "@/components/page-shell";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminShell } from "@/server/admin/shell";

export default async function AdminPage() {
  const user = await requireAdmin();
  const initialShell = getAdminShell(user);

  return (
    <PageShell decor="admin" tag="Staff" title="Админ-панель" subtitle="Управление пользователями, ключами и настройками платформы.">
      <AdminClient initialShell={initialShell} />
    </PageShell>
  );
}
