"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";

export default function CartToast() {
  const { lastAddedItem, clearLastAddedItem, setIsCartSheetOpen, totalCartCount } = useCart();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastAddedItem) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        clearLastAddedItem();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [lastAddedItem, clearLastAddedItem]);

  if (!visible || !lastAddedItem) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto bg-gray-900/95 text-white p-3 rounded-2xl shadow-2xl border border-gray-700/60 backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-white p-0.5 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
          <Image
            src={lastAddedItem.frontImage}
            alt={lastAddedItem.name}
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Added to Basket</span>
          </div>
          <p className="text-xs font-semibold text-gray-200 truncate max-w-[160px] sm:max-w-[200px]">
            {lastAddedItem.name}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            clearLastAddedItem();
            setIsCartSheetOpen(true);
          }}
          className="bg-[#004f98] hover:bg-[#003d75] active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap"
        >
          View Basket ({totalCartCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setVisible(false);
            clearLastAddedItem();
          }}
          className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
