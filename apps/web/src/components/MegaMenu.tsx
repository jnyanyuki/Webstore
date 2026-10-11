"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { CategoryGroup } from "@webstore/types";

export type { CategoryGroup, FeaturedPromo, SubCategory } from "@webstore/types";

const FALLBACK_CATEGORIES: CategoryGroup[] = [
  {
    id: 1,
    name: "Electronics",
    slug: "electronics",
    subcategories: [
      {
        id: 10,
        title: "Phones & Audio",
        slug: "phones-audio",
        items: ["Wireless Earbuds", "Smartphones", "Bluetooth Speakers", "Power Banks"],
      },
      {
        id: 11,
        title: "Computers",
        slug: "computers",
        items: ["MacBooks", "Laptops", "Monitors & Screens", "Storage & SSDs"],
      },
    ],
    featured: {
      title: "Noise-Canceling Earbuds",
      subtitle: "From KSh 4,500 with Express Delivery",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80",
      targetUrl: "/shop/electronics",
    },
  },
  {
    id: 2,
    name: "Fashion",
    slug: "fashion",
    subcategories: [
      {
        id: 20,
        title: "Men's Wear",
        slug: "mens-wear",
        items: ["Heavyweight Hoodies", "Urban T-Shirts", "Denim Jackets", "Sneakers"],
      },
      {
        id: 21,
        title: "Accessories",
        slug: "accessories",
        items: ["Leather Wallets", "Sunglasses", "Watches", "Backpacks"],
      },
    ],
    featured: {
      title: "Urban Cotton Hoodies",
      subtitle: "Special Sale - KSh 2,200",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80",
      targetUrl: "/shop/fashion",
    },
  },
  {
    id: 3,
    name: "Home & Appliances",
    slug: "home-appliances",
    subcategories: [
      {
        id: 30,
        title: "Kitchen Essentials",
        slug: "kitchen-essentials",
        items: ["Blenders & Mixers", "Air Fryers", "Microwaves", "Electric Kettles"],
      },
      {
        id: 31,
        title: "Living & Comfort",
        slug: "living-comfort",
        items: ["Smart TVs", "Standing Fans", "Heaters", "Coffee Makers"],
      },
    ],
    featured: {
      title: "Digital Air Fryer 5L",
      subtitle: "Ready for 45-Min Boda Dispatch",
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80",
      targetUrl: "/shop/home-appliances",
    },
  },
];

export default function MegaMenu({
  onSelectCategory,
  initialCategories,
}: {
  onSelectCategory: (cat: string) => void;
  initialCategories?: CategoryGroup[];
}) {
  const [categories, setCategories] = useState<CategoryGroup[]>(
    initialCategories || FALLBACK_CATEGORIES
  );
  const [activeTab, setActiveTab] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDynamicNavigation() {
      try {
        const res = await fetch("/api/navigation/categories", {
          // Utilizes HTTP cache-control with stale-while-revalidate
          headers: { Accept: "application/json" },
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setCategories(data);
          }
        }
      } catch (err) {
        console.warn("[MegaMenu] Failed to fetch dynamic navigation, falling back to cache", err);
      }
    }

    loadDynamicNavigation();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeCategoryData = categories.find((c) => c.name === activeTab);

  return (
    <div
      className="relative z-40 bg-white border-b border-gray-200/80"
      onMouseLeave={() => setActiveTab(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-10">
        <nav className="flex items-center gap-6 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              onMouseEnter={() => setActiveTab(cat.name)}
              onClick={() => {
                onSelectCategory(cat.name);
                setActiveTab(null);
              }}
              className={`text-xs font-semibold whitespace-nowrap transition-colors py-2 border-b-2 ${
                activeTab === cat.name
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-700 hover:text-emerald-600"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-3 text-[11px] font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            CBD Merchant Network
          </span>
        </div>
      </div>

      {activeCategoryData && (
        <div className="absolute left-0 right-0 top-full bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200 animate-fadeIn">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 md:grid-cols-4 gap-6">
            {activeCategoryData.subcategories.map((sub) => (
              <div key={sub.id || sub.title} className="space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                  {sub.title}
                </h4>
                <ul className="space-y-1.5">
                  {sub.items.map((item) => (
                    <li key={item}>
                      <button
                        onClick={() => {
                          onSelectCategory(item);
                          setActiveTab(null);
                        }}
                        className="text-xs font-medium text-gray-700 hover:text-emerald-600 transition-colors block"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {activeCategoryData.featured && (
              <div className="md:col-span-2 bg-gray-50/80 rounded-xl p-4 border border-gray-200/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Featured Item
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-1">
                    {activeCategoryData.featured.title}
                  </h3>
                  {activeCategoryData.featured.subtitle && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {activeCategoryData.featured.subtitle}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      onSelectCategory(activeCategoryData.name);
                      setActiveTab(null);
                    }}
                    className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 underline inline-block"
                  >
                    Explore Collection →
                  </button>
                </div>
                <Image
                  src={activeCategoryData.featured.image}
                  alt={activeCategoryData.featured.title}
                  width={160}
                  height={160}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 shadow-xs flex-shrink-0"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
