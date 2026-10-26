"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ProductColorOption } from "@/lib/productColors";

export type ProductImageAngle = {
  url: string;
  label?: string;
};

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
  images?: string[];
  gallery?: ProductImageAngle[];
  merchantStall?: string;
  badge?: string;
  description?: string;
  generation?: string;
  lineage?: string[];
  sku?: string;
  baseMsrp?: number;
  releaseYear?: number;
  colors?: string[];
  colorOptions?: ProductColorOption[];
  sizes?: string[];
  variants?: { name: string; priceDelta: number }[];
  attributes?: Record<string, any>;
};

export default function DynamicProductCard({
  product,
  onAddToCart,
  onQuickView,
}: {
  product: ProductItem;
  onAddToCart?: (p: ProductItem, quantity?: number, variant?: string, color?: string) => void;
  onQuickView: (p: ProductItem) => void;
}) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Cart quantity tracking for this product
  const cartItem = cartItems.find((item) => item.id === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const inCart = cartQuantity > 0;

  // Multi-angle image extraction
  const allImages = React.useMemo(() => {
    if (product.images && product.images.length > 0) return product.images;
    if (product.gallery && product.gallery.length > 0) return product.gallery.map((g) => g.url);
    const list = [product.frontImage];
    if (product.sideImage && product.sideImage !== product.frontImage) {
      list.push(product.sideImage);
    }
    return list;
  }, [product]);

  const displayImage = allImages[activeImageIndex] || product.frontImage;

  // Discount percentage calculation
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleAdd = () => {
    addToCart(product, 1, undefined, undefined, false);
  };

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(cartItem.cartKey || cartItem.id, 1);
    } else {
      handleAdd();
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      updateQuantity(cartItem.cartKey || cartItem.id, -1);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/90 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 flex flex-col justify-between h-full group relative">
      {/* 1. Image Container with Top-Left Promo Badge */}
      <div className="relative aspect-square w-full bg-white flex items-center justify-center p-3 select-none flex-shrink-0">
        {/* Top-Left Red Promotional / Discount Badge */}
        {(discountPercent > 0 || product.badge) && (
          <div className="absolute top-2 left-2 z-20 pointer-events-none max-w-[85%]">
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs bg-[#d92328] text-white tracking-tight">
              {discountPercent > 0 ? (
                <>
                  {product.badge?.includes("Best Seller") || product.badge?.includes("Lowest Price") ? (
                    <span>🔥 Lowest Price {discountPercent}% OFF</span>
                  ) : (
                    <span>{discountPercent}% OFF</span>
                  )}
                </>
              ) : (
                <span>{product.badge}</span>
              )}
            </span>
          </div>
        )}

        {/* Product Link & Image */}
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0 z-0 flex items-center justify-center p-3"
          title={`View details for ${product.name}`}
        >
          <Image
            src={displayImage}
            alt={product.name}
            width={320}
            height={320}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 pointer-events-none"
          />
        </Link>

        {/* Segmented Image Indicator Bars (Desktop Hover) */}
        {allImages.length > 1 && (
          <div className="absolute top-1.5 inset-x-2 z-20 hidden sm:flex gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            {allImages.map((_, idx) => (
              <div
                key={idx}
                className={`h-0.5 flex-1 rounded-full transition-all ${
                  activeImageIndex === idx ? "bg-[#004f98] shadow-xs" : "bg-black/15"
                }`}
              />
            ))}
          </div>
        )}

        {/* Segmented Hover Zones for Multi-Angle */}
        {allImages.length > 1 && (
          <div className="absolute inset-0 hidden sm:flex z-10 pointer-events-auto">
            {allImages.map((_, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setActiveImageIndex(idx)}
                className="flex-1 h-full cursor-pointer"
                title={`Preview angle ${idx + 1} of ${allImages.length}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. Action Controls Row: Plain listing before adding (...) and [+] vs In Basket [- qty +] */}
      <div className="px-3 pt-1 pb-1.5">
        {inCart ? (
          /* State B: In Basket - Full-width solid royal blue stepper bar */
          <div className="w-full bg-[#004f98] text-white rounded-lg flex items-center justify-between h-8 px-1.5 shadow-xs transition-all">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDecrement();
              }}
              className="w-7 h-7 rounded flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
              </svg>
            </button>
            <span className="text-sm font-black select-none text-white px-2">
              {cartQuantity}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleIncrement();
              }}
              className="w-7 h-7 rounded flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-colors cursor-pointer"
              aria-label="Increase quantity"
            >
              <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        ) : (
          /* State A: Before Adding - Three dots on left, Royal Blue plus on right */
          <div className="flex items-center justify-between h-8">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Product options & quick view"
              aria-label="Product options"
            >
              <span className="text-xl font-bold tracking-widest leading-none pb-2 select-none">...</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAdd();
              }}
              className="w-8 h-8 rounded-lg bg-[#004f98] hover:bg-[#003d75] active:scale-90 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer"
              title={`Add ${product.name} to basket`}
              aria-label={`Add ${product.name} to basket`}
            >
              <svg className="w-4 h-4 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 3. Product Details */}
      <div className="px-3 pb-3 pt-0.5 space-y-1 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Promo countdown line if discounted or special badge */}
          {(discountPercent > 0 || (product.badge && product.badge.includes("Deal"))) && (
            <div className="text-[11px] font-bold text-[#d92328]">
              Ends in 5 days
            </div>
          )}

          {/* Product Title */}
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.3rem]">
            <Link
              href={`/products/${product.id}`}
              className="hover:text-[#004f98] transition-colors focus-visible:outline-[#004f98]"
            >
              {product.name}
            </Link>
          </h3>

          {/* Price Section */}
          <div className="flex items-baseline flex-wrap gap-1.5 pt-0.5">
            <span className="text-sm sm:text-base md:text-lg font-black text-gray-900 tracking-tight leading-none">
              KES {product.price.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Stock Notice */}
          <div className="text-[11px] text-gray-400 font-medium pt-0.5">
            {product.badge?.includes("Only") ? (
              <span className="text-amber-700 italic font-semibold">{product.badge}</span>
            ) : inCart ? (
              <span className="text-gray-500 italic">Only 4 left</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
