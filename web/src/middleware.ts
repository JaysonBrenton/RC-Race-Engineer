import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/login", "/api/health", "/api/ready", "/api/version"]);
const COOKIE_NAME = "rc-dev-auth";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME)?.value;
  const apiToken = request.headers.get("authorization");
  const expectedToken = process.env.DEV_API_TOKEN;

  if (pathname.startsWith("/api/")) {
    if (cookie === "granted") {
      return NextResponse.next();
    }
    if (expectedToken && apiToken === `Bearer ${expectedToken}`) {
      return NextResponse.next();
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (cookie === "granted") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  if (pathname && pathname !== "/") {
    url.searchParams.set("redirect", `${pathname}${search}`);
  }
  return NextResponse.redirect(url);
}

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }
  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname === "/favicon.ico") {
    return true;
  }
  return false;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
