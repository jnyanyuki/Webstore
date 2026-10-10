import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";
import { generateEntityId } from "@medusajs/medusa";

@Entity("custom_product")
export class CustomProduct {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  medusa_product_id!: string;

  @Column({ type: "uuid" })
  seller_id!: string;

  @Column({ type: "uuid", nullable: true })
  category_id!: string;

  @Index("idx_custom_product_attributes", { synchronize: false })
  @Column({ type: "jsonb", default: {} })
  attributes!: Record<string, any>;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "cprod");
  }
}
