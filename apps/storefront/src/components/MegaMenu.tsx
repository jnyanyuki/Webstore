"use client";

import React, { useState } from "react";

type CategoryGroup = {
  name: string;
  subcategories: {
    title: string;
    items: string[];
  }[];
  featured: {
    title: string;
    subtitle: string;
    image: string;
  };
};

const CATEGORIES: CategoryGroup[] = [
  {
    name: "Electronics",
    subcategories: [
      {
        title: "Phones & Audio",
        items: ["Wireless Earbuds", "Smartphones", "Bluetooth Speakers", "Power Banks"],
      },
      {
        title: "Computers",
        items: ["MacBooks", "Laptops", "Monitors & Screens", "Storage & SSDs"],
      },
    ],
    featured: {
      title: "Noise-Canceling Earbuds",
      subtitle: "From KSh 4,500 in CBD Stalls",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80",
    },
  },
  {
    name: "Fashion",
    subcategories: [
      {
        title: "Men's Wear",
        items: ["Heavyweight Hoodies", "Urban T-Shirts", "Denim Jackets", "Sneakers"],
      },
      {
        title: "Accessories",
        items: ["Leather Wallets", "Sunglasses", "Watches", "Backpacks"],
      },
    ],
    featured: {
      title: "Urban Cotton Hoodies",
      subtitle: "Special Sale - KSh 2,200",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80",
    },
  },
  {
    name: "Home & Appliances",
    subcategories: [
      {
        title: "Kitchen Essentials",
        items: ["Blenders & Mixers", "Air Fryers", "Microwaves", "Electric Kettles"],
      },
      {
        title: "Living & Comfort",
        items: ["Smart TVs", "Standing Fans", "Heaters", "Coffee Makers"],
      },
    ],
    featured: {
      title: "Digital Air Fryer 5L",
      subtitle: "Ready for 45-Min Boda Dispatch",
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80",
    },
  },
];

export default function MegaMenu({
  onSelectCategory,
}: {
  onSelectCategory: (cat: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const activeCategoryData = CATEGORIES.find((c) => c.name === activeTab);

  return (
    <div
      className="relative z-40 bg-white border-b border-gray-200/80"
      onMouseLeave={() => setActiveTab(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
        <nav className="flex items-center gap-8 overflow-x-auto scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onMouseEnter={() => setActiveTab(cat.name)}
              onClick={() => {
                onSelectCategory(cat.name);
                setActiveTab(null);
              }}
              className={`text-sm font-semibold whitespace-nowrap transition-colors py-3 border-b-2 ${
                activeTab === cat.name
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-700 hover:text-emerald-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4 text-xs font-semibold text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            CBD Merchant Stall Network
          </span>
        </div>
      </div>

      {/* Multi-Level Panel Drawer */}
      {activeCategoryData && (
        <div className="absolute left-0 right-0 top-full bg-white/95 backdrop-blur-md shadow-xl border-b border-gray-200 animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            {activeCategoryData.subcategories.map((sub, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
                  {sub.title}
                </h4>
                <ul className="space-y-2">
                  {sub.items.map((item) => (
                    <li key={item}>
                      <button
                        onClick={() => {
                          onSelectCategory(item);
                          setActiveTab(null);
                        }}
                        className="text-sm font-medium text-gray-800 hover:text-emerald-600 transition-colors block"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Featured Product Preview */}
            <div className="md:col-span-2 bg-gray-50 rounded-2xl p-5 border border-gray-200/60 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Featured Category Item
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-2">
                  {activeCategoryData.featured.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {activeCategoryData.featured.subtitle}
                </p>
                <button
                  onClick={() => {
                    onSelectCategory(activeCategoryData.name);
                    setActiveTab(null);
                  }}
                  className="mt-4 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline inline-block"
                >
                  Explore Collection →
                </button>
              </div>
              <img
                src={activeCategoryData.featured.image}
                alt={activeCategoryData.featured.title}
                className="w-28 h-28 object-cover rounded-xl border border-gray-200/80 shadow-sm flex-shrink-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
