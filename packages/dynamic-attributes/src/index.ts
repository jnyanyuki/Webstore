import { z } from "zod";

// 1. Electronics Category Schema (RAM, Storage, CPU, Screen Size)
export const ElectronicsSchema = z.object({
  ram: z.enum(["4GB", "8GB", "16GB", "32GB"], { required_error: "RAM capacity is required" }),
  storage: z.enum(["64GB", "128GB", "256GB", "512GB", "1TB"], { required_error: "Storage capacity is required" }),
  processor: z.string().optional(),
  screen_size: z.number().positive().optional(),
});

// 2. Apparel & Fashion Schema (Size, Color, Gender, Material)
export const ApparelSchema = z.object({
  size: z.enum(["XS", "S", "M", "L", "XL", "XXL"], { required_error: "Apparel size is required" }),
  color: z.string().min(1, "Color is required"),
  gender: z.enum(["Unisex", "Men", "Women"]).optional(),
  material: z.string().optional(),
});

// 3. Home Appliances Schema (Power Rating, Warranty, Dimensions)
export const AppliancesSchema = z.object({
  power_rating: z.number().positive("Power consumption must be positive"),
  warranty_months: z.number().int().min(0, "Warranty months cannot be negative"),
  dimensions: z.string().optional(),
});

// Registry mapping category slugs to their respective Zod schemas
export const CATEGORY_SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  electronics: ElectronicsSchema,
  fashion: ApparelSchema,
  "home-appliances": AppliancesSchema,
};

/**
 * Validate category-specific polymorphic JSONB attributes before DB write or API submit
 */
export function validateCategoryAttributes(categorySlug: string, attributes: unknown) {
  const schema = CATEGORY_SCHEMA_REGISTRY[categorySlug];
  if (!schema) {
    // Fallback: permissive validation for unmapped categories
    return { success: true, data: attributes };
  }

  const result = schema.safeParse(attributes);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
    };
  }

  return { success: true, data: result.data };
}
