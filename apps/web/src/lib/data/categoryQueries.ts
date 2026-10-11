import { prisma } from "@/lib/prisma";

export interface BreadcrumbNode {
  id: number;
  name: string;
  slug: string;
  level: number;
  depth: number;
}

export interface BreadcrumbResponse {
  categoryId: number;
  urlPath: string;
  breadcrumbTrail: string;
  breadcrumbs: BreadcrumbNode[];
}

export interface DescendantNode {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  relativeDepth: number;
  pathString: string;
  lineage: number[];
}

/**
 * 1. Fetch Breadcrumbs (Bottom-Up: Category -> Root)
 * Traverses upward using a recursive CTE from target category ID to the top-level department.
 */
export async function getCategoryBreadcrumbs(
  categoryId: number
): Promise<BreadcrumbResponse | null> {
  const result = await prisma.$queryRaw<
    Array<{
      url_path: string | null;
      breadcrumb_trail: string | null;
      breadcrumbs_json: any;
    }>
  >`
    WITH RECURSIVE breadcrumbs AS (
      -- Anchor member: Start at the target category
      SELECT 
        id,
        parent_id,
        name,
        slug,
        CASE WHEN parent_id IS NULL THEN 1 ELSE 2 END AS level,
        0 AS depth
      FROM categories
      WHERE id = ${categoryId} AND is_active = TRUE

      UNION ALL

      -- Recursive member: Traverse upward to parent
      SELECT 
        c.id,
        c.parent_id,
        c.name,
        c.slug,
        CASE WHEN c.parent_id IS NULL THEN 1 ELSE 2 END AS level,
        b.depth + 1 AS depth
      FROM categories c
      INNER JOIN breadcrumbs b ON c.id = b.parent_id
      WHERE c.is_active = TRUE
    )
    SELECT 
      STRING_AGG(slug, '/' ORDER BY depth DESC) AS url_path,
      STRING_AGG(name, ' > ' ORDER BY depth DESC) AS breadcrumb_trail,
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', id,
          'name', name,
          'slug', slug,
          'level', level,
          'depth', depth
        ) 
        ORDER BY depth DESC
      ) AS breadcrumbs_json
    FROM breadcrumbs;
  `;

  if (!result || result.length === 0 || !result[0].breadcrumbs_json) {
    return null;
  }

  const row = result[0];
  const breadcrumbs: BreadcrumbNode[] =
    typeof row.breadcrumbs_json === "string"
      ? JSON.parse(row.breadcrumbs_json)
      : row.breadcrumbs_json || [];

  return {
    categoryId,
    urlPath: row.url_path || "",
    breadcrumbTrail: row.breadcrumb_trail || "",
    breadcrumbs,
  };
}

/**
 * 2. Fetch Full Descendant Tree (Top-Down: Root -> Leaves)
 * Traverses downward using recursive CTE with cycle protection.
 */
export async function getCategoryDescendants(
  rootCategoryId: number
): Promise<DescendantNode[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: number;
      parent_id: number | null;
      name: string;
      slug: string;
      relative_depth: number;
      path_string: string;
      lineage: number[];
    }>
  >`
    WITH RECURSIVE category_tree AS (
      -- Anchor member: Target root or parent category
      SELECT 
        id,
        parent_id,
        name,
        slug,
        0 AS relative_depth,
        CAST(name AS TEXT) AS path_string,
        ARRAY[id] AS lineage
      FROM categories
      WHERE id = ${rootCategoryId} AND is_active = TRUE

      UNION ALL

      -- Recursive member: Traverse downward to children
      SELECT 
        c.id,
        c.parent_id,
        c.name,
        c.slug,
        ct.relative_depth + 1 AS relative_depth,
        ct.path_string || ' -> ' || c.name AS path_string,
        ct.lineage || c.id AS lineage
      FROM categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
      WHERE c.is_active = TRUE
        -- Cycle guard: prevents infinite loops in circular references
        AND NOT (c.id = ANY(ct.lineage))
    )
    SELECT 
      id,
      parent_id,
      name,
      slug,
      relative_depth,
      path_string,
      lineage
    FROM category_tree
    ORDER BY lineage;
  `;

  return rows.map((r) => ({
    id: r.id,
    parentId: r.parent_id,
    name: r.name,
    slug: r.slug,
    relativeDepth: Number(r.relative_depth),
    pathString: r.path_string,
    lineage: r.lineage || [],
  }));
}

/**
 * 3. Fetch All Descendant IDs (Fast flat array for product filtering queries)
 */
export async function getCategoryDescendantIds(
  rootCategoryId: number
): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ id: number }>>`
    WITH RECURSIVE target_categories AS (
      SELECT id
      FROM categories
      WHERE id = ${rootCategoryId} AND is_active = TRUE
      
      UNION ALL
      
      SELECT c.id
      FROM categories c
      INNER JOIN target_categories tc ON c.parent_id = tc.id
      WHERE c.is_active = TRUE
    )
    SELECT id FROM target_categories;
  `;

  return rows.map((r) => r.id);
}
