import { prisma } from "@/lib/prisma";

export async function getCategoryTree() {
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

  // Map to the frontend CategoryGroup structure
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
