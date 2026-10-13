"use client";

import React, { useState } from "react";
import DynamicProductCard, { ProductItem } from "../../components/DynamicProductCard";
import ProductQuickViewModal from "../../components/ProductQuickViewModal";
import SlideOverCartSheet from "../../components/SlideOverCartSheet";
import QuickSearchModal, { SearchItem } from "../../components/QuickSearchModal";
import MegaMenu from "../../components/MegaMenu";
import WhatsAppWidget from "../../components/WhatsAppWidget";
import PwaInstallPrompt from "../../components/PwaInstallPrompt";
import { INITIAL_PRODUCTS } from "../../data/products";


export default function StorefrontHome() {
  const [cartItems, setCartItems] = useState<(ProductItem & { quantity: number })[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const handleAddToCart = (product: ProductItem) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartSheetOpen(true);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const filteredProducts = selectedCategoryFilter
    ? INITIAL_PRODUCTS.filter(
        (p) =>
          p.category.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(selectedCategoryFilter.toLowerCase())) ||
          (p.itemType && p.itemType.toLowerCase().includes(selectedCategoryFilter.toLowerCase())) ||
          p.name.toLowerCase().includes(selectedCategoryFilter.toLowerCase()) ||
          p.badge.toLowerCase().includes(selectedCategoryFilter.toLowerCase())
      )
    : INITIAL_PRODUCTS;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#111827] font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Compact Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-xs">
              J
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-gray-900">
                JuroMart<span className="text-emerald-600">.</span>
              </span>
              <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                45-Min Boda
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-sm hidden sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full bg-gray-100/80 hover:bg-gray-200/60 text-gray-500 text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200/80 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2 group-hover:text-gray-900 truncate">
                <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search electronics, fashion, products...
              </span>
              <kbd className="bg-white text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-mono border border-gray-200">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/seller"
              className="text-xs font-semibold text-gray-700 hover:text-emerald-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              Merchant Portal
            </a>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden text-gray-600 hover:text-emerald-600 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={() => setIsCartSheetOpen(true)}
              className="relative bg-gray-900 hover:bg-emerald-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Cart</span>
              {cartItems.length > 0 && (
                <span className="bg-emerald-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MegaMenu onSelectCategory={(cat) => setSelectedCategoryFilter(cat)} />

      {/* 2. Compact Main Container & Refined Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        <div className="bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden border border-emerald-900/40">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-wider border border-emerald-500/30 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              JUROMART EXPRESS MARKETPLACE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              Instant CBD Pickup &amp; Boda Dispatch.
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm font-normal leading-relaxed">
              Discover verified catalog items across Nairobi CBD with instant delivery or pickup. Paid seamlessly via M-Pesa STK Push.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-xs active:scale-95"
              >
                Explore Full Catalog
              </button>
              <div className="flex items-center gap-1.5 text-xs font-medium bg-white/10 px-3 py-2 rounded-lg border border-white/10 backdrop-blur-xs">
                <span>⚡ Sub-45 Min Boda Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Category Section & Compact Filter Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {selectedCategoryFilter ? `${selectedCategoryFilter} Catalog` : "Featured CBD Catalog"}
              </h2>
              <p className="text-[11px] text-gray-500">
                Verified merchant inventory across Nairobi Central Business District
              </p>
            </div>
            {selectedCategoryFilter && (
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none border-b border-gray-200/60 pb-3">
            {[
              "All",
              "Phones & Tablets",
              "Computers & Gaming",
              "TVs, Audio & Vision",
              "Home Appliances",
              "Solar & Power Backup",
              "Men's Fashion & Shoes",
              "Ready for Pickup",
              "45-Min Boda Dispatch",
            ].map((pill) => (
              <button
                key={pill}
                onClick={() => setSelectedCategoryFilter(pill === "All" ? null : pill)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                  (pill === "All" && !selectedCategoryFilter) || selectedCategoryFilter === pill
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-600 hover:text-emerald-700"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* 4. High-Density Aspect Ratio Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {filteredProducts.map((product) => (
            <DynamicProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>

        <PwaInstallPrompt />
      </main>

      <WhatsAppWidget />

      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(item) => {
          const matched = INITIAL_PRODUCTS.find((p) => p.id === item.id) || {
            id: item.id,
            name: item.name,
            category: item.category as any,
            price: item.price,
            frontImage: item.image,
            merchantStall: "CBD Stall",
            badge: "Ready for Pickup" as const,
          };
          setQuickViewProduct(matched);
        }}
      />

      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p) => handleAddToCart(p)}
      />

      <SlideOverCartSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCartItems([])}
      />
    </div>
  );
}
