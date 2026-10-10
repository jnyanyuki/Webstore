"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfricasTalkingService = void 0;
class AfricasTalkingService {
    constructor() {
        this.apiKey = process.env.AT_API_KEY || "sandbox_key";
        this.username = process.env.AT_USERNAME || "sandbox";
    }
    /**
     * Send SMS notification via Africa's Talking API
     */
    async sendSms(payload) {
        console.log(`[Africa's Talking SMS] Sending to ${payload.to}: "${payload.message}"`);
        // In production, this calls Africa's Talking REST API (https://api.africastalking.com/version1/messaging)
        // For sandbox/development:
        return {
            success: true,
            messageId: `AT_MSG_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        };
    }
    /**
     * Notify vendor when a Boda rider has been assigned to pick up their order
     */
    async notifyMerchantRiderAssigned(vendorPhone, orderId, riderName, riderPhone) {
        const message = `[NaiCBD Marketplace] Order #${orderId} has been assigned to Boda Rider ${riderName} (${riderPhone}). Please have the package ready for pickup at your shop stage.`;
        await this.sendSms({ to: vendorPhone, message });
    }
    /**
     * Notify customer when order status updates
     */
    async notifyCustomerOrderStatus(customerPhone, orderId, status, details) {
        const message = `[NaiCBD Marketplace] Order #${orderId} update: Status is now ${status}. ${details || ""}`;
        await this.sendSms({ to: customerPhone, message });
    }
}
exports.AfricasTalkingService = AfricasTalkingService;
