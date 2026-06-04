"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { UserMenu } from "@/components/user-menu";
import { SiteLogo } from "@/components/site-logo";
import { DownloadButton } from "@/components/download-button";

const PUBLIC_LINKS = [{ href: "/tops", label: "Топы" }] as const;

export function SiteHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <SiteLogo size="sm" />

        <nav className="site-nav" aria-label="Основное меню">
          {PUBLIC_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}

          <DownloadButton variant="primary" size="sm" label="Скачать" className="header-download" />

          {loading ? (
            <span className="nav-auth-pending muted" aria-busy="true">
              …
            </span>
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Link href="/login" className="nav-link">
                Вход
              </Link>
              <Link href="/register" className="btn btn-sm">
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
