import { unstable_cache } from "next/cache";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  images: {
    front: string; // Relative path stored in DB, e.g. "products/earbuds-pro.png"
    side?: string;
  };
  attributes: Record<string, string>;
  description: string;
  badge?: string;
}

const SAMPLE_PRODUCTS: CatalogProduct[] = [
  {
    id: "prod_earbuds",
    name: "Wireless Noise-Canceling Earbuds Pro",
    slug: "wireless-noise-canceling-earbuds-pro",
    category: "Electronics",
    price: 4500,
    originalPrice: 5294,
    images: {
      front: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=85",
      side: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=900&q=85",
    },
    attributes: {
      bluetooth: "v5.3",
      battery_life: "24hrs with Case",
      warranty: "12 Months Verified",
      delivery: "45-Min Express Boda",
    },
    description:
      "Engineered with hybrid active noise cancellation and crystal-clear acoustic drivers. Direct from verified Nairobi CBD vendor.",
    badge: "Bestseller",
  },
  {
    id: "prod_hoodie",
    name: "Urban Heavyweight Cotton Hoodie - Black",
    slug: "urban-heavyweight-cotton-hoodie-black",
    category: "Fashion",
    price: 2200,
    originalPrice: 2800,
    images: {
      front: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&q=85",
      side: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=900&q=85",
    },
    attributes: {
      material: "100% Organic Cotton (420 GSM)",
      fit: "Relaxed Boxy Fit",
      origin: "Kenya Made",
      delivery: "Instant CBD Pickup or Dispatch",
    },
    description:
      "Ultra-soft heavyweight fleece hoodie crafted for daily street comfort. Pre-shrunk finish with ribbed cuffs and hem.",
    badge: "Trending",
  },
];

/**
 * Cached product retrieval with Next.js Data Cache and tagged on-demand invalidation.
 * Prevents redundant Neon PostgreSQL wakeups / cold starts.
 */
export async function getCachedProductById(id: string): Promise<CatalogProduct | null> {
  const fetchProduct = unstable_cache(
    async (productId: string) => {
      try {
        const { prisma } = await import("@/lib/prisma");
        const numericId = parseInt(productId, 10);

        const dbItem = await prisma.canonicalProduct.findFirst({
          where: {
            OR: [
              ...(isNaN(numericId) ? [] : [{ id: numericId }]),
              { slug: productId },
              { gtin: productId },
            ],
            isActive: true,
          },
          include: { category: true },
        });

        if (dbItem) {
          const imgs = Array.isArray(dbItem.images) ? (dbItem.images as string[]) : [];
          return {
            id: String(dbItem.id),
            name: dbItem.title,
            slug: dbItem.slug,
            category: dbItem.category?.name || "General",
            price: dbItem.basePrice,
            originalPrice: dbItem.originalPrice || undefined,
            images: {
              front: imgs[0] || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=85",
              side: imgs[1] || undefined,
            },
            attributes: (dbItem.specs as Record<string, string>) || {},
            description: dbItem.description || "",
            badge: dbItem.badge || undefined,
          };
        }
      } catch (e) {
        console.warn("[getCachedProductById] DB lookup failed, using fallback", e);
      }

      return SAMPLE_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || null;
    },
    [`product-cache-${id}`],
    {
      tags: ["products-catalog", `product-${id}`],
      revalidate: Number(process.env.CACHE_CATALOG_TTL) || 3600, // Configurable TTL (default 1h)
    }
  );

  return fetchProduct(id);
}

export async function getCachedAllProducts(): Promise<CatalogProduct[]> {
  const fetchAll = unstable_cache(
    async () => {
      try {
        const { prisma } = await import("@/lib/prisma");
        const dbItems = await prisma.canonicalProduct.findMany({
          where: { isActive: true },
          include: { category: true },
          take: 50,
        });

        if (dbItems.length > 0) {
          return dbItems.map((dbItem) => {
            const imgs = Array.isArray(dbItem.images) ? (dbItem.images as string[]) : [];
            return {
              id: String(dbItem.id),
              name: dbItem.title,
              slug: dbItem.slug,
              category: dbItem.category?.name || "General",
              price: dbItem.basePrice,
              originalPrice: dbItem.originalPrice || undefined,
              images: {
                front: imgs[0] || "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=85",
                side: imgs[1] || undefined,
              },
              attributes: (dbItem.specs as Record<string, string>) || {},
              description: dbItem.description || "",
              badge: dbItem.badge || undefined,
            };
          });
        }
      } catch (e) {
        console.warn("[getCachedAllProducts] DB lookup failed, using fallback", e);
      }

      return SAMPLE_PRODUCTS;
    },
    ["products-all-catalog-cache"],
    {
      tags: ["products-catalog"],
      revalidate: Number(process.env.CACHE_CATALOG_TTL) || 3600,
    }
  );

  return fetchAll();
}
