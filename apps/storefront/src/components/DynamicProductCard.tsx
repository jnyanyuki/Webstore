"use client";

import React, { useState } from "react";
import Image from "next/image";

export type ProductItem = {
  id: string;
  name: string;
  category: "Electronics" | "Fashion" | "Home & Appliances" | "Groceries";
  price: number;
  originalPrice?: number;
  frontImage: string;
  sideImage?: string;
  merchantStall: string;
  badge: "Ready for Pickup" | "45-Min Boda Dispatch" | "Verified CBD Merchant";
  colors?: string[];
  sizes?: string[];
  variants?: { name: string; priceDelta: number }[];
};

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
      className="bg-white rounded-2xl border border-gray-200/70 overflow-hidden hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        {/* Uniform 4:5 Aspect Ratio Container with Neutral Backdrop */}
        <div className="aspect-[4/5] bg-gray-50/80 relative overflow-hidden flex items-center justify-center p-4">
          {/* Trust Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 bg-white/95 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm border border-emerald-100 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {product.badge}
            </span>
          </div>

          {/* Discount Badge */}
          {product.originalPrice && (
            <div className="absolute top-3 right-3 z-10 bg-rose-600 text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}

          {/* Image with Secondary Angle Hover Reveal */}
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-contain transition-all duration-500 transform group-hover:scale-105"
          />

          {/* Quick View Floating Action */}
          <button
            onClick={() => onQuickView(product)}
            className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white text-gray-900 text-xs font-bold px-4 py-2 rounded-xl shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          >
            Quick View & Options
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span className="font-semibold text-emerald-700">{product.category}</span>
            <span className="text-[11px] text-gray-400 font-mono">{product.merchantStall}</span>
          </div>

          <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          {/* Price Tag */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-xl font-black text-gray-900">
              KSh {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                KSh {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 pb-5 pt-0">
        <button
          onClick={() => onAddToCart(product)}
          className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.98]"
        >
          <svg
            className="w-4 h-4"
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
