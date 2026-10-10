import { TransactionBaseService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { CustomProduct } from "../models/custom-product";
import { CustomCategory } from "../models/custom-category";

export class CustomCatalogService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected transactionManager_: EntityManager | undefined;

  constructor(container: any = {}) {
    super(container);
    this.manager_ = container.manager;
  }

  /**
   * Retrieves products with dynamic filtering against the JSONB attributes column
   * e.g. attributes: { "ram": "8GB", "brand": "Samsung" }
   */
  async listProductsByDynamicAttributes(filters: Record<string, string>): Promise<CustomProduct[]> {
    const manager = this.activeManager_;
    const qb = manager.createQueryBuilder(CustomProduct, "cp");

    // Dynamically build the JSONB querying clauses
    Object.entries(filters).forEach(([key, value]) => {
      // Postgres JSONB specific syntax: attributes->>'key' = 'value'
      qb.andWhere(`cp.attributes->>:key = :value`, { key, value });
    });

    return await qb.getMany();
  }

  async createCategory(name: string, slug: string, schema: Record<string, any>, parentId?: string): Promise<CustomCategory> {
    return await this.atomicPhase_(async (manager) => {
      const categoryRepo = manager.getRepository(CustomCategory);
      const cat = categoryRepo.create({
        name,
        slug,
        attribute_schema: schema,
        parent_id: parentId || null
      });
      return await categoryRepo.save(cat);
    });
  }
}
