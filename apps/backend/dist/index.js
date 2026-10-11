"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const navigation_1 = require("./services/navigation");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 9000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
    res.status(200).json({ name: "NaiCBD Backend API", status: "running" });
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
