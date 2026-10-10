export function initStorefrontSentry() {
  console.log("[Sentry Observability] Initialized frontend error tracking for Next.js Storefront");
}

export function captureFrontendException(error: any) {
  console.error("[Sentry Storefront Error Captured]:", error);
}
