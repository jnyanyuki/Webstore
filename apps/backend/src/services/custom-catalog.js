"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomCatalogService = void 0;
const medusa_1 = require("@medusajs/medusa");
const custom_product_1 = require("../models/custom-product");
const custom_category_1 = require("../models/custom-category");
class CustomCatalogService extends medusa_1.TransactionBaseService {
    constructor(container = {}) {
        super(container);
        this.manager_ = container.manager;
    }
    /**
     * Retrieves products with dynamic filtering against the JSONB attributes column
     * e.g. attributes: { "ram": "8GB", "brand": "Samsung" }
     */
    async listProductsByDynamicAttributes(filters) {
        const manager = this.activeManager_;
        const qb = manager.createQueryBuilder(custom_product_1.CustomProduct, "cp");
        // Dynamically build the JSONB querying clauses
        Object.entries(filters).forEach(([key, value]) => {
            // Postgres JSONB specific syntax: attributes->>'key' = 'value'
            qb.andWhere(`cp.attributes->>:key = :value`, { key, value });
        });
        return await qb.getMany();
    }
    async createCategory(name, slug, schema, parentId) {
        return await this.atomicPhase_(async (manager) => {
            const categoryRepo = manager.getRepository(custom_category_1.CustomCategory);
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
exports.CustomCatalogService = CustomCatalogService;
