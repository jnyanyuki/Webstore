import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { generateEntityId } from "@medusajs/medusa";

@Entity("mpesa_transaction")
export class MpesaTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  medusa_order_id: string;

  @Index("idx_mpesa_transaction_checkout_id")
  @Column({ type: "varchar", length: 255, unique: true })
  checkout_request_id: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: true })
  mpesa_receipt_number: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: number;

  @Column({ type: "varchar", length: 15 })
  phone_number: string;

  @Column({ type: "varchar", length: 50, default: "PENDING" })
  status: string;

  @Column({ type: "text", nullable: true })
  failure_reason: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "mptxn");
  }
}
