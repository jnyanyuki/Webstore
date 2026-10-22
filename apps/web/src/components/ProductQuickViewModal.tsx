"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductItem } from "./DynamicProductCard";
import { useAuth } from "@/context/AuthContext";
import { getSellerUrl } from "@/lib/domainUrls";
import { getProductColorOptions, isLightColor, ProductColorOption } from "@/lib/productColors";

interface PackOption {
  label: string;
  multiplier: number;
  discountRate: number;
  priceDelta?: number;
}

export default function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (
    item: ProductItem,
    selectedOptions: { color?: string; size?: string; variant?: string; quantity?: number }
  ) => void;
}) {
  const { user } = useAuth();
  const [selectedColor, setSelectedColor] = useState<string>("Black");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [unitToggle, setUnitToggle] = useState<"cm" | "inch">("cm");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic authentic color options
  const colorOptions = React.useMemo(() => {
    return product ? getProductColorOptions(product) : [];
  }, [product]);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedColorImage, setSelectedColorImage] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveImageIndex(0);
    setQuantity(1);
    setSelectedPackIndex(0);
    setSelectedColorImage(null);
    if (product && colorOptions.length > 0) {
      const pName = product.name.toLowerCase();
      const matchedIdx = colorOptions.findIndex((c) => pName.includes(c.name.toLowerCase()));
      setSelectedColorIndex(matchedIdx !== -1 ? matchedIdx : 0);
    } else {
      setSelectedColorIndex(0);
    }
  }, [product?.id, product?.name, colorOptions]);

  if (!product) return null;

  // Multi-angle image extraction
  const allImages = [
    ...(product.images && product.images.length > 0
      ? product.images
      : product.gallery && product.gallery.length > 0
      ? product.gallery.map((g) => g.url)
      : [
          product.frontImage,
          ...(product.sideImage && product.sideImage !== product.frontImage
            ? [product.sideImage]
            : []),
        ]),
  ];

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

  const unitPrice =
    activePack.priceDelta !== undefined
      ? product.price + activePack.priceDelta
      : Math.round(product.price * (1 - activePack.discountRate));

  const packTotalPrice = unitPrice * activePack.multiplier;
  const grandTotal = packTotalPrice * quantity;
  const totalItemUnits = activePack.multiplier * quantity;

  const colors = product.colors || ["#111827", "#059669", "#2563EB", "#D97706"];
  const sizes = product.sizes || ["S", "M", "L", "XL"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden relative border border-gray-100 flex flex-col md:flex-row max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors cursor-pointer"
        >
          ✕
        </button>

        <div className="md:w-1/2 bg-gray-50/80 p-5 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-gray-200/60">
          {/* Main Showcase Image */}
          <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden rounded-xl bg-white border border-gray-200/70 p-4 select-none">
            <Image
              src={selectedColorImage || allImages[activeImageIndex] || product.frontImage}
              alt={`${product.name} - View ${activeImageIndex + 1}`}
              width={400}
              height={400}
              className="w-full h-full object-contain transition-all duration-300"
              priority
            />

            {/* Trust / Spec Badge */}
            {product.badge && (
              <div className="absolute top-3 left-3">
                <span className="bg-white/95 text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200 shadow-xs backdrop-blur-xs">
                  {product.badge}
                </span>
              </div>
            )}

            {/* Angle Indicator Counter */}
            {allImages.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {activeImageIndex + 1} / {allImages.length}
              </div>
            )}

            {/* Chevron Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))
                  }
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md border border-gray-200 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                  aria-label="Previous angle"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md border border-gray-200 flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
                  aria-label="Next angle"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Multi-Angle Interactive Thumbnail Dock */}
          {allImages.length > 1 && (
            <div className="mt-3">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Angles & Details ({allImages.length})</span>
                <span className="text-emerald-700 font-semibold lowercase">
                  {activeImageIndex === 0
                    ? "front view"
                    : activeImageIndex === 1
                    ? "side profile"
                    : `angle ${activeImageIndex + 1}`}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-14 h-14 rounded-lg border-2 overflow-hidden p-1 transition-all flex-shrink-0 bg-white cursor-pointer ${
                      activeImageIndex === idx
                        ? "border-emerald-600 ring-2 ring-emerald-500/30 scale-105 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={imgUrl}
                      alt={`Thumbnail angle ${idx + 1}`}
                      fill
                      className="object-contain p-0.5"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="md:w-1/2 p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                {product.category}
              </span>
              {product.sku && (
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {product.sku}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h2>

            {/* Stock & Fulfillment Badge */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                In Stock • Verified Genuine
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold">Ready for Dispatch</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 mt-2 mb-3">
              <span className="text-2xl font-black text-gray-900">
                KSh {packTotalPrice.toLocaleString()}
              </span>
              {activePack.multiplier > 1 ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  (KSh {unitPrice.toLocaleString()}/ea)
                </span>
              ) : product.baseMsrp && product.baseMsrp > product.price ? (
                <span className="text-sm text-gray-400 line-through">
                  MSRP: KSh {product.baseMsrp.toLocaleString()}
                </span>
              ) : null}
            </div>

            {product.description && (
              <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed mb-4">
                {product.description}
              </p>
            )}

            {/* Option A: Pack & Bundle Options Pills */}
            <div className="mb-4 pt-2 border-t border-gray-100">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {product.variants && product.variants.length > 0 ? "Options / Config:" : "Pack Size & Savings:"}
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {packOptions.map((pack, idx) => (
                  <button
                    key={pack.label}
                    type="button"
                    onClick={() => {
                      setSelectedPackIndex(idx);
                      const variant = packOptions[idx];
                      if (variant && colorOptions.length > 0) {
                        const vName = variant.label.toLowerCase();
                        const matchIdx = colorOptions.findIndex(
                          (c) =>
                            vName.includes(c.name.toLowerCase()) ||
                            c.name.toLowerCase().split(" ").some((w) => w.length > 3 && vName.includes(w))
                        );
                        if (matchIdx !== -1) {
                          setSelectedColorIndex(matchIdx);
                          if (colorOptions[matchIdx]?.image) {
                            setSelectedColorImage(colorOptions[matchIdx].image!);
                          }
                        }
                      }
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      selectedPackIndex === idx
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-700"
                    }`}
                  >
                    {pack.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Authentic Color & Finish Selection */}
            {colorOptions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100 mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <span>
                    Finish / Colour:{" "}
                    <span className="text-emerald-700 font-extrabold normal-case ml-1">
                      {colorOptions[selectedColorIndex]?.name}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal lowercase">
                    {colorOptions.length} available
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {colorOptions.map((opt, idx) => {
                    const isSelected = selectedColorIndex === idx;
                    const isLight = isLightColor(opt.hex);
                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => {
                          setSelectedColorIndex(idx);
                          if (opt.image) {
                            setSelectedColorImage(opt.image);
                          }
                          if (product.variants && product.variants.length > 0) {
                            const optNameLower = opt.name.toLowerCase();
                            const matchIdx = product.variants.findIndex((v) => {
                              const vName = v.name.toLowerCase();
                              return (
                                vName.includes(optNameLower) ||
                                optNameLower.split(" ").some((w) => w.length > 3 && vName.includes(w))
                              );
                            });
                            if (matchIdx !== -1) setSelectedPackIndex(matchIdx);
                          }
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-2 ring-emerald-500/30 shadow-xs"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex-shrink-0 shadow-2xs ${
                            isLight ? "border border-gray-300" : "border border-black/10"
                          }`}
                          style={{ background: opt.bgGradient || opt.hex }}
                        />
                        <span>{opt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.category === "Fashion" && (
              <div className="space-y-4 pt-2 border-t border-gray-100 mb-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Size: <span className="text-gray-500 font-normal">{selectedSize}</span>
                    </label>
                    <button
                      onClick={() => setShowSizeGuide(!showSizeGuide)}
                      className="text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      Size Guide ({unitToggle.toUpperCase()})
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                          selectedSize === s
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-emerald-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  {showSizeGuide && (
                    <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span>Size Chart</span>
                        <div className="flex gap-1 bg-white border rounded-lg p-0.5">
                          <button
                            onClick={() => setUnitToggle("cm")}
                            className={`px-2 py-0.5 rounded text-[10px] ${unitToggle === "cm" ? "bg-emerald-600 text-white font-bold" : "text-gray-600"}`}
                          >
                            CM
                          </button>
                          <button
                            onClick={() => setUnitToggle("inch")}
                            className={`px-2 py-0.5 rounded text-[10px] ${unitToggle === "inch" ? "bg-emerald-600 text-white font-bold" : "text-gray-600"}`}
                          >
                            INCH
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 text-center text-gray-600 font-mono text-[11px]">
                        <div>S: {unitToggle === "cm" ? "86 - 91 cm" : '34 - 36"'}</div>
                        <div>M: {unitToggle === "cm" ? "96 - 101 cm" : '38 - 40"'}</div>
                        <div>L: {unitToggle === "cm" ? "106 - 111 cm" : '42 - 44"'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Footer with Sticky Docking on Mobile & Enhanced Touch Targets */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-2 border-t border-gray-150 flex flex-col gap-2.5 mt-auto shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 shadow-2xs flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-base font-bold text-gray-700 hover:bg-white rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-bold text-gray-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-base font-bold text-gray-700 hover:bg-white rounded-lg transition-colors cursor-pointer active:scale-95"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onAddToCart(
                    {
                      ...product,
                      price: packTotalPrice,
                      frontImage: selectedColorImage || allImages[activeImageIndex] || product.frontImage,
                    },
                    {
                      color: colorOptions[selectedColorIndex]?.name || selectedColor,
                      size: product.category === "Fashion" ? selectedSize : undefined,
                      variant: activePack.label !== "1 pc" ? activePack.label : undefined,
                      quantity,
                    }
                  );
                  onClose();
                }}
                className="flex-1 bg-gray-900 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="truncate">
                  Add {totalItemUnits > 1 ? `${totalItemUnits} Items` : "to Cart"} • KSh{" "}
                  {grandTotal.toLocaleString()}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 px-0.5">
              <Link
                href={`/products/${product.id}`}
                onClick={onClose}
                className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
              >
                View Full Specifications & Warranty Details →
              </Link>
            </div>
          </div>

          {user?.role === "ADMIN" && (
            <div className="mt-3 pt-3 border-t border-amber-200/80 bg-amber-50 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                <span className="text-base">👑</span>
                <div>
                  <div>Super Admin Privilege</div>
                  <div className="text-[10px] text-amber-700 font-medium">Logged in as {user.email}</div>
                </div>
              </div>
              <a
                href={getSellerUrl("/seller")}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs rounded-lg transition-colors shadow-xs"
              >
                Open in Catalog Admin →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
