import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PromotionForm from "./PromotionForm";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const rootCategories = await prisma.category.findMany({
    where: {
      parentId: null,
      isActive: true,
    },
    include: {
      featured: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Promotions &amp; MegaMenu Banner Admin
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Edit category banners below. Submitting automatically triggers on-demand cache revalidation.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors"
          >
            ← View Storefront
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rootCategories.map((category) => (
            <PromotionForm
              key={category.id}
              categoryId={category.id}
              categoryName={category.name}
              initialData={{
                title: category.featured?.title,
                subtitle: category.featured?.subtitle ?? undefined,
                imageUrl: category.featured?.imageUrl,
                targetUrl: category.featured?.targetUrl ?? undefined,
                isActive: category.featured?.isActive ?? true,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
