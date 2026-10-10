import { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { MpesaCallbackData } from "@webstore/types";

// POST /api/payments/mpesa/callback
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const mpesaService = req.scope.resolve("mpesaService");
  const orderService = req.scope.resolve("orderService");
  
  const callbackData = req.body as MpesaCallbackData;
  const stkCallback = callbackData.Body.stkCallback;

  try {
    // 1. Log the receipt for auditing (and to prevent double processing)
    // A database unique constraint on MpesaReceiptNumber will throw an error if already processed.
    
    if (stkCallback.ResultCode === 0) {
      // Payment Successful
      const metadata = stkCallback.CallbackMetadata?.Item || [];
      const mpesaReceiptNumber = metadata.find(item => item.Name === "MpesaReceiptNumber")?.Value;
      const amount = metadata.find(item => item.Name === "Amount")?.Value;

      // Idempotency Check & Fulfillment
      await mpesaService.processSuccessfulPayment({
        checkoutRequestId: stkCallback.CheckoutRequestID,
        receiptNumber: mpesaReceiptNumber as string,
        amount: Number(amount)
      });

    } else {
      // Payment Failed (Cancelled by user, insufficient funds, etc)
      await mpesaService.processFailedPayment({
        checkoutRequestId: stkCallback.CheckoutRequestID,
        reason: stkCallback.ResultDesc
      });
    }

    // Always respond with 200 to Safaricom Daraja so they don't retry unnecessarily
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (error) {
    console.error("M-Pesa Callback Processing Error:", error);
    // If it's a unique constraint error (idempotency hit), still return 200 to Safaricom
    if ((error as any)?.code === '23505') { // Postgres Unique Violation
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Already Processed" });
    }
    
    // For genuine internal errors, we let it fail so Daraja can retry
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
}
