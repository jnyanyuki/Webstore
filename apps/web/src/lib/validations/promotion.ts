import { z } from "zod";

export const UpdatePromotionSchema = z.object({
  categoryId: z.coerce.number().int().positive("Invalid category ID"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
  subtitle: z.string().trim().max(255).optional().or(z.literal("")),
  imageUrl: z.string().url("Must be a valid image URL"),
  targetUrl: z.string().trim().max(255).optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable(),
});

export type UpdatePromotionInput = z.infer<typeof UpdatePromotionSchema>;
