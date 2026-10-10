"use client";

import React, { useState, useEffect } from "react";

export type SearchItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
};

const SAMPLE_PRODUCTS: SearchItem[] = [
  {
    id: "prod_earbuds",
    name: "Wireless Noise-Canceling Earbuds",
    category: "Electronics",
    price: 4500,
    originalPrice: 5294,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80",
    badge: "Ready for Pickup",
  },
  {
    id: "prod_hoodie",
    name: "Urban Heavyweight Cotton Hoodie - Black",
    category: "Fashion",
    price: 2200,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&q=80",
    badge: "45-Min Boda Dispatch",
  },
  {
    id: "prod_macbook",
    name: 'MacBook Air M2 13.6" 16GB RAM 512GB SSD',
    category: "Electronics",
    price: 145000,
    originalPrice: 160000,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80",
    badge: "Verified CBD Merchant",
  },
  {
    id: "prod_sneakers",
    name: "Retro High Leather Sneakers - White/Green",
    category: "Fashion",
    price: 3800,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80",
    badge: "Ready for Pickup",
  },
  {
    id: "prod_coffee",
    name: "Nairobi Specialty Arabica Coffee Beans 500g",
    category: "Groceries",
    price: 1250,
    image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&q=80",
    badge: "45-Min Boda Dispatch",
  },
];

const TRENDING = [
  "Noise-Canceling Earbuds",
  "MacBook M2 512GB",
  "Imenti House Stalls",
  "Cotton Hoodies",
  "Nairobi Boda Express",
];

export default function QuickSearchModal({
  isOpen,
  onClose,
  onSelectProduct,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: SearchItem) => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim()
    ? SAMPLE_PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase())
      )
    : SAMPLE_PRODUCTS;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="relative border-b border-gray-100 p-4 flex items-center gap-3 bg-gray-50/50">
          <svg
            className="w-5 h-5 text-gray-400 ml-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search electronics, fashion, CBD stalls... (Cmd + K)"
            className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-base font-medium outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-600 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                🔥 Trending Searches
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {TRENDING.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQuery(item)}
                    className="text-xs font-medium bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 px-3 py-1.5 rounded-full transition-colors border border-gray-200/60"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              {query ? `Results for "${query}"` : "Instant Recommendations"}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No products found matching &quot;{query}&quot;. Try searching for &quot;earbuds&quot; or &quot;hoodie&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50/60 border border-transparent hover:border-emerald-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0 border border-gray-200/60">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-emerald-700 mb-0.5">
                          {product.category}
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-900 line-clamp-1">
                          {product.name}
                        </h4>
                        {product.badge && (
                          <span className="inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1">
                            {product.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-extrabold text-gray-900">
                        KSh {product.price.toLocaleString()}
                      </div>
                      {product.originalPrice && (
                        <div className="text-xs text-gray-400 line-through">
                          KSh {product.originalPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
          <span>Use <kbd className="bg-white px-1.5 py-0.5 border rounded font-mono text-[10px]">↑</kbd> <kbd className="bg-white px-1.5 py-0.5 border rounded font-mono text-[10px]">↓</kbd> to navigate</span>
          <span>Nairobi CBD Real-Time Inventory</span>
        </div>
      </div>
    </div>
  );
}
