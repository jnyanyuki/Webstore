import React from "react";
import Link from "next/link";
import MpesaCheckout from "@/components/MpesaCheckout";
import ProductImageGallery from "@/components/ProductImageGallery";
import { getCachedProductById } from "@/lib/data/products";

import { INITIAL_PRODUCTS } from "@/data/products";

export const revalidate = 60;

export async function generateStaticParams() {
  return INITIAL_PRODUCTS.map((p) => ({ id: p.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;

  // 1. Instant static resolution for initial catalog products (ZERO database load)
  const catalogItem = INITIAL_PRODUCTS.find((p) => p.id === id);
  if (catalogItem) {
    const product = {
      id: catalogItem.id,
      name: catalogItem.name,
      price: catalogItem.price,
      originalPrice: catalogItem.originalPrice,
      category: catalogItem.category,
      images: {
        front: catalogItem.frontImage,
        side: catalogItem.sideImage || catalogItem.frontImage,
      },
      attributes: {
        Category: catalogItem.category,
        Subcategory: catalogItem.subcategory || "Standard",
        ItemType: catalogItem.itemType || "Retail",
        Highlights: catalogItem.badge,
        Location: catalogItem.merchantStall || "Nairobi CBD",
      },
      description: `Authentic ${catalogItem.name} sourced directly from verified CBD merchant at ${catalogItem.merchantStall || "Nairobi CBD"}. Guaranteed authentic with 45-minute boda boda express dispatch.`,
    };

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <header className="bg-white border-b border-gray-100 py-4 px-6">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:underline">
              ← Back to Storefront
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-1 rounded-full">
                CBD Merchant Verified
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
                Edge Pre-rendered
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            <div>
              <ProductImageGallery images={product.images} title={product.name} />
            </div>

            <div className="flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {product.attributes.Subcategory} • {product.attributes.ItemType}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 leading-snug">
                  {product.name}
                </h1>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {product.description}
                </p>

                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Merchant Stall:</span>
                    <span className="font-semibold text-gray-800">{product.attributes.Location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Highlights:</span>
                    <span className="font-semibold text-emerald-700">{product.attributes.Highlights}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-2xl font-black text-emerald-600">
                    KES {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm line-through text-gray-400 ml-2">
                      KES {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <MpesaCheckout amount={product.price} cartId={`pdp_${product.id}`} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Fallback to cached dynamic lookup for merchant-submitted items
  const productData = await getCachedProductById(id);
  const product = productData || {
    id,
    name: "Express Catalog Product",
    price: 3500,
    category: "General",
    images: {
      front: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=85",
      side: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=900&q=85",
    },
    attributes: {},
    description: "Premium quality item sourced directly from verified Nairobi CBD vendors with instant 45-minute Boda delivery.",
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-green-600 font-bold text-sm flex items-center gap-1 hover:underline">
            ← Back to Storefront
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2.5 py-1 rounded-full">
              Neon Connection Pooled
            </span>
            <span className="text-xs bg-green-100 text-green-800 font-semibold px-2.5 py-1 rounded-full">
              Edge ISR Cached (60s)
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          <div>
            <ProductImageGallery images={product.images} title={product.name} />
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{product.category}</span>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-1 mb-3">{product.name}</h1>
              <div className="text-2xl font-black text-gray-900 mb-4">KSh {product.price.toLocaleString()}</div>
              
              <p className="text-sm text-gray-600 mb-6">{product.description}</p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500 capitalize">{key.replace("_", " ")}:</span>
                      <span className="font-semibold text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <MpesaCheckout amount={product.price} cartId={`pdp_${product.id}`} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
