import { prisma } from "@/lib/prisma";

export interface ExternalProductFeedItem {
  externalId: string;
  source: "icecat" | "aliexpress" | "distributor" | "csv" | "manual";
  title: string;
  brand: string;
  gtin?: string; // UPC/EAN/GTIN-13
  mpn?: string;  // Manufacturer Part Number
  basePrice: number;
  originalPrice?: number;
  description?: string;
  categoryHint?: string; // External breadcrumb string e.g. "Electronics > Audio > Earbuds"
  images: string[];
  specs?: Record<string, string | number | boolean>;
  badge?: string;
}

const IMAGEKIT_ENDPOINT =
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT?.replace(/\/$/, "") ||
  "https://ik.imagekit.io/njndeveloper";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Normalizes external media URLs through ImageKit's edge proxy
 */
function normalizeImageKitUrl(imageUrl: string): string {
  if (!imageUrl || imageUrl.startsWith("data:") || imageUrl.includes(IMAGEKIT_ENDPOINT)) {
    return imageUrl;
  }
  // Route external image through ImageKit transform proxy
  return `${IMAGEKIT_ENDPOINT}/tr=w-800,q-85,f-auto/${imageUrl}`;
}

/**
 * Rule-based and keyword-driven classification to map external titles to internal categories
 */
async function resolveCategoryId(title: string, categoryHint?: string): Promise<number> {
  const combinedText = `${title} ${categoryHint || ""}`.toLowerCase();

  // Query top categories from database
  const categories = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    select: { id: true, name: true, slug: true },
  });

  if (categories.length === 0) return 1;

  // Keyword to category slug heuristics
  const classificationRules: Record<string, string[]> = {
    "phones-tablets": ["phone", "smartphone", "iphone", "samsung galaxy", "tablet", "ipad", "power bank", "charger", "smartwatch", "screen protector"],
    "computers-gaming": ["laptop", "macbook", "desktop", "cpu", "gpu", "nvme", "ssd", "ram", "motherboard", "playstation", "ps5", "xbox", "nintendo", "keyboard", "mouse", "monitor"],
    "tvs-audio-vision": ["tv", "television", "oled", "qled", "soundbar", "earbuds", "headphones", "speaker", "projector", "subwoofer", "home theater"],
    "home-appliances": ["air fryer", "blender", "microwave", "cooker", "fridge", "refrigerator", "washing machine", "kettle", "fan", "air conditioner"],
    "solar-power-backup": ["solar", "inverter", "battery", "ups", "generator", "power station", "floodlight"],
    "mens-fashion-shoes": ["men", "hoodie", "t-shirt", "sneakers", "oxford", "boots", "jeans", "loafers", "chinos"],
    "womens-fashion-bags": ["dress", "women", "blouse", "handbag", "heels", "tote bag", "skirt", "lingerie", "pumps"],
    "watches-jewelry-optics": ["watch", "necklace", "earrings", "ring", "sunglasses", "eyewear"],
    "home-furniture-living": ["sofa", "couch", "bed", "mattress", "table", "chair", "desk", "cookware", "pan", "pot", "duvet", "curtains"],
    "beauty-personal-care": ["clipper", "shaver", "blow dryer", "straightener", "wig", "skincare", "massage gun", "toothbrush", "perfume", "fragrance"],
    "sports-fitness-outdoors": ["dumbbell", "treadmill", "bike", "bicycle", "tent", "sleeping bag", "yoga", "football", "basketball"],
    "automotive-tools": ["car", "dash cam", "seat cover", "helmet", "drill", "wrench", "welder", "tire inflator"],
    "baby-gear-toys": ["stroller", "car seat", "crib", "toy", "drone", "puzzle", "lego", "baby"],
    "security-smart-home-travel": ["cctv", "security camera", "smart lock", "suitcase", "luggage", "backpack"],
    "office-stationery-music": ["printer", "laminator", "whiteboard", "guitar", "piano", "microphone", "mixer"],
  };

  for (const [slug, keywords] of Object.entries(classificationRules)) {
    if (keywords.some((kw) => combinedText.includes(kw))) {
      const match = categories.find((c) => c.slug.includes(slug) || slug.includes(c.slug));
      if (match) return match.id;
    }
  }

  // Fallback to first available category
  return categories[0].id;
}

