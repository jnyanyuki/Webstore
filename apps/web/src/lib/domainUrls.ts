/**
 * Multi-domain URL helper for JuroMart
 * - Storefront: https://www.juromart.com
 * - Merchant Center: https://seller.juromart.com
 * - Backend API: https://api.juromart.com
 */

export function getStorefrontUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
      const port = window.location.port ? `:${window.location.port}` : ":3004";
      return `http://localhost${port}${cleanPath}`;
    }
  }
  return `https://www.juromart.com${cleanPath}`;
}

export function getSellerUrl(path: string = "/"): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost")) {
      const port = window.location.port ? `:${window.location.port}` : ":3004";
      return `http://seller.localhost${port}${cleanPath}`;
    }
  }
  return `https://seller.juromart.com${cleanPath}`;
}
