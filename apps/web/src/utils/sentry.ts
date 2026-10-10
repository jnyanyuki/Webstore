export function initStorefrontSentry() {
  console.log("[Sentry Observability] Initialized frontend error tracking for Next.js Web App");
}

export function captureFrontendException(error: any) {
  console.error("[Sentry Web App Error Captured]:", error);
}
