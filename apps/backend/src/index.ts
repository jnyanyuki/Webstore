import express, { Request, Response } from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint for Render & Cloud Monitoring
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Root Endpoint
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ name: "NaiCBD Backend API", status: "running" });
});

// Mock Boda Dispatch Endpoint
app.post("/api/logistics/dispatch", (req: Request, res: Response) => {
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
app.post("/api/payments/mpesa/stk-push", (req: Request, res: Response) => {
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
