import * as Sentry from "@sentry/nextjs";

export function initStorefrontSentry() {
  //if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return; // Don't initialize if no DSN

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    //tracesSampleRate: 0.1,
    //debug: true, // Enable debug mode for development
  });

  // Add breadcrumbs for Next.js events
  Sentry.addBreadcrumb({
    category: "router",
    message: `Page loaded: ${window.location.pathname}`,
    level: "info",
  });
}

export function captureFrontendException(error: any, context?: Record<string, unknown>) {
  // Add context data if provided
  if (context) {
    for (const [key, value] of Object.entries(context)) {
      Sentry.setTag(key, String(value));
    }
  }

  Sentry.captureException(error);

  console.error("[Sentry Web App Error Captured]:", error);
}
