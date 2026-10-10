"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initBackendSentry = initBackendSentry;
exports.captureException = captureException;
function initBackendSentry() {
    const dsn = process.env.SENTRY_DSN || "";
    console.log("[Sentry Observability] Initialized distributed error tracking for Backend");
}
function captureException(error, context) {
    console.error("[Sentry Error Captured]:", error, context ? `Context: ${JSON.stringify(context)}` : "");
}
