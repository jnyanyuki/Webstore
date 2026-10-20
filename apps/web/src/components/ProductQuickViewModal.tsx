"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductItem } from "./DynamicProductCard";

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
  const [selectedColor, setSelectedColor] = useState<string>("Black");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [unitToggle, setUnitToggle] = useState<"cm" | "inch">("cm");
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);

  const [selectedVariant, setSelectedVariant] = useState<{ name: string; priceDelta: number }>(
    product?.variants?.[0] || { name: "256GB", priceDelta: 0 }
  );

  if (!product) return null;

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
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
        >
          ✕
        </button>

        <div className="md:w-1/2 bg-gray-50/80 p-6 flex items-center justify-center relative border-b md:border-b-0 md:border-r border-gray-200/60">
          <Image
            src={product.frontImage}
            alt={product.name}
            width={400}
            height={400}
            className="max-h-72 object-contain rounded-xl"
          />
          <div className="absolute bottom-4 left-4">
            <span className="bg-white/95 text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full border border-gray-200 shadow-sm backdrop-blur-xs">
              {product.badge}
            </span>
          </div>
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

            {/* Single Seller Brand Badge */}
            <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                JuroMart Direct • Verified Stock
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
              ) : product.baseMsrp ? (
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
                    onClick={() => setSelectedPackIndex(idx)}
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

            {product.lineage && product.lineage.length > 0 && (() => {
              const lineageList = product.lineage;
              return (
                <div className="mb-4 p-3 bg-slate-900 rounded-xl text-white border border-slate-800">
                  <div className="flex items-center justify-between text-[11px] mb-2 font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span>🧬</span> Product Lineup Lineage
                    </span>
                    {product.generation && (
                      <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded font-mono">
                        {product.generation}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto py-1 scrollbar-none">
                    {lineageList.map((item, idx) => {
                      const isLast = idx === lineageList.length - 1;
                      return (
                        <React.Fragment key={idx}>
                          <span
                            className={`whitespace-nowrap px-2 py-0.5 rounded text-[10px] ${
                              isLast
                                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {item}
                          </span>
                          {!isLast && <span className="text-slate-600 text-[10px]">→</span>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {product.category === "Fashion" && (
              <div className="space-y-4 pt-2 border-t border-gray-100 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Color: <span className="text-gray-500 font-normal">{selectedColor}</span>
                  </label>
                  <div className="flex items-center gap-2.5">
                    {colors.map((hex, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(`Option ${idx + 1}`)}
                        style={{ backgroundColor: hex }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          selectedColor === `Option ${idx + 1}`
                            ? "ring-2 ring-emerald-600 ring-offset-2 scale-110"
                            : "border-transparent hover:scale-105"
                        }`}
                      ></button>
                    ))}
                  </div>
                </div>

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

          {/* Option C: Action Footer with Quantity Stepper and Add to Cart */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
            <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-9 h-9 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Decrease quantity"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-bold text-gray-900 select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                className="w-9 h-9 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                title="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                onAddToCart(
                  { ...product, price: packTotalPrice },
                  {
                    color: selectedColor,
                    size: selectedSize,
                    variant: activePack.label !== "1 pc" ? activePack.label : undefined,
                    quantity,
                  }
                );
                onClose();
              }}
              className="flex-1 bg-gray-900 hover:bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>
                Add {totalItemUnits > 1 ? `${totalItemUnits} Items` : "to Cart"} • KSh{" "}
                {grandTotal.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
