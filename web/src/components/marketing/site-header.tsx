import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/marketing/theme-toggle";

const releases =
  process.env.NEXT_PUBLIC_GITHUB_RELEASES ||
  "https://github.com/veaix/dopamine-MinecraftLauncher/releases/latest";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-logo">
          <span className="site-logo__mark">D</span>
          dopamine
        </Link>

        <nav className="site-nav">
          <a href="/#features">Возможности</a>
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
          <a className="btn btn-primary" href={releases} target="_blank" rel="noreferrer">
            Скачать
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
