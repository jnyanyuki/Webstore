"use client";

import React, { useState } from "react";
import { ProductItem } from "./DynamicProductCard";

export default function ProductQuickViewModal({
  product,
  onClose,
  onAddToCart,
}: {
  product: ProductItem | null;
  onClose: () => void;
  onAddToCart: (item: ProductItem, selectedOptions: { color?: string; size?: string; variant?: string }) => void;
}) {
  const [selectedColor, setSelectedColor] = useState<string>("Black");
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [unitToggle, setUnitToggle] = useState<"cm" | "inch">("cm");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const [selectedVariant, setSelectedVariant] = useState<{ name: string; priceDelta: number }>(
    product?.variants?.[0] || { name: "256GB", priceDelta: 0 }
  );

  if (!product) return null;

  const calculatedPrice = product.price + (selectedVariant?.priceDelta || 0);

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
          <img
            src={product.frontImage}
            alt={product.name}
            className="max-h-72 object-contain rounded-xl"
          />
          <div className="absolute bottom-4 left-4">
            <span className="bg-white text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 shadow-sm">
              {product.badge}
            </span>
          </div>
        </div>

        <div className="md:w-1/2 p-6 overflow-y-auto space-y-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
              {product.category} • {product.merchantStall}
            </div>
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
              {product.name}
            </h2>

            <div className="flex items-baseline gap-2 mt-3 mb-4">
              <span className="text-2xl font-black text-gray-900">
                KSh {calculatedPrice.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  KSh {(product.originalPrice + (selectedVariant?.priceDelta || 0)).toLocaleString()}
                </span>
              )}
            </div>

            {product.category === "Fashion" && (
              <div className="space-y-4 pt-2 border-t border-gray-100">
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

            {product.category === "Electronics" && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Storage Variant:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(product.variants || [
                    { name: "128GB", priceDelta: 0 },
                    { name: "256GB (+KES 4,500)", priceDelta: 4500 },
                    { name: "512GB (+KES 12,000)", priceDelta: 12000 },
                  ]).map((v) => (
                    <button
                      key={v.name}
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                        selectedVariant?.name === v.name
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600"
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-800"
                      }`}
                    >
                      <span className="font-bold text-xs">{v.name}</span>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {v.priceDelta > 0 ? `+KES ${v.priceDelta.toLocaleString()}` : "Included"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              onAddToCart(
                { ...product, price: calculatedPrice },
                { color: selectedColor, size: selectedSize, variant: selectedVariant?.name }
              );
              onClose();
            }}
            className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
          >
            Add to Cart • KSh {calculatedPrice.toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}
