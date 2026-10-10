import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { generateEntityId } from "@medusajs/medusa";

@Entity("custom_product_variant")
export class CustomProductVariant {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  custom_product_id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  medusa_variant_id!: string;

  @Column({ type: "varchar", length: 100, unique: true })
  sku!: string;

  @Column({ type: "int", default: 0 })
  stock_available!: number;

  @Column({ type: "int", default: 0 })
  stock_reserved!: number;

  @Column({ type: "jsonb", default: {} })
  variant_options!: Record<string, any>;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "cvar");
  }
}
