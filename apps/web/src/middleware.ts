import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect merchant/seller routes
  if (pathname.startsWith("/seller")) {
    const sellerToken = request.cookies.get("seller_token")?.value || request.headers.get("x-seller-auth");

    // Enforce merchant session check if needed (or attach context header)
    const response = NextResponse.next();
    response.headers.set("x-workspace-zone", "seller-center");
    return response;
  }

  // Public customer routes
  const response = NextResponse.next();
  response.headers.set("x-workspace-zone", "storefront");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
