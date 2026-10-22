"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
  sizes?: string[];
  variants?: { name: string; priceDelta: number }[];
  attributes?: Record<string, any>;
};

function getBadgeStyles(badge: string) {
  if (badge.includes("🔥") || badge.includes("Only") || badge.includes("Trending") || badge.includes("Best Seller")) {
    return "bg-amber-50 text-amber-900 border-amber-200/90";
  }
  if (badge.includes("⭐") || badge.includes("Top Rated") || badge.includes("✨")) {
    return "bg-amber-50 text-amber-950 border-amber-200/90";
  }
  if (badge.includes("🛡️") || badge.includes("✓") || badge.includes("💎") || badge.includes("Warranty") || badge.includes("Genuine")) {
    return "bg-blue-50 text-blue-900 border-blue-200/90";
  }
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

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

  // Pack & Variant Options
  const packOptions: PackOption[] = React.useMemo(() => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.map((v) => ({
        label: v.name,
        multiplier: 1,
        discountRate: 0,
        priceDelta: v.priceDelta,
      }));
    }
    return [
      { label: "1 pc", multiplier: 1, discountRate: 0 },
      { label: "2-Pack (-5%)", multiplier: 2, discountRate: 0.05 },
      { label: "3-Pack (-10%)", multiplier: 3, discountRate: 0.1 },
    ];
  }, [product.variants]);

  const activePack = packOptions[selectedPackIndex] || packOptions[0];

  // Unit and bundle price calculation
  const unitPrice =
    activePack.priceDelta !== undefined
      ? product.price + activePack.priceDelta
      : Math.round(product.price * (1 - activePack.discountRate));

  const packTotalPrice = unitPrice * activePack.multiplier;
  const totalItemUnits = activePack.multiplier * quantity;

  const displayImage = allImages[activeImageIndex] || product.frontImage;

  const handleAdd = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/90 overflow-hidden hover:shadow-xl hover:border-emerald-400/80 transition-all duration-300 flex flex-col justify-between h-full group relative focus-within:ring-2 focus-within:ring-emerald-500/50">
      <div className="flex flex-col flex-1 justify-between">
        {/* Uniform 4:5 Aspect Ratio Container with Neutral Backdrop */}
        <div className="relative aspect-[4/5] w-full bg-gradient-to-b from-gray-50/90 to-gray-100/50 overflow-hidden flex items-center justify-center p-2 sm:p-3 select-none flex-shrink-0">
          {/* Main Product Link Wrapping Image Area */}
          <Link
            href={`/products/${product.id}`}
            className="absolute inset-0 z-0 flex items-center justify-center"
            title={`View details for ${product.name}`}
          >
            <Image
              src={displayImage}
              alt={product.name}
              width={400}
              height={500}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-105 pointer-events-none"
            />
          </Link>

          {/* Segmented Hover Indicator Bars (Desktop) */}
          {allImages.length > 1 && (
            <div className="absolute top-2 inset-x-2 sm:inset-x-3 z-20 hidden sm:flex gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              {allImages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    activeImageIndex === idx ? "bg-emerald-600 shadow-sm" : "bg-black/20"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Desktop Invisible Segmented Hover Zones across the image */}
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

          {/* Trust / Highlight Badge */}
          {product.badge && (
            <div className="absolute top-2 left-2 z-20 pointer-events-none max-w-[65%]">
              <span
                className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-xs border backdrop-blur-xs truncate ${getBadgeStyles(
                  product.badge
                )}`}
              >
                {!/^[\p{Emoji}\u2700-\u27BF\uE000-\uF8FF]/u.test(product.badge) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
                )}
                <span className="truncate">{product.badge}</span>
              </span>
            </div>
          )}

          {/* Discount Badge */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-2 right-2 z-20 bg-rose-600 text-white text-[11px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none">
              -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
            </div>
          )}

          {/* Mobile / Touch Pagination Dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 sm:hidden bg-black/45 backdrop-blur-xs px-2 py-1 rounded-full shadow-xs">
              {allImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                  }}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                    activeImageIndex === idx ? "bg-emerald-400 w-3.5" : "bg-white/60"
                  }`}
                  aria-label={`View angle ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Angle Counter Indicator */}
          {allImages.length > 1 && (
            <div className="absolute bottom-2 right-2 z-20 bg-black/60 backdrop-blur-xs text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md shadow-xs pointer-events-none">
              {activeImageIndex + 1}/{allImages.length}
            </div>
          )}

          {/* Previous / Next Angle Stepper Arrows on Hover (Desktop) */}
          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
                }}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 hover:bg-white text-gray-800 shadow-md border border-gray-200 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold cursor-pointer"
                aria-label="Previous image angle"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/95 hover:bg-white text-gray-800 shadow-md border border-gray-200 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold cursor-pointer"
                aria-label="Next image angle"
              >
                ›
              </button>
            </>
          )}

          {/* Desktop Floating Quick View Action */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-white/95 hover:bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md border border-gray-200 hidden sm:block opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 backdrop-blur-xs cursor-pointer whitespace-nowrap active:scale-95"
          >
            Quick View
          </button>

          {/* Mobile Quick View Icon Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            className="absolute bottom-2 left-2 z-20 sm:hidden bg-white/90 active:bg-white text-gray-800 p-1.5 rounded-full shadow-xs border border-gray-200 flex items-center justify-center cursor-pointer"
            aria-label="Quick view product details"
            title="Quick View"
          >
            <svg className="w-3.5 h-3.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* Content Details */}
        <div className="p-2.5 sm:p-3.5 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1 sm:space-y-1.5">
            {/* Stock & Category Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 gap-1">
              <span className="font-semibold text-gray-400 uppercase tracking-wider truncate max-w-[60%]">
                {product.category}
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 flex-shrink-0 text-[11px] sm:text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                In Stock
              </span>
            </div>

            {/* Product Title Linked to Details */}
            <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-snug line-clamp-2 min-h-[2.3rem] sm:min-h-[2.6rem]">
              <Link
                href={`/products/${product.id}`}
                className="hover:text-emerald-700 transition-colors focus-visible:outline-emerald-500"
              >
                {product.name}
              </Link>
            </h3>

            {/* Price Tag with dynamic pack calculation */}
            <div className="flex items-baseline flex-wrap gap-1 sm:gap-1.5 pt-0.5">
              <span className="text-sm sm:text-base md:text-lg font-black text-gray-900 tracking-tight leading-none">
                KSh {packTotalPrice.toLocaleString()}
              </span>
              {activePack.multiplier > 1 ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  (KSh {unitPrice.toLocaleString()}/ea)
                </span>
              ) : product.originalPrice && product.originalPrice > product.price ? (
                <span className="text-xs text-gray-400 line-through">
                  KSh {product.originalPrice.toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>

          {/* Pack Options & Savings Selector */}
          <div className="pt-1">
            <div className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>{product.variants && product.variants.length > 0 ? "Options:" : "Pack Size & Savings:"}</span>
              {activePack.discountRate > 0 && (
                <span className="text-emerald-700 font-bold lowercase">
                  save {Math.round(activePack.discountRate * 100)}%
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 -mx-0.5 px-0.5">
              {packOptions.map((pack, idx) => (
                <button
                  key={pack.label}
                  type="button"
                  onClick={() => setSelectedPackIndex(idx)}
                  className={`text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md border transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
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

      {/* Action Footer with Stepper and Add to Cart CTA */}
      <div className="px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 pt-2 border-t border-gray-100/90 bg-gray-50/40">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Interactive Quantity Stepper */}
          <div className="flex items-center border border-gray-200 rounded-lg sm:rounded-xl bg-white p-0.5 shadow-2xs flex-shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-5 sm:w-6 text-center text-xs sm:text-sm font-bold text-gray-900 select-none">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer active:scale-95"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          {/* Add to Cart CTA Button */}
          <button
            type="button"
            onClick={handleAdd}
            className={`flex-1 min-w-0 font-bold py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs cursor-pointer active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-emerald-500 outline-none ${
              isAdded
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md scale-[1.01]"
                : "bg-gray-900 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm hover:shadow-md"
            }`}
            title={`Add ${product.name} to cart`}
          >
            {isAdded ? (
              <>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white flex-shrink-0 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                <span className="truncate">Added!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="truncate font-bold tracking-tight">
                  {totalItemUnits > 1 ? (
                    `Add ${totalItemUnits}`
                  ) : (
                    <>
                      <span className="hidden min-[380px]:inline">Add to Cart</span>
                      <span className="min-[380px]:hidden">Add</span>
                    </>
                  )}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
