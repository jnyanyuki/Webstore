"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ProductItem } from "./DynamicProductCard";
import { useCart } from "@/context/CartContext";
import MpesaCheckout from "./MpesaCheckout";

interface PackOption {
  label: string;
  multiplier: number;
  discountRate: number;
  priceDelta?: number;
}

export default function ProductDetailCta({ product }: { product: ProductItem }) {
  const { addToCart, setIsCartSheetOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [showMpesaForm, setShowMpesaForm] = useState(false);

  // Multi-item Pack & Variant Options
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
  const grandTotal = packTotalPrice * quantity;
  const totalItemUnits = activePack.multiplier * quantity;

  const handleAddToCart = () => {
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);

    addToCart(
      {
        ...product,
        price: packTotalPrice,
      },
      quantity,
      activePack.label !== "1 pc" ? activePack.label : undefined
    );
  };

  const handleBuyNow = () => {
    setShowMpesaForm(true);
    const mpesaSection = document.getElementById("pdp-mpesa-section");
    if (mpesaSection) {
      mpesaSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Pack Size & Quantity Row */}
      <div className="space-y-3 pt-2">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            <span>{product.variants && product.variants.length > 0 ? "Selected Configuration:" : "Pack Size & Savings:"}</span>
            {activePack.discountRate > 0 && (
              <span className="text-emerald-700 font-bold lowercase bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                save {Math.round(activePack.discountRate * 100)}%
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {packOptions.map((pack, idx) => (
              <button
                key={pack.label}
                type="button"
                onClick={() => setSelectedPackIndex(idx)}
                className={`text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer active:scale-95 ${
                  selectedPackIndex === idx
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-700"
                }`}
              >
                {pack.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Stepper & Price Summary */}
        <div className="flex items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Quantity:</span>
            <div className="flex items-center border border-gray-200 rounded-xl bg-white p-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
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
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer active:scale-95"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] text-gray-500 font-semibold">Total Price</div>
            <div className="text-lg sm:text-xl font-black text-gray-900 leading-tight">
              KES {grandTotal.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <button
          type="button"
          onClick={handleAddToCart}
          className={`font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            isAdded
              ? "bg-emerald-600 text-white ring-2 ring-emerald-400 shadow-md"
              : "bg-gray-900 hover:bg-emerald-600 active:bg-emerald-700 text-white shadow-sm hover:shadow-md"
          }`}
        >
          {isAdded ? (
            <>
              <svg className="w-4 h-4 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <span>Added to Cart!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span>Add {totalItemUnits > 1 ? `${totalItemUnits} Items` : "to Cart"}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleBuyNow}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-emerald-400"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span>Buy Now via M-Pesa</span>
        </button>
      </div>

      {/* M-Pesa Checkout Section */}
      <div id="pdp-mpesa-section" className="pt-3 border-t border-gray-100">
        <MpesaCheckout amount={grandTotal} cartId={`pdp_${product.id}_${activePack.label}`} />
      </div>

      {/* Sticky Mobile Purchase Dock (< md viewports) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 px-3.5 pt-2.5 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-transform">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="relative w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden flex-shrink-0">
              <Image
                src={product.frontImage}
                alt={product.name}
                fill
                className="object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-gray-500 truncate">
                {product.name}
              </div>
              <div className="text-sm font-black text-emerald-700 leading-tight">
                KES {grandTotal.toLocaleString()}
                {activePack.multiplier > 1 && (
                  <span className="text-[10px] font-normal text-gray-500 ml-1">
                    ({totalItemUnits} pcs)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                isAdded
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-900 hover:bg-emerald-600 text-white"
              }`}
            >
              {isAdded ? "✓ Added!" : "+ Cart"}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2 px-3 rounded-lg text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            >
              ⚡ Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
