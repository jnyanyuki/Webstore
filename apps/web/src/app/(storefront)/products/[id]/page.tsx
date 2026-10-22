import React from "react";
import Link from "next/link";
import MpesaCheckout from "@/components/MpesaCheckout";
import ProductImageGallery from "@/components/ProductImageGallery";
import PdpHeader from "@/components/PdpHeader";
import ProductDetailCta from "@/components/ProductDetailCta";
import { ProductItem } from "@/components/DynamicProductCard";
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
      baseMsrp: catalogItem.baseMsrp || catalogItem.originalPrice || catalogItem.price,
      sku: catalogItem.sku || `SKU-${catalogItem.id.toUpperCase()}`,
      releaseYear: catalogItem.releaseYear || 2024,
      category: catalogItem.category,
      subcategory: catalogItem.subcategory || "Standard",
      itemType: catalogItem.itemType || "Retail",
      badge: catalogItem.badge,
      generation: catalogItem.generation,
      lineage: catalogItem.lineage || [],
      description: catalogItem.description || `The ${catalogItem.name} delivers precision engineering, authenticated high-tier reliability, and official manufacturer warranty coverage.`,
      images:
        catalogItem.images && catalogItem.images.length > 0
          ? catalogItem.images
          : catalogItem.gallery && catalogItem.gallery.length > 0
          ? catalogItem.gallery.map((g) => g.url)
          : {
              front: catalogItem.frontImage,
              side: catalogItem.sideImage || catalogItem.frontImage,
            },
      attributes: {
        SKU: catalogItem.sku || `SKU-${catalogItem.id.toUpperCase()}`,
        "Launch MSRP": `KES ${(catalogItem.baseMsrp || catalogItem.originalPrice || catalogItem.price).toLocaleString()}`,
        "Release Year": `${catalogItem.releaseYear || 2024}`,
        Category: catalogItem.category,
        Subcategory: catalogItem.subcategory || "Standard",
        ItemType: catalogItem.itemType || "Retail",
        Generation: catalogItem.generation || "Current Lineup",
        Highlights: catalogItem.badge || "Verified Authentic",
        Store: catalogItem.merchantStall || "Authorized Flagship Dealer",
      },
    };

    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <PdpHeader />

        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            <div className="space-y-4">
              <ProductImageGallery images={product.images} title={product.name} />
              {product.badge && (
                <div className="flex items-center justify-center">
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 shadow-xs">
                    {product.badge}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {product.attributes.Subcategory} • {product.attributes.ItemType}
                  </span>
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {product.sku}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                    Yr: {product.releaseYear}
                  </span>
                </div>
                
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-snug">
                  {product.name}
                </h1>

                {/* Price & MSRP Comparison Display */}
                <div className="mt-3 space-y-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-black text-emerald-600">
                      KES {product.price.toLocaleString()}
                    </span>
                    {product.baseMsrp && product.baseMsrp > product.price && (
                      <span className="text-sm line-through text-gray-400">
                        MSRP: KES {product.baseMsrp.toLocaleString()}
                      </span>
                    )}
                    {product.baseMsrp && product.baseMsrp > product.price && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Save KES {(product.baseMsrp - product.price).toLocaleString()} ({Math.round(((product.baseMsrp - product.price) / product.baseMsrp) * 100)}% Off)
                      </span>
                    )}
                  </div>
                </div>

                {/* Broad Detailed Description */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-1.5">
                    Product Overview & Specifications
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Authenticity & Specs Box */}
                <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Catalog SKU:</span>
                    <span className="font-mono font-bold text-gray-900">{product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Benchmark Launch MSRP:</span>
                    <span className="font-semibold text-gray-700">KES {product.baseMsrp.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Production Year:</span>
                    <span className="font-semibold text-gray-800">{product.releaseYear} Release</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Authorized Merchant:</span>
                    <span className="font-semibold text-gray-800">{product.attributes.Store}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Warranty Assurance:</span>
                    <span className="font-semibold text-emerald-700">{product.attributes.Highlights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Inspection Status:</span>
                    <span className="font-semibold text-blue-700">✓ 100-Point Factory QC Passed</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <ProductDetailCta
                  product={{
                    id: catalogItem.id,
                    name: catalogItem.name,
                    category: catalogItem.category,
                    price: catalogItem.price,
                    originalPrice: catalogItem.originalPrice,
                    frontImage: catalogItem.frontImage,
                    sideImage: catalogItem.sideImage,
                    badge: catalogItem.badge,
                    variants: catalogItem.variants,
                  }}
                />
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
      <PdpHeader />

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

            <div className="border-t border-gray-100 pt-5">
              <ProductDetailCta
                product={{
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  price: product.price,
                  frontImage: typeof product.images === "object" && "front" in product.images ? (product.images as any).front : "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=900&q=85",
                  description: product.description,
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
