"use client";

import React, { useState } from "react";
import DynamicProductCard, { ProductItem } from "../../components/DynamicProductCard";
import ProductQuickViewModal from "../../components/ProductQuickViewModal";
import SlideOverCartSheet, { CartItemType } from "../../components/SlideOverCartSheet";
import QuickSearchModal, { SearchItem } from "../../components/QuickSearchModal";
import MegaMenu from "../../components/MegaMenu";
import WhatsAppWidget from "../../components/WhatsAppWidget";
import PwaInstallPrompt from "../../components/PwaInstallPrompt";
import { INITIAL_PRODUCTS } from "../../data/products";

type AudienceScope = "universal" | "local" | "nationwide" | "global";

const AUDIENCE_CONFIG: Record<
  AudienceScope,
  {
    badge: string;
    title: string;
    highlight: string;
    description: string;
    primaryAction: string;
    pill: string;
    deliveryTime: string;
    coverage: string;
    paymentMethods: string;
    perk: string;
  }
> = {
  universal: {
    badge: "GLOBAL & LOCAL EXPRESS MARKETPLACE",
    title: "Verified Merchant Deals.",
    highlight: "Instant Pickup & Worldwide Delivery.",
    description:
      "Discover authentic electronics, fashion, and lifestyle gear from verified merchants. Enjoy sub-45 min local courier, nationwide doorstep shipping, and seamless checkout via M-Pesa, Cards, & Global Wallets.",
    primaryAction: "Explore Full Catalog",
    pill: "⚡ Same-Day & Tracked Delivery",
    deliveryTime: "Sub-45m Local • 24-48h Countrywide",
    coverage: "Nairobi Hubs, All 47 Counties & Global",
    paymentMethods: "M-Pesa, Visa, Mastercard, Apple Pay",
    perk: "100% Genuine with Official Warranty",
  },
  local: {
    badge: "CITY EXPRESS • SUB-45 MIN DISPATCH",
    title: "Instant City Pickup &",
    highlight: "Rapid Doorstep Courier.",
    description:
      "Direct from verified city merchants and hub stalls. Collect instantly at pickup stations or have a dedicated motorcycle courier deliver straight to your door or office in minutes.",
    primaryAction: "Explore City Hub Catalog",
    pill: "⚡ Sub-45 Min Rapid Courier",
    deliveryTime: "15 to 45 Minutes (Live GPS)",
    coverage: "Nairobi CBD, Westlands, Upper Hill & Suburbs",
    paymentMethods: "M-Pesa STK Push, Cash on Delivery, Cards",
    perk: "Live Rider Tracking & Instant Dispatch",
  },
  nationwide: {
    badge: "COUNTRYWIDE DOORSTEP FULFILLMENT",
    title: "Safe, Tracked Delivery to",
    highlight: "Every County Across Kenya.",
    description:
      "Order genuine goods delivered reliably to any doorstep or regional parcel station in Mombasa, Kisumu, Nakuru, Eldoret, and beyond within 24 to 48 hours.",
    primaryAction: "Shop Nationwide Shipping",
    pill: "📦 24-48 Hour Doorstep Courier",
    deliveryTime: "24 – 48 Hours Guaranteed",
    coverage: "All 47 Counties & Regional Hubs",
    paymentMethods: "M-Pesa, Bank Transfer, Visa/Mastercard",
    perk: "Tamper-Evident Packaging & Insurance",
  },
  global: {
    badge: "DIASPORA & INTERNATIONAL SHOPPERS",
    title: "Order from Anywhere,",
    highlight: "Delivered Directly to Loved Ones.",
    description:
      "Support family and friends with verified electronics, appliances, and fashion. Pay seamlessly with international debit or credit cards and receive photo proof on delivery.",
    primaryAction: "Send Gift or Order Abroad",
    pill: "🌍 International Cards Accepted",
    deliveryTime: "Same-Day Dispatch with Photo Proof",
    coverage: "Kenya-Wide Delivery for Overseas Buyers",
    paymentMethods: "Visa, Mastercard, Google Pay, Apple Pay",
    perk: "Photo Proof of Delivery & Zero Hidden Fees",
  },
};

