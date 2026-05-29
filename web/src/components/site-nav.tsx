import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

export async function SiteNav() {
  const user = await getSessionUser();
  return (
    <header className="nav container">
      <Link href="/">
        <strong>dopamine</strong>
      </Link>
      <nav className="nav-links">
        <Link href="/stats">Статистика</Link>
        {user ? (
          <>
            <Link href="/dashboard">Кабинет</Link>
            {user.role === "creator" && <Link href="/admin">Админ</Link>}
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login">Вход</Link>
            <Link href="/register" className="btn btn-primary">
              Регистрация
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
