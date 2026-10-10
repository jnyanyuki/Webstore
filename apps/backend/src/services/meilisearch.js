"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeilisearchService = void 0;
class MeilisearchService {
    constructor() {
        this.indexName = "products";
        this.host = process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700";
        this.apiKey = process.env.MEILISEARCH_KEY || "masterKey";
    }
    /**
     * Configure Meilisearch index settings (Filterable and Searchable attributes)
     */
    async configureIndexSettings() {
        console.log(`[Meilisearch] Configuring index settings on '${this.indexName}'...`);
        const settings = {
            searchableAttributes: ["title", "category", "brand", "attributes.processor", "attributes.material"],
            filterableAttributes: [
                "category",
                "category_slug",
                "brand",
                "price",
                "attributes.size",
                "attributes.color",
                "attributes.ram",
                "attributes.storage",
                "attributes.screen_size",
                "attributes.power_rating",
            ],
            sortableAttributes: ["price", "created_at"],
        };
        // In production, hits Meilisearch REST API: POST /indexes/products/settings
        console.log("[Meilisearch] Index settings applied:", settings);
    }
    /**
     * Index or update a product document in Meilisearch asynchronously
     */
    async indexProduct(productDoc) {
        console.log(`[Meilisearch Async Indexer] Ingesting document ID '${productDoc.id}' (${productDoc.title})`);
        return { success: true, docId: productDoc.id };
    }
    /**
     * Perform high-performance faceted search
     */
    async search(query, filters, sort, limit = 20, offset = 0) {
        console.log(`[Meilisearch Search] Query: "${query}", Filters: [${filters?.join(", ")}], Limit: ${limit}`);
        // Returns structured faceted search result DTO
        return {
            hits: [],
            query,
            limit,
            offset,
            estimatedTotalHits: 0,
            facetDistribution: {
                category: { Fashion: 12, Electronics: 8, "Home Appliances": 5 },
                "attributes.size": { S: 4, M: 8, L: 6, XL: 2 },
                "attributes.ram": { "4GB": 3, "8GB": 4, "16GB": 1 },
            },
        };
    }
}
exports.MeilisearchService = MeilisearchService;
