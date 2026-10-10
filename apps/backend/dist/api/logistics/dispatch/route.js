"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const boda_dispatch_1 = require("../../../services/boda-dispatch");
const bodaDispatchService = new boda_dispatch_1.BodaDispatchService();
async function POST(req, res) {
    try {
        const { action, orderId, deliveryAddress, status, note, merchantPhone } = req.body;
        if (action === "create") {
            const timeline = bodaDispatchService.createOrderTimeline(orderId, deliveryAddress);
            return res.status(201).json({ success: true, timeline });
        }
        if (action === "update") {
            const timeline = await bodaDispatchService.updateStatus(orderId, status, note, merchantPhone);
            return res.status(200).json({ success: true, timeline });
        }
        return res.status(400).json({ success: false, error: "Invalid action. Use 'create' or 'update'." });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message || "Dispatch processing error" });
    }
}
async function GET(req, res) {
    try {
        const { orderId } = req.query;
        const timeline = bodaDispatchService.getOrderTimeline(orderId);
        if (!timeline) {
            return res.status(404).json({ success: false, error: "Order timeline not found" });
        }
        return res.status(200).json({ success: true, timeline });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
