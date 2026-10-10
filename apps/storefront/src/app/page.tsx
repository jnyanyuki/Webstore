"use client";

import React, { useState } from "react";
import DynamicProductCard, { ProductItem } from "../components/DynamicProductCard";
import ProductQuickViewModal from "../components/ProductQuickViewModal";
import SlideOverCartSheet from "../components/SlideOverCartSheet";
import QuickSearchModal, { SearchItem } from "../components/QuickSearchModal";
import MegaMenu from "../components/MegaMenu";
import WhatsAppWidget from "../components/WhatsAppWidget";
import PwaInstallPrompt from "../components/PwaInstallPrompt";

const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: "prod_earbuds",
    name: "Wireless Noise-Canceling Earbuds Pro",
    category: "Electronics",
    price: 4500,
    originalPrice: 5294,
    frontImage: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&q=80",
    merchantStall: "Imenti House • Stall G14",
    badge: "Ready for Pickup",
    variants: [
      { name: "Standard Stereo Edition", priceDelta: 0 },
      { name: "Spatial Audio + ANC (+KES 1,500)", priceDelta: 1500 },
    ],
  },
  {
    id: "prod_hoodie",
    name: "Urban Heavyweight Cotton Hoodie - Black",
    category: "Fashion",
    price: 2200,
    originalPrice: 2800,
    frontImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&q=80",
    merchantStall: "Afya Centre • Shop 4B",
    badge: "45-Min Boda Dispatch",
    colors: ["#111827", "#059669", "#2563EB"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "prod_macbook",
    name: 'MacBook Air M2 13.6" Liquid Retina',
    category: "Electronics",
    price: 145000,
    originalPrice: 160000,
    frontImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
    merchantStall: "Kencom House • Suite 12",
    badge: "Verified CBD Merchant",
    variants: [
      { name: "256GB SSD (Included)", priceDelta: 0 },
      { name: "512GB SSD (+KES 12,000)", priceDelta: 12000 },
      { name: "1TB SSD (+KES 28,000)", priceDelta: 28000 },
    ],
  },
  {
    id: "prod_sneakers",
    name: "Retro High Leather Sneakers - White/Green",
    category: "Fashion",
    price: 3800,
    frontImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
    merchantStall: "OTC Complex • Stall 8",
    badge: "Ready for Pickup",
    colors: ["#FFFFFF", "#059669", "#111827"],
    sizes: ["39", "40", "41", "42", "43"],
  },
];

export default function Home() {
  const [cartItems, setCartItems] = useState<(ProductItem & { quantity: number })[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);

  // Optimistic Cart Add
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
          p.name.toLowerCase().includes(selectedCategoryFilter.toLowerCase())
      )
    : INITIAL_PRODUCTS;

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#111827] font-sans selection:bg-emerald-600 selection:text-white">
      {/* 1. Sticky Header with Integrated Quick-Search (Cmd + K) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-sm">
              N
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                NaiCBD<span className="text-emerald-600">.</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                45-Min Dispatch
              </span>
            </div>
          </div>

          {/* Quick-Search Bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full bg-gray-100 hover:bg-gray-200/80 text-gray-500 text-xs font-semibold px-4 py-2.5 rounded-xl border border-gray-200/60 flex items-center justify-between transition-colors cursor-pointer group"
            >
              <span className="flex items-center gap-2 group-hover:text-gray-900">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search electronics, fashion, CBD stalls...
              </span>
              <kbd className="bg-white text-gray-500 px-2 py-0.5 rounded text-[10px] font-mono border border-gray-200 shadow-2xs">
                Cmd K
              </kbd>
            </button>
          </div>

          {/* Actions & Cart Drawer Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="sm:hidden text-gray-600 hover:text-emerald-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <button
              onClick={() => setIsCartSheetOpen(true)}
              className="relative bg-gray-900 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>Cart</span>
              {cartItems.length > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-gray-900">
                  {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Apple-Style Multi-Level Mega Menu */}
      <MegaMenu onSelectCategory={(cat) => setSelectedCategoryFilter(cat)} />

      {/* Hero Banner Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="bg-gradient-to-r from-gray-900 via-emerald-950 to-gray-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
          <div className="relative z-10 max-w-xl space-y-4">
            <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-extrabold tracking-wider border border-emerald-500/30 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              NAIROBI CBD EXPRESS MARKETPLACE
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-white">
              Instant CBD Pickup &amp; Boda Dispatch.
            </h1>
            <p className="text-emerald-100/80 text-base font-normal leading-relaxed">
              Discover verified stall items from Imenti House, Afya Centre, Kencom, and OTC. Paid seamlessly via M-Pesa STK Push.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
              >
                Explore Full Catalog
              </button>
              <div className="flex items-center gap-2 text-xs font-semibold bg-white/10 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-sm">
                <span>⚡ Sub-45 Min Boda Delivery</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Category Pills & Filter Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                {selectedCategoryFilter ? `${selectedCategoryFilter} Catalog` : "Featured CBD Catalog"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified merchant inventory across Nairobi Central Business District
              </p>
            </div>
            {selectedCategoryFilter && (
              <button
                onClick={() => setSelectedCategoryFilter(null)}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Clear Filter (Show All)
              </button>
            )}
          </div>

          {/* Sticky Horizontal Scrollable Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none border-b border-gray-200/60 pb-4">
            {["All", "Electronics", "Fashion", "Home & Appliances", "Ready for Pickup", "45-Min Boda Dispatch"].map((pill) => (
              <button
                key={pill}
                onClick={() => setSelectedCategoryFilter(pill === "All" ? null : pill)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  (pill === "All" && !selectedCategoryFilter) || selectedCategoryFilter === pill
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-white text-gray-700 border-gray-200 hover:border-emerald-600 hover:text-emerald-700"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Aspect Ratio Uniform Product Grid with Hover Reveal & Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <DynamicProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>

        {/* PWA Mobile Android Banner */}
        <PwaInstallPrompt />
      </main>

      {/* Floating WhatsApp Live Support Widget */}
      <WhatsAppWidget />

      {/* Interactive Quick Search Modal (Cmd + K) */}
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

      {/* Dynamic Attribute Selector Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(p) => handleAddToCart(p)}
      />

      {/* Slide-Over Cart & Express Checkout Sheet */}
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
