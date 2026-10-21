/**
 * Multi-domain URL helper for JuroMart
 * - Storefront: https://www.juromart.com (Local: http://localhost:3004)
 * - Merchant Center: https://seller.juromart.com (Local: http://seller.localhost:3004)
 * - Backend API: https://api.juromart.com (Local: http://localhost:9000)
 *
 * Deterministic SSR + Client URLs prevent React hydration mismatches.
 */

const IS_DEV = process.env.NODE_ENV === "development";

const DEFAULT_STOREFRONT =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ||
  (IS_DEV ? "http://localhost:3004" : "https://www.juromart.com");

const DEFAULT_SELLER =
  process.env.NEXT_PUBLIC_SELLER_URL ||
  (IS_DEV ? "http://seller.localhost:3004" : "https://seller.juromart.com");

export function getStorefrontUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${DEFAULT_STOREFRONT}${cleanPath}`;
}

export function getSellerUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${DEFAULT_SELLER}${cleanPath}`;
}
