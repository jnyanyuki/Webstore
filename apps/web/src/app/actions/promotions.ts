"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { UpdatePromotionSchema } from "@/lib/validations/promotion";

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function updateCategoryPromotion(
  _prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  // 1. Extract values from FormData
  const rawData = {
    categoryId: formData.get("categoryId"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") || undefined,
    imageUrl: formData.get("imageUrl"),
    targetUrl: formData.get("targetUrl") || undefined,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    expiresAt: formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string).toISOString() : null,
  };

  // 2. Validate with Zod
  const validated = UpdatePromotionSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      message: "Validation failed. Please correct the fields below.",
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { categoryId, title, subtitle, imageUrl, targetUrl, isActive, expiresAt } = validated.data;

  try {
    // 3. Upsert the promotion in PostgreSQL
    await prisma.categoryFeaturedPromotion.upsert({
      where: {
        categoryId,
      },
      update: {
        title,
        subtitle: subtitle || null,
        imageUrl,
        targetUrl: targetUrl || null,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      create: {
        categoryId,
        title,
        subtitle: subtitle || null,
        imageUrl,
        targetUrl: targetUrl || null,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // 4. Instantly purge the cached navigation tree
    revalidateTag("categories-nav", "default");

    return {
      success: true,
      message: "Promotion updated and navigation cache purged successfully.",
    };
  } catch (error) {
    console.error("Failed to update category promotion:", error);
    return {
      success: false,
      message: "A database error occurred while saving the promotion.",
    };
  }
}
