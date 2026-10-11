import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { NON_PERISHABLE_TAXONOMY } from "./categoriesData";

export function getFallbackTaxonomy() {
  return NON_PERISHABLE_TAXONOMY.map((dept, index) => ({
    id: index + 1,
    name: dept.name,
    slug: dept.slug,
    featured: dept.featured,
    subcategories: dept.subcategories.map((sub, sIndex) => ({
      id: (index + 1) * 100 + sIndex + 1,
      title: sub.title,
      slug: sub.slug,
      items: sub.items,
    })),
  }));
}

export const getCachedCategoryTree = unstable_cache(
  async () => {
    try {
      // If DATABASE_URL is not set or empty (e.g. initial deployment without env var)
      if (!process.env.DATABASE_URL) {
        console.warn("[Categories] DATABASE_URL is not configured; serving fallback taxonomy.");
        return getFallbackTaxonomy();
      }

      const rootCategories = await prisma.category.findMany({
        where: {
          parentId: null,
          isActive: true,
        },
        orderBy: {
          displayOrder: "asc",
        },
        include: {
          featured: {
            where: { isActive: true },
          },
          children: {
            where: { isActive: true },
            orderBy: { displayOrder: "asc" },
            include: {
              items: {
                where: { isActive: true },
                orderBy: { displayOrder: "asc" },
              },
            },
          },
        },
      });

      if (rootCategories && rootCategories.length > 0) {
        return rootCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          featured: cat.featured
            ? {
                title: cat.featured.title,
                subtitle: cat.featured.subtitle ?? undefined,
                image: cat.featured.imageUrl,
                targetUrl: cat.featured.targetUrl ?? undefined,
              }
            : undefined,
          subcategories: cat.children.map((sub) => ({
            id: sub.id,
            title: sub.name,
            slug: sub.slug,
            items: sub.items.map((item) => item.title),
          })),
        }));
      }
    } catch (error) {
      console.error("[Categories] Database query failed; falling back to offline taxonomy:", error);
    }

    return getFallbackTaxonomy();
  },
  ["categories-nav-cache-key"], // Cache key
  {
    tags: ["categories-nav"],   // Cache tag for on-demand purging
    revalidate: Number(process.env.CACHE_NAV_TTL) || 86400, // Configurable TTL (default 24h)
  }
);
