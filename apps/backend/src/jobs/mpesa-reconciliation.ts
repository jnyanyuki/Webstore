import { EntityManager } from "typeorm";
import { MpesaTransaction } from "../models/mpesa-transaction";
import { captureException } from "../utils/sentry";

export interface DarajaStatementEntry {
  receiptNumber: string;
  checkoutRequestId: string;
  amount: number;
  phoneNumber: string;
  transactionDate: string;
}

export class MpesaReconciliationJob {
  /**
   * Run daily automated reconciliation cross-referencing Safaricom Daraja statement
   * against local PostgreSQL MpesaTransaction table.
   */
  async runDailyReconciliation(
    entityManager: EntityManager,
    safaricomStatement: DarajaStatementEntry[]
  ): Promise<{ reconciledCount: number; anomalyCount: number; anomalies: string[] }> {
    console.log(`[M-Pesa Reconciliation Cron] Running daily audit on ${safaricomStatement.length} Safaricom entries...`);
    let reconciledCount = 0;
    const anomalies: string[] = [];

    for (const entry of safaricomStatement) {
      try {
        const localRecord = await entityManager.findOne(MpesaTransaction, {
          where: { mpesa_receipt_number: entry.receiptNumber },
        });

        if (!localRecord) {
          // Anomaly 1: Money received in Daraja, but missing in local DB
          const anomalyMsg = `CRITICAL ANOMALY: Daraja Receipt '${entry.receiptNumber}' (KSh ${entry.amount}) exists in Daraja but is MISSING in local database! Auto-repairing record...`;
          console.warn(anomalyMsg);
          anomalies.push(anomalyMsg);

          // Auto-repair missing record into DB
          const repairedTx = entityManager.create(MpesaTransaction, {
            checkout_request_id: entry.checkoutRequestId,
            mpesa_receipt_number: entry.receiptNumber,
            amount: entry.amount,
            phone_number: entry.phoneNumber,
            status: "SUCCESS",
          });
          await entityManager.save(repairedTx);
        } else if (localRecord.status !== "SUCCESS") {
          // Anomaly 2: Local record was PENDING or FAILED, but Daraja shows SUCCESS
          console.warn(`RECONCILIATION FIX: Updating local transaction '${entry.receiptNumber}' status from '${localRecord.status}' to 'SUCCESS'`);
          localRecord.status = "SUCCESS";
          await entityManager.save(localRecord);
          reconciledCount++;
        } else {
          reconciledCount++;
        }
      } catch (err) {
        captureException(err, { receiptNumber: entry.receiptNumber });
      }
    }

    console.log(`[M-Pesa Reconciliation Complete] Reconciled: ${reconciledCount}, Anomalies Found & Handled: ${anomalies.length}`);

    return {
      reconciledCount,
      anomalyCount: anomalies.length,
      anomalies,
    };
  }
}
