"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const rate_limiter_1 = require("../../../../services/rate-limiter");
const rateLimiter = new rate_limiter_1.SlidingWindowRateLimiter(5, 60); // 5 requests per 60s window
// This is the Medusa API Route for initiating an STK Push
// POST /api/payments/mpesa/stk-push
async function POST(req, res) {
    const mpesaService = req.scope.resolve("mpesaService");
    const body = req.body;
    try {
        // 0. Rate limiting protection
        const clientKey = body.phoneNumber || req.ip || "unknown";
        const rateLimit = await rateLimiter.checkRateLimit(clientKey);
        if (!rateLimit.allowed) {
            return res.status(429).json({
                error: "Too many payment requests. Please wait before trying again.",
                resetSeconds: rateLimit.resetSeconds,
            });
        }
        // 1. Validate inputs (ensure Nairobi +254 format)
        if (!body.phoneNumber.startsWith("254")) {
            return res.status(400).json({ error: "Invalid phone format. Must start with 254" });
        }
        // 2. Trigger STK Push via Daraja Service
        const stkResponse = await mpesaService.initiateStkPush({
            phoneNumber: body.phoneNumber,
            amount: body.amount,
            accountReference: body.accountReference,
            transactionDesc: body.transactionDesc,
        });
        return res.status(200).json({ success: true, data: stkResponse });
    }
    catch (error) {
        console.error("STK Push Error:", error);
        return res.status(500).json({ error: "Failed to initiate M-Pesa transaction." });
    }
}
