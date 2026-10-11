import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(_req: Request) {
  try {
    // Next.js 16 cacheLife profile or direct path purge
    revalidateTag("categories-nav", "default");
    revalidatePath("/", "layout");
    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to revalidate" }, { status: 500 });
  }
}
