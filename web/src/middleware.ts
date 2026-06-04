import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "dopamine_access";

const AUTH_REQUIRED_PREFIXES = ["/dashboard", "/admin"];

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") ?? request.nextUrl.hostname).split(":")[0];

  if (host === "dopamine.cfd") {
    const url = request.nextUrl.clone();
    url.hostname = "www.dopamine.cfd";
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  const { pathname } = request.nextUrl;

  if (pathname === "/downloads/dopamine-Setup.exe") {
    return NextResponse.redirect(new URL("/api/download/windows", request.url), 302);
  }

  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (!hasSession && AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|yandex_.*\\.html|google.*\\.html|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
