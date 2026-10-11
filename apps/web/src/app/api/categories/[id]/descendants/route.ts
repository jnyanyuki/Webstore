import { NextRequest, NextResponse } from "next/server";
import { getCategoryDescendants } from "@/lib/data/categoryQueries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const categoryId = parseInt(id, 10);

    if (isNaN(categoryId) || categoryId <= 0) {
      return NextResponse.json(
        { error: "Invalid category ID parameter" },
        { status: 400 }
      );
    }

    const descendants = await getCategoryDescendants(categoryId);

    return NextResponse.json(
      {
        rootCategoryId: categoryId,
        count: descendants.length,
        descendants,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("[Descendants API] Failed to fetch category descendants:", error);
    return NextResponse.json(
      { error: "Internal server error fetching category descendants" },
      { status: 500 }
    );
  }
}
