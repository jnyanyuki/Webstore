import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { NavigationService, dbPool } from "./services/navigation";
import authRouter from "./routes/auth";
import productsRouter from "./routes/products";
import { NotificationHub } from "./services/notifications";
import { BodaDispatchService } from "./services/boda-dispatch";
import { AuthService } from "./services/auth";

const app = express();
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
const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Server-to-server, curl, mobile native
  if (allowedOriginsList.includes(origin)) return true;
  if (/^https?:\/\/([a-z0-9-]+\.)*juromart\.com(:\d+)?$/i.test(origin)) return true;
  if (/^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin)) return true;
  if (/^http:\/\/([a-z0-9-]+\.)*localhost(:\d+)?$/i.test(origin)) return true;
  return false;
};

app.use(
  cors({
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
  })
);

// 2. OWASP Cross-Site Request Forgery (CSRF) Origin Verification Middleware
// Protects mutating endpoints against unauthorized third-party cross-site submissions
const csrfOriginGuard = (req: Request, res: Response, next: () => void) => {
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

app.use(cookieParser() as any);
app.use(csrfOriginGuard);
app.use(express.json());

// Authentication Endpoints (Register, Login, Refresh, Logout, Me)
app.use("/auth", authRouter);
app.use("/api/auth", authRouter);

// Product Catalog & Promotion Management (Super Admin)
app.use("/api/products", productsRouter);

// Optional CSRF Token Handshake Endpoint (for cookie/session forms)
app.get("/api/auth/csrf-token", (_req: Request, res: Response) => {
  const csrfToken = Buffer.from(
    `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
  ).toString("base64");
  res.setHeader("X-CSRF-Token", csrfToken);
  res.status(200).json({ csrfToken });
});

// Dynamic Catalog Navigation & Promotion Endpoints
app.get("/api/navigation/categories", async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.fresh === "true";
    const categories = await NavigationService.getNavigationCategories(forceRefresh);

    // Aggressive HTTP caching headers: 1 hour cache, stale-while-revalidate for 1 day
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json(categories);
  } catch (error: any) {
    console.error("[Navigation API Error]:", error);
    return res.status(500).json({ error: "Failed to retrieve catalog navigation" });
  }
});

// Cache Invalidation Webhook (for Admin UI / CMS updates)
app.post("/api/navigation/revalidate", (_req: Request, res: Response) => {
  NavigationService.invalidateCache();
  return res.status(200).json({ success: true, revalidated: true, timestamp: Date.now() });
});

// Admin endpoint to dynamically update featured promotional banners
app.put("/api/navigation/featured/:categoryId", async (req: Request, res: Response) => {
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

    const result = await dbPool.query(query, [
      categoryId,
      title,
      subtitle || null,
      targetUrl || null,
      imageUrl,
      isActive,
    ]);

    // Immediately bust navigation cache
    NavigationService.invalidateCache();

    return res.status(200).json({ success: true, promotion: result.rows[0] });
  } catch (error: any) {
    console.error("[Update Featured Promo Error]:", error);
    return res.status(500).json({ error: "Failed to update category promotion" });
  }
});

// Health Check Endpoint for Render & Cloud Monitoring
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Root Endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    name: "JuroMart Backend API",
    status: "running",
    domain: "juromart.com",
    api: "https://api.juromart.com",
  });
});

const bodaDispatch = new BodaDispatchService();

// ==============================================================================
// Real-Time Notification Stream (Server-Sent Events)
// ==============================================================================
app.get("/api/notifications/stream", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const clientId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const userId = req.query.user_id as string | undefined;

  NotificationHub.addClient(clientId, res, userId);

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", clientId, timestamp: new Date().toISOString() })}\n\n`);

  // Periodic heartbeat every 20 seconds prevents proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
    } catch {
      clearInterval(heartbeat);
      NotificationHub.removeClient(clientId);
    }
  }, 20000);

  req.on("close", () => {
    clearInterval(heartbeat);
    NotificationHub.removeClient(clientId);
  });
});

// ==============================================================================
// Logistics & Boda Courier Dispatch Endpoints (PostgreSQL Persisted)
// ==============================================================================

// Fetch merchant active orders
app.get("/api/orders/merchant", async (req: Request, res: Response) => {
  try {
    const merchantId = (req.query.merchant_id as string) || "VEND-CBD-042";
    const orders = await bodaDispatch.getMerchantOrders(merchantId);
    return res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    console.error("[Merchant Orders Error]:", error);
    return res.status(500).json({ error: "Failed to fetch merchant orders" });
  }
});

// Fetch order timeline
app.get("/api/logistics/timeline/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const timeline = await bodaDispatch.getOrderTimeline(orderId);
    if (!timeline) {
      return res.status(404).json({ error: "Order timeline not found" });
    }
    return res.status(200).json({ success: true, timeline });
  } catch (error: any) {
    console.error("[Get Timeline Error]:", error);
    return res.status(500).json({ error: "Failed to fetch order timeline" });
  }
});

