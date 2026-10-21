"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { ProductItem } from "@/components/DynamicProductCard";
import { useProductCatalog, ProductOverride } from "@/context/ProductCatalogContext";
import { useAuth } from "@/context/AuthContext";

const CATEGORIES = [
  "All Categories",
  "Phones & Tablets",
  "Computers & Gaming",
  "TVs & Audio",
  "Home Appliances",
  "Solar & Power Backup",
  "Men's Fashion & Shoes",
];

const PRESET_DISCOUNTS = [0, 10, 15, 20, 25, 30, 40, 50];

const PRESET_BADGES = [
  "None",
  "🔥 Best Seller",
  "⚡ Flash Deal",
  "🛡️ 1-Year Warranty",
  "✨ Hot Deal",
  "💎 Premium Grade",
  "Top Rated",
];

export default function SuperAdminCatalogManager() {
  const { user } = useAuth();
  const { products, updateProduct, batchResetPromotions, uploadImage, overrides } = useProductCatalog();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [filterPromoOnly, setFilterPromoOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Selected product for editing modal
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductOverride>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Image Upload & Gallery State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Batch actions state
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchCategory, setBatchCategory] = useState<string>("Phones & Tablets");

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== "All Categories" && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Promotion only filter
      if (filterPromoOnly) {
        const hasPromo = p.originalPrice && p.originalPrice > p.price;
        if (!hasPromo) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        const matchesStall = p.merchantStall ? p.merchantStall.toLowerCase().includes(q) : false;
        const matchesId = p.id.toLowerCase().includes(q);
        if (!matchesName && !matchesSku && !matchesStall && !matchesId) return false;
      }

      return true;
    });
  }, [products, selectedCategory, filterPromoOnly, searchQuery]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;

  // Open edit modal
  const handleOpenEdit = (p: ProductItem) => {
    setEditingProduct(p);
    const discount = p.originalPrice && p.originalPrice > p.price
      ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
      : 0;

    const existingImages: string[] = [
      ...(p.images && p.images.length > 0
        ? p.images
        : p.gallery && p.gallery.length > 0
        ? p.gallery.map((g) => g.url)
        : ([p.frontImage, p.sideImage].filter(Boolean) as string[])),
    ];
    const uniqueImages = Array.from(new Set(existingImages.filter(Boolean)));

    setEditForm({
      id: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercentage: discount,
      badge: p.badge || "",
      merchantStall: p.merchantStall || "",
      description: p.description || "",
      frontImage: p.frontImage || uniqueImages[0] || "",
      sideImage: p.sideImage || uniqueImages[1] || uniqueImages[0] || "",
      images: uniqueImages,
    });
    setUrlInput("");
    setUploadError(null);
    setSaveFeedback(null);
  };

  // Handle price or originalPrice changes with automatic discount recalculation
  const handlePriceChange = (val: number) => {
    setEditForm((prev) => {
      const original = prev.originalPrice || val;
      const discount = original > val ? Math.round(((original - val) / original) * 100) : 0;
      return { ...prev, price: val, discountPercentage: discount };
    });
  };

  const handleOriginalPriceChange = (val: number) => {
    setEditForm((prev) => {
      const price = prev.price || val;
      const discount = val > price ? Math.round(((val - price) / val) * 100) : 0;
      return { ...prev, originalPrice: val, discountPercentage: discount };
    });
  };

  // Quick preset discount percentage handler
  const handleApplyPresetDiscount = (pct: number) => {
    setEditForm((prev) => {
      const baseMsrp = prev.originalPrice && prev.originalPrice > (prev.price || 0)
        ? prev.originalPrice
        : prev.price || 1000;

      if (pct === 0) {
        // Reset promotion percentage
        return {
          ...prev,
          originalPrice: prev.price,
          discountPercentage: 0,
        };
      }

      const newPrice = Math.round(baseMsrp * (1 - pct / 100));
      return {
        ...prev,
        originalPrice: baseMsrp,
        price: newPrice,
        discountPercentage: pct,
      };
    });
  };

  // Save product changes
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    setSaveFeedback(null);

    const isReset = editForm.discountPercentage === 0;

    const res = await updateProduct({
      id: editingProduct.id,
      name: editForm.name,
      category: editForm.category,
      subcategory: editForm.subcategory,
      price: Number(editForm.price),
      originalPrice: Number(editForm.originalPrice),
      badge: editForm.badge === "None" ? "" : editForm.badge,
      description: editForm.description,
      merchantStall: editForm.merchantStall,
      frontImage: editForm.frontImage,
      sideImage: editForm.sideImage,
      images: editForm.images,
      discountPercentage: editForm.discountPercentage,
      resetPromotion: isReset,
    });

    setIsSaving(false);
    if (res.success) {
      setSaveFeedback({ type: "success", message: res.message || "Product successfully updated!" });
      setTimeout(() => {
        setEditingProduct(null);
      }, 1200);
    } else {
      setSaveFeedback({ type: "error", message: res.message || "Failed to update product." });
    }
  };

  // Batch Reset Promotions for a Category
  const handleBatchResetCategory = async () => {
    if (!confirm(`Are you sure you want to RESET all promotion percentages to 0% for "${batchCategory}"?`)) {
      return;
    }

    setIsBatchProcessing(true);
    const res = await batchResetPromotions(batchCategory);
    setIsBatchProcessing(false);

    if (res.success) {
      alert(`Success! Promotions cleared for all products in category "${batchCategory}".`);
    } else {
      alert(`Error: ${res.message}`);
    }
  };

  // Calculate promotional statistics
  const promoStats = useMemo(() => {
    let promoCount = 0;
    products.forEach((p) => {
      if (p.originalPrice && p.originalPrice > p.price) {
        promoCount++;
      }
    });
    return {
      total: products.length,
      onPromo: promoCount,
      overridden: Object.keys(overrides).length,
    };
  }, [products, overrides]);

  return (
    <div className="space-y-6">
      {/* Super Admin Status Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-gray-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">Master Catalog &amp; Promotions Engine</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                  Super Admin: {user?.email || "abokos@juromart.com"}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Full authority to edit any posted product details, adjust prices, and reset promotion percentages across all categories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl px-3.5 py-2 text-center">
              <span className="block text-[10px] text-gray-400 uppercase font-semibold">Total Catalog Items</span>
              <span className="text-sm font-extrabold text-white">{promoStats.total.toLocaleString()}</span>
            </div>
            <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl px-3.5 py-2 text-center">
              <span className="block text-[10px] text-emerald-400 uppercase font-semibold">Active Promos</span>
              <span className="text-sm font-extrabold text-emerald-300">{promoStats.onPromo.toLocaleString()}</span>
            </div>
            <div className="bg-gray-800/80 border border-gray-700/80 rounded-xl px-3.5 py-2 text-center">
              <span className="block text-[10px] text-amber-400 uppercase font-semibold">Live Overrides</span>
              <span className="text-sm font-extrabold text-amber-300">{promoStats.overridden}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Operations Bar */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
            <span className="text-emerald-600 text-sm">⚡</span> Batch Actions:
          </span>
          <span className="text-xs text-gray-500">Reset category promotions in bulk:</span>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={batchCategory}
            onChange={(e) => setBatchCategory(e.target.value)}
            className="text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg px-3 py-1.5 text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={handleBatchResetCategory}
            disabled={isBatchProcessing}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isBatchProcessing ? "Resetting..." : "Reset Category Promotions (0%)"}
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by product name, SKU, stall, or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Promotion toggle */}
          <button
            onClick={() => {
              setFilterPromoOnly(!filterPromoOnly);
              setPage(1);
            }}
            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 ${
              filterPromoOnly
                ? "bg-amber-500 text-white border-amber-600"
                : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
            }`}
          >
            <span>🏷️</span>
            <span>{filterPromoOnly ? "Showing: On Promotion Only" : "Filter: On Promotion Only"}</span>
          </button>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-gray-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="text-xs font-bold text-gray-700">
            Showing {filteredProducts.length > 0 ? (page - 1) * pageSize + 1 : 0} -{" "}
            {Math.min(page * pageSize, filteredProducts.length)} of {filteredProducts.length.toLocaleString()} matching products
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                Previous
              </button>
              <span className="px-2 font-bold text-gray-800">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 disabled:opacity-40 hover:bg-gray-200 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Product Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Merchant Stall</th>
                <th className="py-3 px-3">Selling Price</th>
                <th className="py-3 px-3">Original MSRP</th>
                <th className="py-3 px-3">Promotion %</th>
                <th className="py-3 px-3">Badge</th>
                <th className="py-3 px-4 text-right">Super Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {paginatedProducts.map((p) => {
                const discount = p.originalPrice && p.originalPrice > p.price
                  ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
                  : 0;

                const isOverridden = Boolean(overrides[p.id]);

                return (
                  <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 relative overflow-hidden flex-shrink-0 border border-gray-200">
                          {p.frontImage ? (
                            <Image src={p.frontImage} alt={p.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">📦</div>
                          )}
                        </div>
                        <div className="max-w-xs">
                          <div className="font-bold text-gray-900 truncate" title={p.name}>
                            {p.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                            <span>ID: {p.id}</span>
                            {p.sku && <span>• SKU: {p.sku}</span>}
                            {isOverridden && (
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 font-bold">
                                Edited
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-gray-600 text-[11px] font-medium">{p.merchantStall || "N/A"}</span>
                    </td>

                    <td className="py-3 px-3 font-extrabold text-gray-900">
                      KSh {p.price.toLocaleString()}
                    </td>

                    <td className="py-3 px-3 text-gray-400 line-through">
                      {p.originalPrice ? `KSh ${p.originalPrice.toLocaleString()}` : "—"}
                    </td>

                    <td className="py-3 px-3">
                      {discount > 0 ? (
                        <span className="bg-red-50 text-red-600 border border-red-200 font-extrabold px-2 py-0.5 rounded-full text-[11px]">
                          {discount}% OFF
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">0% (Standard)</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {p.badge ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          {p.badge}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>✏️</span> Edit Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Super Admin Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 relative my-8">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase mb-1">
                  👑 Super Admin Catalog Editor
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">
                  Edit Details: {editingProduct.name}
                </h3>
                <span className="text-xs text-gray-500 font-mono">ID: {editingProduct.id}</span>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {saveFeedback && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-semibold ${
                  saveFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {saveFeedback.message}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Category, Subcategory & Stall */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={editForm.category || ""}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none bg-white"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Subcategory</label>
                  <input
                    type="text"
                    value={editForm.subcategory || ""}
                    onChange={(e) => setEditForm({ ...editForm, subcategory: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Merchant Stall</label>
                  <input
                    type="text"
                    value={editForm.merchantStall || ""}
                    onChange={(e) => setEditForm({ ...editForm, merchantStall: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              {/* Pricing & Promotion Controls */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                    Pricing &amp; Promotion Percentage Engine
                  </span>
                  {editForm.discountPercentage !== undefined && editForm.discountPercentage > 0 ? (
                    <span className="bg-red-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow-xs">
                      {editForm.discountPercentage}% DISCOUNT ACTIVE
                    </span>
                  ) : (
                    <span className="bg-gray-200 text-gray-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                      Regular Price (0% Promo)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Selling Price (KES) <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editForm.price ?? ""}
                      onChange={(e) => handlePriceChange(Number(e.target.value))}
                      className="w-full text-xs sm:text-sm font-bold text-emerald-700 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Original MSRP / Strikethrough (KES)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editForm.originalPrice ?? ""}
                      onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                      placeholder="e.g. higher price for discount"
                      className="w-full text-xs sm:text-sm text-gray-700 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Preset Percentage Reset / Apply Buttons */}
                <div>
                  <div className="text-[11px] font-bold text-gray-600 mb-1.5 flex items-center justify-between">
                    <span>Quick Promotion % Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDiscount(0)}
                      className="text-red-600 hover:text-red-700 font-bold underline cursor-pointer text-[11px]"
                    >
                      Reset Promotion (Clear to 0%)
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_DISCOUNTS.map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyPresetDiscount(pct)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          editForm.discountPercentage === pct
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pct === 0 ? "0% (Reset)" : `${pct}% OFF`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Badge */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Marketing Badge</label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={editForm.badge || ""}
                    onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                    placeholder="e.g. 🔥 Best Seller"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                  <div className="flex flex-wrap gap-1">
                    {PRESET_BADGES.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setEditForm({ ...editForm, badge: b === "None" ? "" : b })}
                        className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-0.5 rounded cursor-pointer"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Images & Multi-Angle Gallery Manager */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <span>📸</span> Product Images &amp; Multi-Angle Gallery
                    </span>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Upload multiple product images or add image URLs. Set front &amp; side angles.
                    </p>
                  </div>
                  <span className="bg-white border border-gray-200 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                    {(editForm.images || []).length} Images Attached
                  </span>
                </div>

                {/* Upload Zone & URL Add Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Uploader */}
                  <div className="relative border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl p-4 bg-white text-center transition-colors cursor-pointer group flex flex-col items-center justify-center min-h-[90px]">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      disabled={isUploadingImage}
                      onChange={async (e) => {
                        if (!e.target.files || e.target.files.length === 0) return;
                        setIsUploadingImage(true);
                        setUploadError(null);
                        try {
                          const files = Array.from(e.target.files);
                          const uploadedUrls: string[] = [];
                          for (const file of files) {
                            const res = await uploadImage(file, editingProduct?.id);
                            if (res.success && res.url) {
                              uploadedUrls.push(res.url);
                            } else {
                              setUploadError(res.message || "Failed to upload one or more images");
                            }
                          }
                          if (uploadedUrls.length > 0) {
                            setEditForm((prev) => {
                              const currentImages = prev.images || [];
                              const updated = [...currentImages, ...uploadedUrls];
                              return {
                                ...prev,
                                images: updated,
                                frontImage: prev.frontImage || updated[0],
                                sideImage: prev.sideImage || (updated[1] || updated[0]),
                              };
                            });
                          }
                        } catch (err: any) {
                          setUploadError(err?.message || "Upload failed");
                        } finally {
                          setIsUploadingImage(false);
                          e.target.value = "";
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-1 group-hover:scale-110 transition-transform">
                        {isUploadingImage ? "⏳" : "📁"}
                      </div>
                      <div className="text-xs font-bold text-gray-800">
                        {isUploadingImage ? "Uploading & Processing..." : "Choose Image Files to Upload"}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        Multiple files supported (WebP, PNG, JPG, JPEG)
                      </div>
                    </div>
                  </div>

                  {/* URL Add Input */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Add Image by URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = urlInput.trim();
                            if (!trimmed) return;
                            setEditForm((prev) => {
                              const current = prev.images || [];
                              const updated = [...current, trimmed];
                              return {
                                ...prev,
                                images: updated,
                                frontImage: prev.frontImage || trimmed,
                                sideImage: prev.sideImage || (updated[1] || trimmed),
                              };
                            });
                            setUrlInput("");
                          }}
                          className="px-3 py-1.5 bg-gray-900 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">
                      Paste supplier URL, Unsplash, or CDN image link.
                    </div>
                  </div>
                </div>

                {uploadError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 p-2 rounded-lg text-xs font-semibold">
                    ⚠️ {uploadError}
                  </div>
                )}

                {/* Image Gallery Cards */}
                {(editForm.images || []).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                    {(editForm.images || []).map((imgUrl, idx) => {
                      const isFront = editForm.frontImage === imgUrl;
                      const isSide = editForm.sideImage === imgUrl && !isFront;

                      return (
                        <div
                          key={`${imgUrl}-${idx}`}
                          className={`relative group bg-white rounded-xl border p-1.5 flex flex-col transition-all shadow-xs ${
                            isFront
                              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                              : isSide
                              ? "border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-gray-100 mb-1.5">
                            <img
                              src={imgUrl}
                              alt={`Angle ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {/* Role Badge */}
                            <div className="absolute top-1 left-1">
                              {isFront ? (
                                <span className="bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                                  ⭐ Front
                                </span>
                              ) : isSide ? (
                                <span className="bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                                  🔄 Side
                                </span>
                              ) : (
                                <span className="bg-gray-900/70 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditForm((prev) => {
                                  const filtered = (prev.images || []).filter((_, i) => i !== idx);
                                  return {
                                    ...prev,
                                    images: filtered,
                                    frontImage: prev.frontImage === imgUrl ? (filtered[0] || "") : prev.frontImage,
                                    sideImage: prev.sideImage === imgUrl ? (filtered[1] || filtered[0] || "") : prev.sideImage,
                                  };
                                });
                              }}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs transition-transform group-hover:scale-110 cursor-pointer"
                              title="Remove image"
                            >
                              ×
                            </button>
                          </div>

                          {/* Quick Role Assignment Buttons */}
                          <div className="flex gap-1 mt-auto">
                            {!isFront && (
                              <button
                                type="button"
                                onClick={() => setEditForm((prev) => ({ ...prev, frontImage: imgUrl }))}
                                className="flex-1 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-700 text-[10px] font-bold rounded transition-colors cursor-pointer text-center"
                                title="Set as Primary Front Image"
                              >
                                Set Front
                              </button>
                            )}
                            {!isSide && (
                              <button
                                type="button"
                                onClick={() => setEditForm((prev) => ({ ...prev, sideImage: imgUrl }))}
                                className="flex-1 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-[10px] font-bold rounded transition-colors cursor-pointer text-center"
                                title="Set as Secondary Side Image"
                              >
                                Set Side
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-gray-400 bg-white rounded-xl border border-gray-100">
                    No gallery images added yet. Click above to upload or paste a URL.
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description || ""}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? "Saving to PostgreSQL..." : "Save Product Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
