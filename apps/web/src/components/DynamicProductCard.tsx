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

export default function DynamicProductCard({
  product,
  onAddToCart,
  onQuickView,
}: {
  product: ProductItem;
  onAddToCart: (p: ProductItem) => void;
  onQuickView: (p: ProductItem) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const displayImage = isHovered && product.sideImage ? product.sideImage : product.frontImage;

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
            className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-white/95 hover:bg-white text-gray-900 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-xs"
          >
            Quick View
          </button>
        </div>

        {/* Content Details */}
        <div className="p-3.5">
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-0.5">
            <span className="font-medium text-emerald-700">{product.category}</span>
            <span className="text-[10px] text-emerald-600 font-medium">In Stock</span>
          </div>

          <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Price Tag */}
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="text-base font-bold text-gray-900">
              KSh {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] text-gray-400 line-through">
                KSh {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-3.5 pb-3.5 pt-0">
        <button
          onClick={() => onAddToCart(product)}
          className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Add to Cart
        </button>
      </div>
    </div>
  );
}
