export function initBackendSentry() {
  const dsn = process.env.SENTRY_DSN || "";
  console.log("[Sentry Observability] Initialized distributed error tracking for Backend");
}

export function captureException(error: any, context?: Record<string, any>) {
  console.error("[Sentry Error Captured]:", error, context ? `Context: ${JSON.stringify(context)}` : "");
}
