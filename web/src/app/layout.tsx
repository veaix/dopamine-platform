import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export const metadata: Metadata = {
  title: "dopamine — Minecraft-лаунчер",
  description:
    "Современный Minecraft-лаунчер: профили, Modrinth, локальные серверы, облачный аккаунт и статистика.",
  openGraph: {
    title: "dopamine — Minecraft-лаунчер",
    description: "Скачайте лаунчер, создайте аккаунт, поднимайте серверы.",
    url: "https://dopamine.cfd",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" data-theme="dark" suppressHydrationWarning>
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main className="site-main">{children}</main>
          <SiteFooter />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
