import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <AuthForm mode="register" />
        <p className="label" style={{ marginTop: "1rem", textAlign: "center" }}>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
