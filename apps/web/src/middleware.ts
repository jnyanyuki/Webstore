import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/account", "/checkout", "/dashboard", "/seller"];
const AUTH_ROUTES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const sessionHint = request.cookies.get("jm_session")?.value;
  // Presence check only - the API validates tokens on every protected request
  const isAuthenticated = Boolean(accessToken || refreshToken || sessionHint);

  // 1. Protect private route groups
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const redirectTarget = `${pathname}${search}`;
    loginUrl.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from /login and /register
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    const requested = request.nextUrl.searchParams.get("redirect") || "";
    // Only same-site relative paths are allowed (prevents open redirects like ?redirect=https://evil.com)
    const redirectUrl =
      requested.startsWith("/") && !requested.startsWith("//") ? requested : "/account";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 3. Attach workspace zone header
  const response = NextResponse.next();
  if (pathname.startsWith("/seller")) {
    response.headers.set("x-workspace-zone", "seller-center");
  } else {
    response.headers.set("x-workspace-zone", "storefront");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml).*)",
  ],
};