/**
 * Universal Ingestion Function: Staging + Golden Record Deduplication
 */
export async function ingestProductFeedItem(item: ExternalProductFeedItem) {
  // 1. Audit log raw feed payload in staging table
  const rawRecord = await prisma.rawVendorProduct.create({
    data: {
      sourceName: item.source,
      externalId: item.externalId,
      payload: item as any,
      gtin: item.gtin || null,
      mpn: item.mpn || null,
      isProcessed: false,
    },
  });

  // 2. Classify to internal category
  const categoryId = await resolveCategoryId(item.title, item.categoryHint);

  // 3. Normalize images with ImageKit
  const normalizedImages = (item.images || []).map(normalizeImageKitUrl);

  // 4. Generate unique slug
  const baseSlug = slugify(`${item.brand} ${item.title}`);
  const uniqueSlug = item.gtin ? `${baseSlug}-${item.gtin}` : `${baseSlug}-${Date.now().toString().slice(-4)}`;

  // 5. Match & Merge into Canonical Products (Golden Record)
  let canonicalProduct;

  if (item.gtin) {
    // Upsert on GTIN to prevent duplicates
    canonicalProduct = await prisma.canonicalProduct.upsert({
      where: { gtin: item.gtin },
      update: {
        title: item.title,
        basePrice: item.basePrice,
        originalPrice: item.originalPrice || null,
        description: item.description || undefined,
        specs: item.specs || undefined,
        images: normalizedImages,
        updatedAt: new Date(),
      },
      create: {
        categoryId,
        brand: item.brand,
        title: item.title,
        slug: uniqueSlug,
        description: item.description || null,
        specs: item.specs || {},
        images: normalizedImages,
        gtin: item.gtin,
        mpn: item.mpn || null,
        basePrice: item.basePrice,
        originalPrice: item.originalPrice || null,
        badge: item.badge || null,
      },
    });
  } else {
    // If no GTIN, match by brand + MPN if available, or create new
    if (item.mpn) {
      const existing = await prisma.canonicalProduct.findFirst({
        where: { brand: item.brand, mpn: item.mpn },
      });
      if (existing) {
        canonicalProduct = await prisma.canonicalProduct.update({
          where: { id: existing.id },
          data: {
            basePrice: item.basePrice,
            specs: item.specs ? { ...(existing.specs as any), ...item.specs } : undefined,
            images: normalizedImages.length > 0 ? normalizedImages : undefined,
          },
        });
      }
    }

    if (!canonicalProduct) {
      canonicalProduct = await prisma.canonicalProduct.create({
        data: {
          categoryId,
          brand: item.brand,
          title: item.title,
          slug: uniqueSlug,
          description: item.description || null,
          specs: item.specs || {},
          images: normalizedImages,
          gtin: null,
          mpn: item.mpn || null,
          basePrice: item.basePrice,
          originalPrice: item.originalPrice || null,
          badge: item.badge || null,
        },
      });
    }
  }

  // 6. Mark raw staging record as processed
  await prisma.rawVendorProduct.update({
    where: { id: rawRecord.id },
    data: {
      isProcessed: true,
      processedAt: new Date(),
    },
  });

  return canonicalProduct;
}

/**
 * Bulk Batch Ingestion for processing CSV / JSON / API feeds
 */
export async function bulkIngestProductFeed(items: ExternalProductFeedItem[]) {
  const results = {
    total: items.length,
    processed: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const item of items) {
    try {
      await ingestProductFeedItem(item);
      results.processed++;
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Item ${item.title} failed: ${err.message}`);
    }
  }

  return results;
}
