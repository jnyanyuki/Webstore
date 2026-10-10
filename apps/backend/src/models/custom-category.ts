import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { generateEntityId } from "@medusajs/medusa";

@Entity("custom_category")
export class CustomCategory {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  parent_id!: string | null;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug!: string;

  @Column({ type: "jsonb", default: {} })
  attribute_schema!: Record<string, any>;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;

  @BeforeInsert()
  private beforeInsert(): void {
    this.id = generateEntityId(this.id, "ccat");
  }
}
