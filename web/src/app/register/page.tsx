import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { RegisterRefCapture } from "@/components/register-ref-capture";
import { requireGuest } from "@/lib/auth-guard";

export default async function RegisterPage() {
  await requireGuest();

  return (
    <PageShell
      narrow
      decor="register"
      tag="Регистрация"
      title="Создай аккаунт"
      subtitle="Один профиль для сайта и лаунчера. Аккаунт создаётся после подтверждения email."
    >
      <Suspense fallback={null}>
        <RegisterRefCapture />
      </Suspense>
      <AuthForm mode="register" />
    </PageShell>
  );
}
