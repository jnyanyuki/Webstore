"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlidingWindowRateLimiter = void 0;
// In-memory sliding window store (falls back gracefully if Redis is offline)
const requestLogs = new Map();
class SlidingWindowRateLimiter {
    constructor(maxRequests = 5, windowSizeSeconds = 60) {
        this.maxRequests = maxRequests;
        this.windowSizeSeconds = windowSizeSeconds;
    }
    /**
     * Check if client key (IP or Phone Number) is within rate limits
     */
    async checkRateLimit(clientKey) {
        const now = Date.now();
        const windowStart = now - this.windowSizeSeconds * 1000;
        let timestamps = requestLogs.get(clientKey) || [];
        // Filter timestamps within current sliding window
        timestamps = timestamps.filter((ts) => ts > windowStart);
        if (timestamps.length >= this.maxRequests) {
            const oldestTimestamp = timestamps[0];
            const resetSeconds = Math.ceil((oldestTimestamp + this.windowSizeSeconds * 1000 - now) / 1000);
            return {
                allowed: false,
                limit: this.maxRequests,
                remaining: 0,
                resetSeconds,
            };
        }
        timestamps.push(now);
        requestLogs.set(clientKey, timestamps);
        return {
            allowed: true,
            limit: this.maxRequests,
            remaining: this.maxRequests - timestamps.length,
            resetSeconds: this.windowSizeSeconds,
        };
    }
}
exports.SlidingWindowRateLimiter = SlidingWindowRateLimiter;
