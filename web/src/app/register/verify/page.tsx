"use client";

import { AuthForm } from "@/components/auth-form";
import { PageShell } from "@/components/page-shell";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerifyInner() {
  const sp = useSearchParams();
  const email = sp.get("email") ?? "";

  return (
    <>
      <p className="site-page-banner muted">
        Код отправлен на <strong>{email || "ваш email"}</strong>
      </p>
      <AuthForm mode="verify" initialEmail={email} />
    </>
  );
}

export default function VerifyPage() {
  return (
    <PageShell narrow decor="verify" tag="Email" title="Подтверждение" subtitle="Введи 6-значный код из письма.">
      <Suspense fallback={<p className="muted">Загрузка…</p>}>
        <VerifyInner />
      </Suspense>
    </PageShell>
  );
}
