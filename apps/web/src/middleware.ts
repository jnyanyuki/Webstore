import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/account", "/checkout", "/dashboard", "/seller"];
const AUTH_ROUTES = ["/login", "/register"];

function isSafeRedirect(urlStr: string): boolean {
  if (urlStr.startsWith("/") && !urlStr.startsWith("//")) return true;
  try {
    const parsed = new URL(urlStr);
    return (
      parsed.hostname === "seller.juromart.com" ||
      parsed.hostname === "juromart.com" ||
      parsed.hostname.endsWith(".juromart.com") ||
      parsed.hostname === "seller.localhost" ||
      parsed.hostname === "localhost"
    );
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const rawHost =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.host ||
    "";
  const host = rawHost.split(",")[0].trim().replace(/:\d+$/, "").toLowerCase();
  const isSellerDomain =
    host === "seller.juromart.com" ||
    host === "seller.localhost" ||
    host.startsWith("seller.");

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const sessionHint = request.cookies.get("jm_session")?.value;
  const isAuthenticated = Boolean(accessToken || refreshToken || sessionHint);

  // 1. Exclusive Domain Enforcement:
  // If accessing /seller from main storefront (juromart.com / www.juromart.com),
  // permanently redirect to https://seller.juromart.com
  if (!isSellerDomain && (pathname === "/seller" || pathname.startsWith("/seller/"))) {
    if (host === "juromart.com" || host === "www.juromart.com") {
      const sellerPath = pathname.replace(/^\/seller/, "") || "/";
      const targetUrl = new URL(sellerPath, "https://seller.juromart.com");
      targetUrl.search = search;
      return NextResponse.redirect(targetUrl, 308);
    }
  }

  // 2. Handling requests on the seller subdomain (seller.juromart.com / seller.localhost)
  if (isSellerDomain) {
    // Require authentication for the entire seller portal
    if (!isAuthenticated) {
      const loginBase =
        host === "seller.juromart.com"
          ? "https://www.juromart.com"
          : `${request.nextUrl.protocol}//${host.replace(/^seller\./, "")}:${request.nextUrl.port || "3004"}`;
      const returnUrl = `${request.nextUrl.protocol}//${rawHost}${pathname}${search}`;
      const loginUrl = new URL("/login", loginBase);
      loginUrl.searchParams.set("redirect", returnUrl);
      return NextResponse.redirect(loginUrl);
    }

    // Clean URL: /seller on seller.juromart.com redirects to /
    if (pathname === "/seller" || pathname === "/seller/") {
      return NextResponse.redirect(new URL(`/${search}`, request.url));
    }

    // Internal rewrite: root / on seller domain serves the /seller page
    if (pathname === "/") {
      const response = NextResponse.rewrite(new URL(`/seller${search}`, request.url));
      response.headers.set("x-workspace-zone", "seller-center");
      return response;
    }
  }

  // 3. Protect storefront private route groups
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    const redirectTarget = `${pathname}${search}`;
    loginUrl.searchParams.set("redirect", redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Redirect authenticated users away from /login and /register
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    const requested = request.nextUrl.searchParams.get("redirect") || "";
    const redirectUrl = isSafeRedirect(requested) ? requested : "/account";
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // 5. Attach workspace zone header
  const response = NextResponse.next();
  if (isSellerDomain || pathname.startsWith("/seller")) {
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
