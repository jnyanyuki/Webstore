import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export const getCachedCategoryTree = unstable_cache(
  async () => {
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

    if (rootCategories.length === 0) {
      return (await import("./categoriesData")).NON_PERISHABLE_TAXONOMY.map((dept, index) => ({
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
  },
  ["categories-nav-cache-key"], // Cache key
  {
    tags: ["categories-nav"],   // Cache tag for on-demand purging
    revalidate: Number(process.env.CACHE_NAV_TTL) || 86400, // Configurable TTL (default 24h)
  }
);
