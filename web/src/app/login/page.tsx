import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { requireGuest } from "@/lib/auth-guard";

type Props = {
  searchParams: Promise<{ next?: string; password?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  await requireGuest();
  const { next, password } = await searchParams;

  return (
    <PageShell
      narrow
      decor="login"
      tag="Вход"
      title="Аккаунт dopamine"
      subtitle="Email и пароль — те же, что в лаунчере."
    >
      {password === "reset" ? (
        <p className="info site-page-banner">Пароль изменён. Войдите с новым паролем.</p>
      ) : null}
      <AuthForm mode="login" nextPath={next ?? null} />
    </PageShell>
  );
}
