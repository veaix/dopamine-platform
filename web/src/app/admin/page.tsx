import { AdminClient } from "@/components/admin-client";
import { PageShell } from "@/components/page-shell";
import { requireAdmin } from "@/lib/auth-guard";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <PageShell decor="admin" tag="Staff" title="Админ-панель" subtitle="Управление пользователями, ключами и настройками платформы.">
      <AdminClient />
    </PageShell>
  );
}
