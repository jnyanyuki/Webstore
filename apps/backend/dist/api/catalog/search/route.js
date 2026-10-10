"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const meilisearch_1 = require("../../../services/meilisearch");
const custom_catalog_1 = require("../../../services/custom-catalog");
const meiliService = new meilisearch_1.MeilisearchService();
const catalogService = new custom_catalog_1.CustomCatalogService();
async function GET(req, res) {
    try {
        const { q = "", category, size, ram, storage, min_price, max_price, limit = "20", offset = "0" } = req.query;
        const filters = [];
        if (category)
            filters.push(`category_slug = "${category}"`);
        if (size)
            filters.push(`attributes.size = "${size}"`);
        if (ram)
            filters.push(`attributes.ram = "${ram}"`);
        if (storage)
            filters.push(`attributes.storage = "${storage}"`);
        if (min_price)
            filters.push(`price >= ${min_price}`);
        if (max_price)
            filters.push(`price <= ${max_price}`);
        // High performance search via Meilisearch
        const searchResults = await meiliService.search(q, filters, undefined, Number(limit), Number(offset));
        return res.status(200).json({
            success: true,
            data: searchResults,
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: error.message || "Search error" });
    }
}
