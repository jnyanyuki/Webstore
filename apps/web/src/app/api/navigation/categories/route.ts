import { NextResponse } from "next/server";
import { getCachedCategoryTree, getFallbackTaxonomy } from "@/lib/data/categories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getCachedCategoryTree();

    return NextResponse.json(categories, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("Failed to fetch category navigation, serving fallback taxonomy:", error);
    const fallback = getFallbackTaxonomy();
    return NextResponse.json(fallback, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  }
}
