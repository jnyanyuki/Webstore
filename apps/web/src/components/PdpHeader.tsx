"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function PdpHeader() {
  const { setIsCartSheetOpen, totalCartCount } = useCart();

  return (
    <header className="bg-white border-b border-gray-100 py-3.5 px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <Link
          href="/"
          className="text-emerald-700 hover:text-emerald-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-colors group"
        >
          <span className="text-base transition-transform group-hover:-translate-x-0.5">←</span>
          <span>Back to Storefront</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold px-2.5 py-1 rounded-full items-center gap-1">
            ✓ 100% Verified Authentic
          </span>

          <button
            type="button"
            onClick={() => setIsCartSheetOpen(true)}
            className="relative bg-gray-900 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            aria-label="View shopping cart"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="hidden min-[400px]:inline">Cart</span>
            {totalCartCount > 0 && (
              <span className="bg-emerald-500 text-white text-[9px] font-extrabold min-w-4 h-4 px-1 rounded-full flex items-center justify-center animate-pulse">
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
