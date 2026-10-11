import { Pool } from "pg";
import { CategoryGroup } from "@webstore/types";

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_POOLED ||
  "postgresql://neondb_owner:npg_4ZYKLx6ArJNH@ep-royal-cake-b9cgphao.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require";

export const dbPool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// High-performance In-Memory & TTL Caching Layer
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

let cachedNavigation: CacheEntry<CategoryGroup[]> | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour aggressive cache

export class NavigationService {
  /**
   * Fetches the hierarchical navigation tree with featured banners in a single aggregated query.
   */
  static async getNavigationCategories(forceRefresh = false): Promise<CategoryGroup[]> {
    const now = Date.now();
    if (!forceRefresh && cachedNavigation && now - cachedNavigation.timestamp < CACHE_TTL_MS) {
      return cachedNavigation.data;
    }

    const query = `
      SELECT 
          c.id,
          c.name,
          c.slug,
          -- Featured Banner
          json_build_object(
              'title', p.title,
              'subtitle', p.subtitle,
              'image', p.image_url,
              'targetUrl', p.target_url
          ) AS featured,
          -- Subcategories with their leaf items
          COALESCE(
              json_agg(
                  json_build_object(
                      'id', sub.id,
                      'title', sub.name,
                      'slug', sub.slug,
                      'items', sub_items.items
                  ) ORDER BY sub.display_order ASC
              ) FILTER (WHERE sub.id IS NOT NULL), 
              '[]'::json
          ) AS subcategories
      FROM categories c
      LEFT JOIN category_featured_promotions p 
          ON p.category_id = c.id 
          AND p.is_active = TRUE 
          AND (p.expires_at IS NULL OR p.expires_at > NOW())
      LEFT JOIN categories sub 
          ON sub.parent_id = c.id 
          AND sub.is_active = TRUE
      LEFT JOIN LATERAL (
          SELECT json_agg(ci.title ORDER BY ci.display_order ASC) AS items
          FROM category_items ci
          WHERE ci.category_id = sub.id AND ci.is_active = TRUE
      ) sub_items ON TRUE
      WHERE c.parent_id IS NULL AND c.is_active = TRUE
      GROUP BY c.id, c.name, c.slug, p.id
      ORDER BY c.display_order ASC;
    `;

    try {
      const result = await dbPool.query(query);
      const categories: CategoryGroup[] = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        featured: row.featured && row.featured.title ? row.featured : undefined,
        subcategories: (row.subcategories || []).map((sub: any) => ({
          id: sub.id,
          title: sub.title,
          slug: sub.slug,
          items: Array.isArray(sub.items) ? sub.items : [],
        })),
      }));

      cachedNavigation = {
        data: categories,
        timestamp: now,
      };

      return categories;
    } catch (error) {
      console.error("[NavigationService] Database query failed:", error);
      if (cachedNavigation) {
        return cachedNavigation.data;
      }
      throw error;
    }
  }

  /**
   * Invalidate navigation cache on demand when admin modifies categories or banners
   */
  static invalidateCache(): void {
    cachedNavigation = null;
  }
}
