import { PasswordResetForm } from "@/components/password-reset-form";
import { PageShell } from "@/components/page-shell";
import { requireGuest } from "@/lib/auth-guard";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  await requireGuest();
  const { email } = await searchParams;

  return (
    <PageShell
      narrow
      decor="password"
      tag="Безопасность"
      title="Сброс пароля"
      subtitle="Пришлём код на email. Если включена 2FA — понадобится код из приложения."
    >
      <PasswordResetForm initialEmail={email ?? ""} />
    </PageShell>
  );
}
