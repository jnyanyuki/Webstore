import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const secret = process.env.REVALIDATION_SECRET_TOKEN;

    // Reject unauthorized purge requests
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Purge cache entries associated with the tag
    revalidateTag("categories-nav", "default");

    return NextResponse.json({
      revalidated: true,
      tag: "categories-nav",
      timestamp: Date.now(),
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(err) },
      { status: 500 }
    );
  }
}
