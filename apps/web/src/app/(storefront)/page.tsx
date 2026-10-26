"use client";

import React, { useState } from "react";
import DynamicProductCard, { ProductItem } from "../../components/DynamicProductCard";
import ProductQuickViewModal from "../../components/ProductQuickViewModal";
import QuickSearchModal, { SearchItem } from "../../components/QuickSearchModal";
import MegaMenu from "../../components/MegaMenu";
import WhatsAppWidget from "../../components/WhatsAppWidget";
import PwaInstallPrompt from "../../components/PwaInstallPrompt";
import JuroMartLogo from "../../components/JuroMartLogo";
import UserNavDropdown from "../../components/UserNavDropdown";
import { useProductCatalog } from "@/context/ProductCatalogContext";
import { useCart } from "@/context/CartContext";

export default function StorefrontHome() {
  const { products } = useProductCatalog();
  const {
    cartItems,
    setIsCartSheetOpen,
    addToCart,
    totalCartCount,
  } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  const handleAddToCart = (
    product: ProductItem,
    quantityToAdd: number = 1,
    selectedVariant?: string,
    selectedColor?: string
  ) => {
    addToCart(product, quantityToAdd, selectedVariant, selectedColor);
  };

  const filteredProducts = selectedCategoryFilter
    ? products.filter((p) => {
        const q = selectedCategoryFilter.toLowerCase();
        if (q === "🔥 best sellers") return p.badge?.toLowerCase().includes("best seller");
        if (q === "⭐ top rated") return p.badge?.toLowerCase().includes("top rated");
        if (q === "🛡️ official warranty") {
          return p.badge?.toLowerCase().includes("warranty") || p.badge?.toLowerCase().includes("genuine");
        }
        return (
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.itemType && p.itemType.toLowerCase().includes(q)) ||
          p.name.toLowerCase().includes(q) ||
          (p.badge && p.badge.toLowerCase().includes(q))
        );
      })
    : products;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#111827] font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Compact Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <JuroMartLogo size="sm" />
            <span className="hidden sm:inline-block text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Express Delivery
            </span>
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
            <UserNavDropdown />

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
              className="relative bg-gray-900 hover:bg-[#004f98] text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              aria-label="View shopping cart"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="bg-[#004f98] text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs transition-transform animate-in zoom-in duration-200">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <MegaMenu onSelectCategory={(cat) => setSelectedCategoryFilter(cat)} />

      {/* 2. Compact Location-Neutral Marketplace Hero */}
      <main className="max-w-[1600px] mx-auto px-2.5 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-[#071d18] border border-emerald-900/40 p-6 md:p-10 text-white shadow-xl">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Main Value Proposition */}
            <div className="lg:col-span-7 space-y-5">
              {/* Value badges row */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-300 font-medium">
                <span className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/40 px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Sellers
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/40 px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Instant Local &amp; Nationwide Delivery
                </span>
                <span className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/40 px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Guaranteed Authentic
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Authentic Gear.{" "}
                <span className="text-emerald-400">
                  Instant Dispatch &amp; Doorstep Delivery.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
                Shop electronics, fashion, and everyday essentials from verified merchants. Enjoy fast doorstep fulfillment with secure, instant checkout.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setSelectedCategoryFilter(null);
                    const catalogEl = document.getElementById("catalog-section");
                    if (catalogEl) {
                      catalogEl.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-gray-950 font-semibold px-6 py-3 rounded-xl transition duration-150 shadow-md hover:shadow-emerald-500/20 cursor-pointer text-xs sm:text-sm"
                >
                  <span>Explore Full Catalog</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <button
                  onClick={() => setIsCartSheetOpen(true)}
                  className="text-sm font-medium text-emerald-300/80 hover:text-emerald-200 underline underline-offset-4 transition cursor-pointer"
                >
                  View Delivery Options →
                </button>
              </div>
            </div>

            {/* Clean Compact Radar Card (Zero Truncation) */}
            <div className="lg:col-span-5">
              <div className="bg-[#0b2821]/80 backdrop-blur-md border border-emerald-800/40 rounded-xl p-5 shadow-inner">
                <div className="flex items-center justify-between border-b border-emerald-800/50 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold tracking-wider text-emerald-200 uppercase">
                      Fulfillment Radar
                    </span>
                  </div>
                  <span className="text-[11px] bg-emerald-900/60 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-700/30">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#061814]/60 p-3 rounded-lg border border-emerald-900/40">
                    <span className="text-gray-400 block mb-1">Dispatch Speed</span>
                    <span className="text-gray-100 font-medium">Sub-45m &amp; 24–48h</span>
                  </div>

                  <div className="bg-[#061814]/60 p-3 rounded-lg border border-emerald-900/40">
                    <span className="text-gray-400 block mb-1">Payment Options</span>
                    <span className="text-gray-100 font-medium">M-Pesa, Cards, Wallets</span>
                  </div>

                  <div className="bg-[#061814]/60 p-3 rounded-lg border border-emerald-900/40">
                    <span className="text-gray-400 block mb-1">Coverage</span>
                    <span className="text-gray-100 font-medium">Doorstep &amp; Pickups</span>
                  </div>

                  <div className="bg-[#061814]/60 p-3 rounded-lg border border-emerald-900/40">
                    <span className="text-gray-400 block mb-1">Buyer Shield</span>
                    <span className="text-gray-100 font-medium">100% Genuine Policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Category Section & Compact Filter Bar */}
        <div id="catalog-section" className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] font-extrabold text-gray-900 tracking-tight">
                {selectedCategoryFilter ? `${selectedCategoryFilter} Catalog` : "Featured Verified Catalog"}
              </h2>
              <p className="text-[clamp(0.6875rem,0.65rem+0.15vw,0.75rem)] text-gray-500">
                Verified merchant inventory with instant city dispatch &amp; nationwide delivery
              </p>
            </div>
            {selectedCategoryFilter && (
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1.5 scrollbar-none border-b border-gray-200/60 pb-3">
            {[
              "All",
              "Phones & Tablets",
              "Computers & Gaming",
              "TVs, Audio & Vision",
              "Home Appliances",
              "Solar & Power Backup",
              "Men's Fashion & Shoes",
              "Women's Fashion & Bags",
              "Watches, Jewelry & Optics",
              "Home, Furniture & Living",
              "Beauty Tools & Personal Care",
              "Automotive & Tools",
              "Baby Gear, Nursery & Toys",
              "Security, Smart Home & Travel",
              "Office, Stationery & Music",
              "Sports, Fitness & Outdoors",
              "🔥 Best Sellers",
              "⭐ Top Rated",
              "🛡️ Official Warranty",
            ].map((pill) => (
              <button
                key={pill}
                onClick={() => setSelectedCategoryFilter(pill === "All" ? null : pill)}
                className={`whitespace-nowrap px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[clamp(0.6875rem,0.64rem+0.2vw,0.75rem)] font-bold transition-all border cursor-pointer ${
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

        {/* 4. High-Density Aspect Ratio Product Grid with Maximum Horizontal & Vertical Consumption */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-3.5 md:gap-4 lg:gap-5">
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
          const matched = products.find((p) => p.id === item.id) || {
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
        onAddToCart={(p, options) => {
          handleAddToCart(p, options.quantity || 1, options.variant, options.color);
        }}
      />
    </div>
  );
}
