import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";

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
      </body>
    </html>
  );
}
