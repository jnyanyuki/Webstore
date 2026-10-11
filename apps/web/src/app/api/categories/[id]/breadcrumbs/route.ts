import { NextRequest, NextResponse } from "next/server";
import { getCategoryBreadcrumbs } from "@/lib/data/categoryQueries";

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

    const breadcrumbsData = await getCategoryBreadcrumbs(categoryId);

    if (!breadcrumbsData) {
      return NextResponse.json(
        { error: `Category with ID ${categoryId} not found or inactive` },
        { status: 404 }
      );
    }

    return NextResponse.json(breadcrumbsData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[Breadcrumbs API] Failed to fetch breadcrumbs:", error);
    return NextResponse.json(
      { error: "Internal server error fetching breadcrumbs" },
      { status: 500 }
    );
  }
}
