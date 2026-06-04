import type { Metadata } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthSessionLoader } from "@/components/auth-session-loader";
import { baseMetadata } from "@/lib/seo";

const fontBody = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

const fontDisplay = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = baseMetadata();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${fontBody.variable} ${fontDisplay.variable}`}>
      <body className="shell">
        <AuthProvider initialUser={null}>
          <AuthSessionLoader />
          <SiteHeader />
          <div className="shell-main">{children}</div>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
