"use client";

import React, { useState } from "react";
import Image from "next/image";

export type ProductItem = {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  itemType?: string;
  price: number;
  originalPrice?: number;
  frontImage: string;
  sideImage?: string;
  merchantStall?: string;
  badge?: string;
  description?: string;
  generation?: string;
  lineage?: string[];
  sku?: string;
  baseMsrp?: number;
  releaseYear?: number;
  colors?: string[];
  sizes?: string[];
  variants?: { name: string; priceDelta: number }[];
};

function getBadgeStyles(badge: string) {
  if (badge.includes("🔥") || badge.includes("Only") || badge.includes("Trending")) {
    return "bg-amber-50/95 text-amber-900 border-amber-200/90";
  }
  if (badge.includes("⭐") || badge.includes("Top Rated") || badge.includes("✨")) {
    return "bg-amber-50/95 text-amber-950 border-amber-200/90";
  }
  if (badge.includes("🛡️") || badge.includes("✓") || badge.includes("💎") || badge.includes("Return")) {
    return "bg-blue-50/95 text-blue-900 border-blue-200/90";
  }
  // Spec / Material tag
  return "bg-white/95 text-gray-800 border-gray-200/90";
}

interface PackOption {
  label: string;
  multiplier: number;
  discountRate: number;
  priceDelta?: number;
}

export default function DynamicProductCard({
  product,
  onAddToCart,
  onQuickView,
}: {
  product: ProductItem;
  onAddToCart: (p: ProductItem, quantity?: number, variant?: string) => void;
  onQuickView: (p: ProductItem) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  // Option A: Multi-item Pack & Variant Options
  const packOptions: PackOption[] =
    product.variants && product.variants.length > 0
      ? product.variants.map((v) => ({
          label: v.name,
          multiplier: 1,
          discountRate: 0,
          priceDelta: v.priceDelta,
        }))
      : [
          { label: "1 pc", multiplier: 1, discountRate: 0 },
          { label: "2-Pack (-5%)", multiplier: 2, discountRate: 0.05 },
          { label: "3-Pack (-10%)", multiplier: 3, discountRate: 0.1 },
        ];

  const activePack = packOptions[selectedPackIndex] || packOptions[0];

  // Unit and bundle price calculation
  const unitPrice =
    activePack.priceDelta !== undefined
      ? product.price + activePack.priceDelta
      : Math.round(product.price * (1 - activePack.discountRate));

  const packTotalPrice = unitPrice * activePack.multiplier;
  const grandTotal = packTotalPrice * quantity;
  const totalItemUnits = activePack.multiplier * quantity;

  const displayImage = isHovered && product.sideImage ? product.sideImage : product.frontImage;

  const handleAdd = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);

    onAddToCart(
      {
        ...product,
        price: packTotalPrice,
      },
      quantity,
      activePack.label !== "1 pc" ? activePack.label : undefined
    );
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white rounded-xl border border-gray-200/80 overflow-hidden hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between group"
    >
      <div>
        {/* Uniform 4:5 Aspect Ratio Container with Neutral Backdrop */}
        <div className="aspect-[4/5] bg-gray-50/80 relative overflow-hidden flex items-center justify-center p-3">
          {/* Trust / Social Proof / Spec Badge */}
          {product.badge && (
            <div className="absolute top-2 left-2 z-10">
              <span
                className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs border backdrop-blur-xs ${getBadgeStyles(
                  product.badge
                )}`}
              >
                {!/^[\p{Emoji}\u2700-\u27BF\uE000-\uF8FF]/u.test(product.badge) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
                {product.badge}
              </span>
            </div>
          )}

          {/* Discount Badge */}
          {product.originalPrice && (
            <div className="absolute top-2 right-2 z-10 bg-rose-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}

          {/* Image with Hover Zoom powered by ImageKit Edge CDN */}
          <Image
            src={displayImage}
            alt={product.name}
            width={400}
            height={500}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="w-full h-full object-contain transition-all duration-300 transform group-hover:scale-105"
          />

          {/* Quick View Floating Action */}
          <button
            onClick={() => onQuickView(product)}
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/95 hover:bg-white text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-xs cursor-pointer"
          >
            Quick View
          </button>
        </div>

        {/* Content Details */}
        <div className="p-3.5 space-y-2">
          {/* Single Seller Brand Badge */}
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              JuroMart Direct
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">In Stock</span>
          </div>

          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Price Tag with dynamic pack calculation */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-gray-900">
              KSh {packTotalPrice.toLocaleString()}
            </span>
            {activePack.multiplier > 1 ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                (KSh {unitPrice.toLocaleString()}/ea)
              </span>
            ) : product.originalPrice ? (
              <span className="text-[11px] text-gray-400 line-through">
                KSh {product.originalPrice.toLocaleString()}
              </span>
            ) : null}
          </div>

          {/* Option A: Multi-Item Bundle / Pack Selector Pills */}
          <div className="pt-0.5">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              {product.variants && product.variants.length > 0 ? "Options / Config:" : "Pack Size & Savings:"}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {packOptions.map((pack, idx) => (
                <button
                  key={pack.label}
                  type="button"
                  onClick={() => setSelectedPackIndex(idx)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all whitespace-nowrap cursor-pointer ${
                    selectedPackIndex === idx
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  {pack.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Option C: Action Footer with Interactive Quantity Stepper */}
      <div className="px-3.5 pb-3.5 pt-1">
        <div className="flex items-center gap-2">
          {/* Quantity Stepper */}
          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/70 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Decrease quantity"
            >
              −
            </button>
            <span className="w-6 text-center text-xs font-bold text-gray-900 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="w-7 h-7 flex items-center justify-center text-xs font-bold text-gray-600 hover:bg-white rounded transition-colors cursor-pointer"
              title="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            onClick={handleAdd}
            className={`flex-1 font-bold py-2 px-2.5 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98] ${
              isAdded
                ? "bg-emerald-600 text-white ring-2 ring-emerald-500"
                : "bg-gray-900 hover:bg-emerald-600 text-white"
            }`}
          >
            {isAdded ? (
              <>
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span>Added!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="truncate">
                  {totalItemUnits > 1 ? `Add ${totalItemUnits} Items` : "Add to Cart"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
