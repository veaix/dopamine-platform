import Link from "next/link";
import { SiteLogo } from "@/components/site-logo";
import { SocialLinks } from "@/components/social-links";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <SiteLogo size="sm" href="/" />
          <p className="muted">© {new Date().getFullYear()} dopamine · Minecraft launcher</p>
        </div>
        <nav className="site-footer-nav" aria-label="Навигация">
          <Link href="/download">Скачать</Link>
          <Link href="/launcher-minecraft">Лаунчер</Link>
          <Link href="/minecraft-server">Сервер</Link>
          <Link href="/tops">Топы</Link>
          <Link href="/register">Регистрация</Link>
          <Link href="/login">Вход</Link>
        </nav>
        <SocialLinks showLabels={false} className="site-footer-social" />
      </div>
    </footer>
  );
}