export default function StorefrontHome() {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductItem | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [audienceScope, setAudienceScope] = useState<AudienceScope>("universal");
  const activeAudience = AUDIENCE_CONFIG[audienceScope];

  const handleAddToCart = (
    product: ProductItem,
    quantityToAdd: number = 1,
    selectedVariant?: string
  ) => {
    setCartItems((prev) => {
      const cartKey = selectedVariant ? `${product.id}__${selectedVariant}` : product.id;
      const existing = prev.find((item) => (item.cartKey || item.id) === cartKey);
      if (existing) {
        return prev.map((item) =>
          (item.cartKey || item.id) === cartKey
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [
        ...prev,
        {
          ...product,
          quantity: quantityToAdd,
          selectedVariant,
          cartKey,
        },
      ];
    });
    setIsCartSheetOpen(true);
  };

  const handleUpdateQuantity = (cartKeyOrId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          (item.cartKey || item.id) === cartKeyOrId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (cartKeyOrId: string) => {
    setCartItems((prev) => prev.filter((item) => (item.cartKey || item.id) !== cartKeyOrId));
  };

  const filteredProducts = selectedCategoryFilter
    ? INITIAL_PRODUCTS.filter((p) => {
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
                Express Delivery
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

      {/* 2. Compact Main Container & Universal Audience Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        <div className="bg-gradient-to-br from-gray-950 via-slate-900 to-emerald-950 rounded-2xl p-5 sm:p-7 lg:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
          {/* Subtle Ambient Glow Effects */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Audience & Delivery Scope Switcher */}
          <div className="relative z-10 flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none border-b border-white/10">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1 hidden sm:inline-block">
              Delivery Scope:
            </span>
            {(
              [
                { id: "universal", label: "🌍 Universal (All Shoppers)", short: "🌍 All" },
                { id: "local", label: "⚡ Local City Express (Sub-45m)", short: "⚡ Local Express" },
                { id: "nationwide", label: "🇰🇪 Nationwide (47 Counties)", short: "🇰🇪 Nationwide" },
                { id: "global", label: "🌐 Global / Diaspora Orders", short: "🌐 Global" },
              ] as const
            ).map((scope) => (
              <button
                key={scope.id}
                onClick={() => setAudienceScope(scope.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  audienceScope === scope.id
                    ? "bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                    : "bg-white/10 text-gray-300 hover:bg-white/15 hover:text-white"
                }`}
              >
                <span className="hidden sm:inline">{scope.label}</span>
                <span className="sm:hidden">{scope.short}</span>
              </button>
            ))}
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-3.5">
              <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold tracking-wider border border-emerald-500/30 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {activeAudience.badge}
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
                {activeAudience.title}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                  {activeAudience.highlight}
                </span>
              </h1>

              <p className="text-gray-300 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
                {activeAudience.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-gray-950 px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>{activeAudience.primaryAction}</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 px-3.5 py-2.5 rounded-xl border border-white/10 backdrop-blur-xs text-emerald-300">
                  <span>{activeAudience.pill}</span>
                </div>
              </div>

              {/* Payment & Trust Signals */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified Merchants
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  M-Pesa, Cards &amp; Apple Pay
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Buyer Protection Guaranteed
                </span>
              </div>
            </div>

            {/* Right Interactive Matrix / Trust Card (Desktop & Tablet) */}
            <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-xl p-4 sm:p-5 border border-white/10 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Fulfillment Status Radar
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Global / Local
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-left">
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[10px] text-gray-400 font-medium">Delivery Speed</div>
                  <div className="text-xs font-extrabold text-white truncate">{activeAudience.deliveryTime}</div>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[10px] text-gray-400 font-medium">Coverage Area</div>
                  <div className="text-xs font-extrabold text-white truncate">{activeAudience.coverage}</div>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[10px] text-gray-400 font-medium">Payment Channels</div>
                  <div className="text-xs font-extrabold text-emerald-300 truncate">{activeAudience.paymentMethods}</div>
                </div>
                <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                  <div className="text-[10px] text-gray-400 font-medium">Buyer Guarantee</div>
                  <div className="text-xs font-extrabold text-emerald-300 truncate">{activeAudience.perk}</div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400">
                <span>Fast &amp; Tracked Dispatch</span>
                <button
                  onClick={() => setIsCartSheetOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer"
                >
                  Delivery Options →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Category Section & Compact Filter Bar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                {selectedCategoryFilter ? `${selectedCategoryFilter} Catalog` : "Featured Verified Catalog"}
              </h2>
              <p className="text-[11px] text-gray-500">
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

          <div className="flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-none border-b border-gray-200/60 pb-3">
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
        onAddToCart={(p, options) => {
          handleAddToCart(p, options.quantity || 1, options.variant);
        }}
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
