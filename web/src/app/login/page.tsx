import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card card">
        <AuthForm mode="login" />
        <p className="label" style={{ marginTop: "1rem", textAlign: "center" }}>
          Нет аккаунта? <Link href="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}
