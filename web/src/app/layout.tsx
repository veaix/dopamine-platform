import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "dopamine — портал аккаунта",
  description: "Аккаунты, ключи активации и статистика лаунчера dopamine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <SiteNav />
        <main className="container">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
