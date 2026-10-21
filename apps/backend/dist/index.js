"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const navigation_1 = require("./services/navigation");
const auth_1 = __importDefault(require("./routes/auth"));
const app = (0, express_1.default)();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 9000;
const allowedOriginsEnv = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
const defaultAllowedOrigins = [
    "https://juromart.com",
    "https://www.juromart.com",
    "http://juromart.com",
    "http://www.juromart.com",
    "https://api.juromart.com",
    "https://seller.juromart.com",
    "http://localhost:3000",
    "http://localhost:3004",
];
const allowedOriginsList = Array.from(new Set([...defaultAllowedOrigins, ...allowedOriginsEnv]));
// 1. CORS Configuration for cross-domain Vercel frontend to Render backend
const isOriginAllowed = (origin) => {
    if (!origin)
        return true; // Server-to-server, curl, mobile native
    if (allowedOriginsList.includes(origin))
        return true;
    if (/^https?:\/\/([a-z0-9-]+\.)*juromart\.com(:\d+)?$/i.test(origin))
        return true;
    if (/^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin))
        return true;
    if (/^http:\/\/([a-z0-9-]+\.)*localhost(:\d+)?$/i.test(origin))
        return true;
    return false;
};
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "x-seller-auth",
        "X-CSRF-Token",
        "Accept",
        "Cache-Control",
    ],
    exposedHeaders: ["Content-Range", "X-Total-Count", "X-CSRF-Token"],
    maxAge: 86400, // 24 hours preflight cache to eliminate redundant OPTIONS latency
}));
// 2. OWASP Cross-Site Request Forgery (CSRF) Origin Verification Middleware
// Protects mutating endpoints against unauthorized third-party cross-site submissions
const csrfOriginGuard = (req, res, next) => {
    const mutatingMethods = ["POST", "PUT", "DELETE", "PATCH"];
    if (!mutatingMethods.includes(req.method)) {
        return next();
    }
    // Exempt public webhooks with external signatures (e.g., M-Pesa IPN, Daraja STK callback)
    if (req.path.includes("/webhook") || req.path.includes("/callback")) {
        return next();
    }
    const origin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : undefined);
    if (origin && !isOriginAllowed(origin)) {
        console.warn(`[CSRF Blocked]: Mutating ${req.method} from untrusted origin ${origin}`);
        return res.status(403).json({
            error: "CSRF Forbidden",
            message: "Cross-site request blocked: origin not permitted.",
        });
    }
    next();
};
app.use((0, cookie_parser_1.default)());
app.use(csrfOriginGuard);
app.use(express_1.default.json());
// Authentication Endpoints (Register, Login, Refresh, Logout, Me)
app.use("/auth", auth_1.default);
app.use("/api/auth", auth_1.default);
// Optional CSRF Token Handshake Endpoint (for cookie/session forms)
app.get("/api/auth/csrf-token", (_req, res) => {
    const csrfToken = Buffer.from(`${Date.now()}-${Math.random().toString(36).substring(2, 15)}`).toString("base64");
    res.setHeader("X-CSRF-Token", csrfToken);
    res.status(200).json({ csrfToken });
});
// Dynamic Catalog Navigation & Promotion Endpoints
app.get("/api/navigation/categories", async (req, res) => {
    try {
        const forceRefresh = req.query.fresh === "true";
        const categories = await navigation_1.NavigationService.getNavigationCategories(forceRefresh);
        // Aggressive HTTP caching headers: 1 hour cache, stale-while-revalidate for 1 day
        res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
        return res.status(200).json(categories);
    }
    catch (error) {
        console.error("[Navigation API Error]:", error);
        return res.status(500).json({ error: "Failed to retrieve catalog navigation" });
    }
});
// Cache Invalidation Webhook (for Admin UI / CMS updates)
app.post("/api/navigation/revalidate", (_req, res) => {
    navigation_1.NavigationService.invalidateCache();
    return res.status(200).json({ success: true, revalidated: true, timestamp: Date.now() });
});
// Admin endpoint to dynamically update featured promotional banners
app.put("/api/navigation/featured/:categoryId", async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId, 10);
        const { title, subtitle, targetUrl, imageUrl, isActive = true } = req.body;
        if (!title || !imageUrl) {
            return res.status(400).json({ error: "Title and imageUrl are required" });
        }
        const query = `
      INSERT INTO category_featured_promotions (category_id, title, subtitle, target_url, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (category_id) DO UPDATE SET
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        target_url = EXCLUDED.target_url,
        image_url = EXCLUDED.image_url,
        is_active = EXCLUDED.is_active
      RETURNING *;
    `;
        const result = await navigation_1.dbPool.query(query, [
            categoryId,
            title,
            subtitle || null,
            targetUrl || null,
            imageUrl,
            isActive,
        ]);
        // Immediately bust navigation cache
        navigation_1.NavigationService.invalidateCache();
        return res.status(200).json({ success: true, promotion: result.rows[0] });
    }
    catch (error) {
        console.error("[Update Featured Promo Error]:", error);
        return res.status(500).json({ error: "Failed to update category promotion" });
    }
});
// Health Check Endpoint for Render & Cloud Monitoring
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});
// Root Endpoint
app.get("/", (_req, res) => {
    res.status(200).json({
        name: "JuroMart Backend API",
        status: "running",
        domain: "juromart.com",
        api: "https://api.juromart.com",
    });
});
// Mock Boda Dispatch Endpoint
app.post("/api/logistics/dispatch", (req, res) => {
    const { orderId } = req.body;
    const assignedRider = {
        id: "r1",
        name: "Kamau Njuguna",
        phone: "+254712345678",
        motorbikePlate: "KMCE 452X",
        currentStage: "Kencom Stage",
    };
    res.status(200).json({
        success: true,
        timeline: {
            orderId: orderId || "ORD-CBD-8891",
            status: "RIDER_ASSIGNED",
            updatedAt: new Date().toISOString(),
            rider: assignedRider,
            deliveryAddress: {
                zone: "CBD Core",
                landmark: "Imenti House",
                buildingName: "Imenti House",
                shopOrFloorNumber: "Stall G14",
                recipientPhone: "+254712345678",
            },
            history: [
                { status: "PENDING", timestamp: new Date().toISOString(), note: "M-Pesa payment received" },
                { status: "PACKED", timestamp: new Date().toISOString(), note: "Packed by merchant" },
                { status: "RIDER_ASSIGNED", timestamp: new Date().toISOString(), note: "Rider Kamau assigned" },
            ],
        },
    });
});
// Mock M-Pesa STK Push Endpoint
app.post("/api/payments/mpesa/stk-push", (req, res) => {
    const { phoneNumber, amount } = req.body;
    res.status(200).json({
        success: true,
        MerchantRequestID: `MR_${Date.now()}`,
        CheckoutRequestID: `CR_${Date.now()}`,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: `Success. Prompt sent to ${phoneNumber} for KES ${amount}`,
    });
});
app.listen(PORT, () => {
    console.log(`[Backend Server] Express API running on port ${PORT}`);
});
