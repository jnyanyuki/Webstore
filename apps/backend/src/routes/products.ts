import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { dbPool } from "../services/navigation";
import { AuthService } from "../services/auth";
import { AuthenticatedRequest } from "../types/auth";
import { NotificationHub } from "../services/notifications";

const router = Router();

// Ensure product_overrides table exists in PostgreSQL
let tableInitialized = false;
async function ensureOverridesTable() {
  if (tableInitialized) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS product_overrides (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(100),
        subcategory VARCHAR(100),
        item_type VARCHAR(100),
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        badge VARCHAR(100),
        description TEXT,
        merchant_stall VARCHAR(255),
        front_image TEXT,
        side_image TEXT,
        images JSONB,
        gallery JSONB,
        variants JSONB,
        discount_percentage NUMERIC,
        is_active BOOLEAN DEFAULT TRUE,
        updated_by VARCHAR(255),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS images JSONB;
      ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS gallery JSONB;
      ALTER TABLE product_overrides ADD COLUMN IF NOT EXISTS attributes JSONB;
      CREATE INDEX IF NOT EXISTS idx_product_overrides_category ON product_overrides(category);
    `);
    tableInitialized = true;
  } catch (err) {
    console.error("[Product Overrides] Table init error:", err);
  }
}

/**
 * GET /api/products/overrides
 * Retrieves all stored product overrides for the master catalog
 */
router.get("/overrides", async (_req: Request, res: Response): Promise<any> => {
  try {
    await ensureOverridesTable();
    const result = await dbPool.query(
      `SELECT id, name, category, subcategory, item_type, price, original_price, 
              badge, description, merchant_stall, front_image, side_image, images, gallery, variants,
              attributes, discount_percentage, is_active, updated_by, updated_at 
       FROM product_overrides WHERE is_active = TRUE`
    );

    const overridesMap: Record<string, any> = {};
    for (const row of result.rows) {
      overridesMap[row.id] = {
        id: row.id,
        name: row.name,
        category: row.category,
        subcategory: row.subcategory,
        itemType: row.item_type,
        price: parseFloat(row.price),
        originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
        badge: row.badge,
        description: row.description,
        merchantStall: row.merchant_stall,
        frontImage: row.front_image,
        sideImage: row.side_image,
        images: row.images ? (Array.isArray(row.images) ? row.images : JSON.parse(row.images)) : undefined,
        gallery: row.gallery ? (Array.isArray(row.gallery) ? row.gallery : JSON.parse(row.gallery)) : undefined,
        variants: row.variants,
        attributes: row.attributes ? (typeof row.attributes === "object" ? row.attributes : JSON.parse(row.attributes)) : undefined,
        discountPercentage:
          row.discount_percentage !== null && row.discount_percentage !== undefined
            ? parseFloat(row.discount_percentage)
            : undefined,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };
    }

    return res.status(200).json({ success: true, count: result.rows.length, overrides: overridesMap });
  } catch (error: any) {
    console.error("[Fetch Product Overrides Error]:", error);
    return res.status(500).json({ error: "Failed to fetch product overrides" });
  }
});

/**
 * POST /api/products/upload-image
 * Super Admin capacity to upload product images (stored locally in public/uploads and edge cached)
 */
router.post(
  "/upload-image",
  AuthService.authenticate,
  AuthService.requireRole(["ADMIN"]),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { dataUrl, filename, productId } = req.body;
      if (!dataUrl || typeof dataUrl !== "string") {
        return res.status(400).json({ error: "dataUrl is required (base64 data URI)" });
      }

      // Check regex for data URL
      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: "Invalid image format. Expected: data:image/<type>;base64,<data>" });
      }

      let ext = matches[1].toLowerCase();
      if (ext === "jpeg") ext = "jpg";
      if (ext === "svg+xml") ext = "svg";
      const buffer = Buffer.from(matches[2], "base64");

      if (buffer.length > 25 * 1024 * 1024) {
        return res.status(400).json({ error: "Image exceeds 25MB size limit" });
      }

      const cleanProdId = (productId || "product").replace(/[^a-zA-Z0-9_-]/g, "");
      const timestamp = Date.now();
      const rand = Math.random().toString(36).substring(2, 8);
      const safeFilename = `${cleanProdId}_${timestamp}_${rand}.${ext}`;

      const webUploadDir = path.resolve(__dirname, "../../../web/public/uploads/products");
      const backendUploadDir = path.resolve(__dirname, "../../public/uploads/products");

      await fs.promises.mkdir(webUploadDir, { recursive: true });
      await fs.promises.writeFile(path.join(webUploadDir, safeFilename), buffer);

      try {
        await fs.promises.mkdir(backendUploadDir, { recursive: true });
        await fs.promises.writeFile(path.join(backendUploadDir, safeFilename), buffer);
      } catch {}

      const publicUrl = `/uploads/products/${safeFilename}`;
      return res.status(200).json({
        success: true,
        url: publicUrl,
        filename: safeFilename,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error("[Upload Image Error]:", err);
      return res.status(500).json({ error: "Failed to upload image", details: err?.message });
    }
  }
);

/**
 * POST /api/products/update
 * Super Admin capacity to edit any product details & reset promotion percentages
 */
router.post(
  "/update",
  AuthService.authenticate,
  AuthService.requireRole(["ADMIN"]),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      await ensureOverridesTable();
      const {
        id,
        name,
        category,
        subcategory,
        itemType,
        price,
        originalPrice,
        badge,
        description,
        merchantStall,
        frontImage,
        sideImage,
        images,
        gallery,
        variants,
        attributes,
        resetPromotion = false,
        discountPercentage,
      } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ error: "A valid price is required" });
      }

      let finalPrice = numPrice;
      let finalOriginalPrice: number | null | undefined = originalPrice ? Number(originalPrice) : undefined;
      let finalDiscountPercentage = discountPercentage !== undefined ? Number(discountPercentage) : undefined;

      // Reset promotion percentage: sets originalPrice to null, clearing strikethrough & discount
      if (resetPromotion) {
        finalOriginalPrice = null;
        finalDiscountPercentage = 0;
      } else if (finalDiscountPercentage !== undefined && !isNaN(finalDiscountPercentage) && finalDiscountPercentage >= 0) {
        if (finalDiscountPercentage === 0) {
          finalOriginalPrice = null;
        } else {
          // If discount % is provided, calculate price from base MSRP or originalPrice
          const base = finalOriginalPrice && finalOriginalPrice > finalPrice ? finalOriginalPrice : finalPrice;
          finalOriginalPrice = base;
          finalPrice = Math.round(base * (1 - finalDiscountPercentage / 100));
        }
      } else if (finalOriginalPrice && finalOriginalPrice > finalPrice) {
        finalDiscountPercentage = Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100);
      }

      const query = `
        INSERT INTO product_overrides (
          id, name, category, subcategory, item_type, price, original_price,
          badge, description, merchant_stall, front_image, side_image, images, gallery, variants,
          attributes, discount_percentage, is_active, updated_by, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, TRUE, $18, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, product_overrides.name),
          category = COALESCE(EXCLUDED.category, product_overrides.category),
          subcategory = COALESCE(EXCLUDED.subcategory, product_overrides.subcategory),
          item_type = COALESCE(EXCLUDED.item_type, product_overrides.item_type),
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          badge = EXCLUDED.badge,
          description = COALESCE(EXCLUDED.description, product_overrides.description),
          merchant_stall = COALESCE(EXCLUDED.merchant_stall, product_overrides.merchant_stall),
          front_image = COALESCE(EXCLUDED.front_image, product_overrides.front_image),
          side_image = COALESCE(EXCLUDED.side_image, product_overrides.side_image),
          images = CASE WHEN EXCLUDED.images IS NOT NULL THEN EXCLUDED.images ELSE product_overrides.images END,
          gallery = CASE WHEN EXCLUDED.gallery IS NOT NULL THEN EXCLUDED.gallery ELSE product_overrides.gallery END,
          variants = COALESCE(EXCLUDED.variants, product_overrides.variants),
          attributes = CASE WHEN EXCLUDED.attributes IS NOT NULL THEN EXCLUDED.attributes ELSE product_overrides.attributes END,
          discount_percentage = EXCLUDED.discount_percentage,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
        RETURNING *;
      `;

      const result = await dbPool.query(query, [
        id,
        name || null,
        category || null,
        subcategory || null,
        itemType || null,
        finalPrice,
        finalOriginalPrice || null,
        badge || null,
        description || null,
        merchantStall || null,
        frontImage || null,
        sideImage || null,
        images ? JSON.stringify(images) : null,
        gallery ? JSON.stringify(gallery) : null,
        variants ? JSON.stringify(variants) : null,
        attributes ? JSON.stringify(attributes) : null,
        finalDiscountPercentage !== undefined && finalDiscountPercentage !== null ? finalDiscountPercentage : null,
        req.authUser?.email || "abokos@juromart.com",
      ]);

      const row = result.rows[0];
      const updatedProduct = {
        id: row.id,
        name: row.name,
        category: row.category,
        subcategory: row.subcategory,
        itemType: row.item_type,
        price: parseFloat(row.price),
        originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
        badge: row.badge,
        description: row.description,
        merchantStall: row.merchant_stall,
        frontImage: row.front_image,
        sideImage: row.side_image,
        images: row.images ? (Array.isArray(row.images) ? row.images : JSON.parse(row.images)) : undefined,
        gallery: row.gallery ? (Array.isArray(row.gallery) ? row.gallery : JSON.parse(row.gallery)) : undefined,
        variants: row.variants,
        attributes: row.attributes ? (typeof row.attributes === "string" ? JSON.parse(row.attributes) : row.attributes) : {},
        discountPercentage:
          row.discount_percentage !== null && row.discount_percentage !== undefined
            ? parseFloat(row.discount_percentage)
            : 0,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };

      // Broadcast update via SSE
      NotificationHub.broadcast({
        type: "PRODUCT_CATALOG_UPDATED",
        payload: { product: updatedProduct },
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: `Product ${id} successfully updated by Super Admin`,
        product: updatedProduct,
      });
    } catch (error: any) {
      console.error("[Super Admin Product Update Error]:", error);
      return res.status(500).json({ error: "Failed to update product details" });
    }
  }
);

/**
 * POST /api/products/batch-reset-promotions
 * Resets promotion percentages for multiple products or an entire category
 */
router.post(
  "/batch-reset-promotions",
  AuthService.authenticate,
  AuthService.requireRole(["ADMIN"]),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      await ensureOverridesTable();
      const { category, productIds } = req.body;

      if (!category && (!productIds || !Array.isArray(productIds) || productIds.length === 0)) {
        return res.status(400).json({ error: "Either a category or array of productIds is required" });
      }

      let query = "";
      let params: any[] = [];

      if (category) {
        query = `
          UPDATE product_overrides
          SET original_price = NULL, discount_percentage = 0, badge = NULL, updated_by = $1, updated_at = NOW()
          WHERE LOWER(category) = LOWER($2)
          RETURNING id;
        `;
        params = [req.authUser?.email || "abokos@juromart.com", category];
      } else {
        query = `
          UPDATE product_overrides
          SET original_price = NULL, discount_percentage = 0, badge = NULL, updated_by = $1, updated_at = NOW()
          WHERE id = ANY($2::text[])
          RETURNING id;
        `;
        params = [req.authUser?.email || "abokos@juromart.com", productIds];
      }

      const result = await dbPool.query(query, params);

      // Broadcast
      NotificationHub.broadcast({
        type: "PRODUCT_PROMOTIONS_RESET",
        payload: {
          affectedCount: result.rowCount,
          category: category || "selected",
        },
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        message: `Promotions successfully reset for ${result.rowCount} products`,
        count: result.rowCount,
      });
    } catch (error: any) {
      console.error("[Batch Reset Promotions Error]:", error);
      return res.status(500).json({ error: "Failed to reset promotions" });
    }
  }
);

/**
 * POST /api/products/create
 * Merchant & Super Admin capacity to list and publish new products with polymorphic attribute schemas
 */
router.post(
  "/create",
  AuthService.authenticate,
  AuthService.requireRole(["SELLER", "ADMIN"]),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      await ensureOverridesTable();
      const {
        id: customId,
        category = "Electronics",
        subcategory,
        itemType,
        originalPrice,
        badge,
        description,
        merchantStall = "Stall G14 • Imenti House",
        frontImage,
        sideImage,
        images = [],
        gallery = [],
        variants = [],
        attributes = {},
      } = req.body;

      const name = req.body.name || req.body.title;
      const rawPrice = req.body.price !== undefined ? req.body.price : req.body.basePrice;
      const rawDiscount = req.body.discountPercentage !== undefined ? req.body.discountPercentage : req.body.discountPercent;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "Product name/title is required" });
      }

      const numPrice = Number(rawPrice);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ error: "A valid positive price is required" });
      }

      let discountPercentage = rawDiscount !== undefined ? Number(rawDiscount) : undefined;

      // Generate clean unique ID if not provided
      const slugPrefix = category.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4).toUpperCase();
      const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const productId = customId || `PROD-${slugPrefix || "CBD"}-${Date.now().toString(36).toUpperCase()}-${randSuffix}`;

      let finalPrice = numPrice;
      let finalOriginalPrice = originalPrice ? Number(originalPrice) : undefined;
      let finalDiscount = discountPercentage !== undefined ? Number(discountPercentage) : undefined;

      if (finalOriginalPrice && finalOriginalPrice > finalPrice) {
        finalDiscount = Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100);
      }

      // Safe image fallback
      const finalFrontImage = frontImage || (images && images.length > 0 ? images[0] : "");
      const finalSideImage = sideImage || (images && images.length > 1 ? images[1] : finalFrontImage);

      const query = `
        INSERT INTO product_overrides (
          id, name, category, subcategory, item_type, price, original_price,
          badge, description, merchant_stall, front_image, side_image, images, gallery, variants,
          attributes, discount_percentage, is_active, updated_by, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, TRUE, $18, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          subcategory = EXCLUDED.subcategory,
          item_type = EXCLUDED.item_type,
          price = EXCLUDED.price,
          original_price = EXCLUDED.original_price,
          badge = EXCLUDED.badge,
          description = EXCLUDED.description,
          merchant_stall = EXCLUDED.merchant_stall,
          front_image = EXCLUDED.front_image,
          side_image = EXCLUDED.side_image,
          images = EXCLUDED.images,
          gallery = EXCLUDED.gallery,
          variants = EXCLUDED.variants,
          attributes = EXCLUDED.attributes,
          discount_percentage = EXCLUDED.discount_percentage,
          updated_by = EXCLUDED.updated_by,
          updated_at = NOW()
        RETURNING *;
      `;

      const result = await dbPool.query(query, [
        productId,
        name.trim(),
        category,
        subcategory || null,
        itemType || null,
        finalPrice,
        finalOriginalPrice || null,
        badge || null,
        description || null,
        merchantStall,
        finalFrontImage || null,
        finalSideImage || null,
        images ? JSON.stringify(images) : null,
        gallery ? JSON.stringify(gallery) : null,
        variants ? JSON.stringify(variants) : null,
        attributes ? JSON.stringify(attributes) : null,
        finalDiscount !== undefined && finalDiscount !== null ? finalDiscount : null,
        req.authUser?.email || "abokos@juromart.com",
      ]);

      const row = result.rows[0];
      const createdProduct = {
        id: row.id,
        name: row.name,
        category: row.category,
        subcategory: row.subcategory,
        itemType: row.item_type,
        price: parseFloat(row.price),
        originalPrice: row.original_price ? parseFloat(row.original_price) : undefined,
        badge: row.badge,
        description: row.description,
        merchantStall: row.merchant_stall,
        frontImage: row.front_image,
        sideImage: row.side_image,
        images: row.images ? (Array.isArray(row.images) ? row.images : JSON.parse(row.images)) : [],
        gallery: row.gallery ? (Array.isArray(row.gallery) ? row.gallery : JSON.parse(row.gallery)) : [],
        variants: row.variants,
        attributes: row.attributes ? (typeof row.attributes === "object" ? row.attributes : JSON.parse(row.attributes)) : {},
        discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : 0,
        updatedBy: row.updated_by,
        updatedAt: row.updated_at,
      };

      // Broadcast new product to all clients via SSE
      NotificationHub.broadcast({
        type: "PRODUCT_CATALOG_UPDATED",
        payload: { product: createdProduct },
        timestamp: new Date().toISOString(),
      });

      return res.status(201).json({
        success: true,
        message: `Product "${createdProduct.name}" successfully published to JuroMart!`,
        product: createdProduct,
      });
    } catch (error: any) {
      console.error("[Create Product PIM Error]:", error);
      return res.status(500).json({ error: "Failed to publish product to catalog", details: error?.message });
    }
  }
);

export default router;
