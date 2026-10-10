import { TransactionBaseService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { MpesaTransaction } from "../models/mpesa-transaction";
import { MpesaStkPushRequest, MpesaStkPushResponse } from "@webstore/types";

export default class MpesaService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;

  constructor(container: any = {}) {
    super(container);
    this.manager_ = container?.manager;
  }

  /**
   * Generates a temporary OAuth token for Safaricom Daraja API
   */
  async getOAuthToken(): Promise<string> {
    // In production, this would call the Daraja API and cache the token for 59 mins
    console.log("Fetching Daraja OAuth token...");
    return "mock_oauth_token";
  }

  /**
   * Initiates the STK Push to the customer's phone
   */
  async initiateStkPush(data: MpesaStkPushRequest): Promise<MpesaStkPushResponse> {
    const token = await this.getOAuthToken();
    
    // Mocking the Daraja API response
    const mockResponse: MpesaStkPushResponse = {
      MerchantRequestID: `MR_${Date.now()}`,
      CheckoutRequestID: `ws_CO_${Date.now()}`,
      ResponseCode: "0",
      ResponseDescription: "Success. Request accepted for processing",
      CustomerMessage: "Success. Request accepted for processing"
    };

    // Save the pending transaction to our database
    await this.atomicPhase_(async (manager) => {
      const mpesaRepo = manager.getRepository(MpesaTransaction);
      const transaction = mpesaRepo.create({
        medusa_order_id: data.accountReference, // Assume order ID is passed here
        checkout_request_id: mockResponse.CheckoutRequestID,
        amount: data.amount,
        phone_number: data.phoneNumber,
        status: "PENDING"
      });
      await mpesaRepo.save(transaction);
    });

    return mockResponse;
  }

  /**
   * Idempotent callback processor
   */
  async processSuccessfulPayment(data: { checkoutRequestId: string; receiptNumber: string; amount: number }): Promise<void> {
    await this.atomicPhase_(async (manager) => {
      const mpesaRepo = manager.getRepository(MpesaTransaction);
      
      const transaction = await mpesaRepo.findOne({
        where: { checkout_request_id: data.checkoutRequestId }
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      transaction.status = "COMPLETED";
      transaction.mpesa_receipt_number = data.receiptNumber;

      // Because of the UNIQUE constraint on mpesa_receipt_number,
      // if Daraja retries this callback, this .save() will throw a Postgres Unique Violation (23505)
      // which our callback route catches and responds with 200 OK.
      await mpesaRepo.save(transaction);

      // TODO: Trigger Medusa Order Status update to 'PAID'
    });
  }

  async processFailedPayment(data: { checkoutRequestId: string; reason: string }): Promise<void> {
    await this.atomicPhase_(async (manager) => {
      const mpesaRepo = manager.getRepository(MpesaTransaction);
      
      const transaction = await mpesaRepo.findOne({
        where: { checkout_request_id: data.checkoutRequestId }
      });

      if (transaction) {
        transaction.status = "FAILED";
        transaction.failure_reason = data.reason;
        await mpesaRepo.save(transaction);
      }
    });
  }
}