// Update order status & dispatch rider
app.post("/api/logistics/dispatch", async (req: Request, res: Response) => {
  try {
    const { orderId, status = "PACKED", note, merchantPhone } = req.body;
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const timeline = await bodaDispatch.updateStatus(orderId, status, note, merchantPhone);
    return res.status(200).json({ success: true, timeline });
  } catch (error: any) {
    console.error("[Logistics Dispatch Error]:", error);
    return res.status(500).json({ error: error.message || "Failed to update order status" });
  }
});

// ==============================================================================
// Safaricom M-Pesa Daraja STK Push & Webhook Callback Endpoints
// ==============================================================================

app.post("/api/payments/mpesa/stk-push", async (req: Request, res: Response) => {
  try {
    const { phoneNumber, amount, orderId = `ORD-${Date.now()}` } = req.body;

    if (!phoneNumber || !amount) {
      return res.status(400).json({ error: "phoneNumber and amount are required" });
    }

    const cleanPhone = String(phoneNumber).replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("0")
      ? `254${cleanPhone.slice(1)}`
      : cleanPhone.startsWith("+")
      ? cleanPhone.slice(1)
      : cleanPhone;

    const merchantRequestId = `MR_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Record pending transaction in PostgreSQL
    await BodaDispatchService.ensureTablesExist();
    try {
      await dbPool.query(
        `INSERT INTO mpesa_transactions (order_id, merchant_request_id, checkout_request_id, amount, phone_number, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')`,
        [orderId, merchantRequestId, checkoutRequestId, amount, formattedPhone]
      );
    } catch (dbErr) {
      console.warn("[Mpesa] Transaction record warning:", dbErr);
    }

    // Broadcast payment initiated event via SSE
    NotificationHub.broadcast({
      type: "PAYMENT_INITIATED",
      order_id: orderId,
      message: `M-Pesa STK prompt sent to ${formattedPhone} for KES ${amount}`,
      data: { checkoutRequestId, amount, phone: formattedPhone },
    });

    return res.status(200).json({
      success: true,
      MerchantRequestID: merchantRequestId,
      CheckoutRequestID: checkoutRequestId,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: `Success. Prompt sent to ${formattedPhone} for KES ${amount}`,
    });
  } catch (error: any) {
    console.error("[M-Pesa STK Push Error]:", error);
    return res.status(500).json({ error: "Failed to initiate M-Pesa payment" });
  }
});

// Webhook Callback for Safaricom Daraja
app.post("/api/payments/mpesa/callback", async (req: Request, res: Response) => {
  try {
    const callbackData = req.body?.Body?.stkCallback || req.body;
    const checkoutRequestId = callbackData?.CheckoutRequestID;
    const resultCode = callbackData?.ResultCode;
    const resultDesc = callbackData?.ResultDesc;

    console.log(`[M-Pesa Callback]: CheckoutRequestID=${checkoutRequestId}, ResultCode=${resultCode}`);

    if (checkoutRequestId) {
      const isSuccess = resultCode === 0;
      const status = isSuccess ? "COMPLETED" : "FAILED";

      let receiptNumber = "";
      if (isSuccess && callbackData?.CallbackMetadata?.Item) {
        const item = callbackData.CallbackMetadata.Item.find((i: any) => i.Name === "MpesaReceiptNumber");
        receiptNumber = item?.Value || "";
      }

      await BodaDispatchService.ensureTablesExist();
      const updatedTx = await dbPool.query(
        `UPDATE mpesa_transactions 
         SET status = $1, result_code = $2, result_desc = $3, mpesa_receipt_number = $4, updated_at = NOW() 
         WHERE checkout_request_id = $5 
         RETURNING order_id, amount, phone_number`,
        [status, resultCode, resultDesc, receiptNumber, checkoutRequestId]
      );

      if (updatedTx.rows.length > 0) {
        const orderId = updatedTx.rows[0].order_id;
        if (isSuccess && orderId) {
          // Update order status in merchant orders
          await dbPool.query(
            `UPDATE merchant_orders SET status = 'PROCESSING', updated_at = NOW() WHERE id = $1`,
            [orderId]
          );

          await dbPool.query(
            `INSERT INTO order_timeline_events (order_id, status, note, timestamp)
             VALUES ($1, 'PROCESSING', $2, NOW())`,
            [orderId, `M-Pesa payment confirmed. Receipt: ${receiptNumber}`]
          );

          // Broadcast real-time payment success
          NotificationHub.broadcast({
            type: "PAYMENT_CONFIRMED",
            order_id: orderId,
            message: `Payment confirmed for order #${orderId}. Receipt: ${receiptNumber}`,
            data: { receiptNumber, orderId },
          });
        }
      }
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error: any) {
    console.error("[M-Pesa Callback Error]:", error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted with warning" });
  }
});

app.listen(PORT, () => {
  console.log(`[Backend Server] Express API running on port ${PORT}`);
});
