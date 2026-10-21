"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  PIM_CATEGORIES_METADATA,
  PIMCategoryMetadata,
  AttributeFieldMeta,
  validateCategoryAttributes,
} from "@webstore/dynamic-attributes";
import { useProductCatalog } from "@/context/ProductCatalogContext";
import { useAuth } from "@/context/AuthContext";
import { getStorefrontUrl } from "@/lib/domainUrls";

const PRESET_BADGES = [
  "None",
  "🔥 Best Seller",
  "⚡ Flash Deal",
  "🛡️ 1-Year Warranty",
  "✨ Hot Deal",
  "💎 Premium Grade",
  "Top Rated",
];

export default function DynamicProductForm() {
  const { user } = useAuth();
  const { createProduct, uploadImage } = useProductCatalog();

  // Selected Category (default: Phones & Tablets)
  const [selectedCategory, setSelectedCategory] = useState<PIMCategoryMetadata>(
    PIM_CATEGORIES_METADATA[0]
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    PIM_CATEGORIES_METADATA[0].subcategories[0]
  );

  // Core Product Details
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [originalPrice, setOriginalPrice] = useState<number | "">("");
  const [stockQuantity, setStockQuantity] = useState<number>(25);
  const [badge, setBadge] = useState("🔥 Best Seller");
  const [merchantStall, setMerchantStall] = useState("Stall G14 • Imenti House");
  const [description, setDescription] = useState("");

  // Dynamic Polymorphic Attributes
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>({
    brand: "Apple",
    ram: "8GB",
    storage: "256GB",
    condition: "Brand New (Factory Sealed)",
    sim_slots: "Physical SIM + eSIM",
    network: "5G Enabled",
  });

  // Media & Gallery
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80",
  ]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation & Processing Status
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<"card" | "json">("card");

  // Handle Category Switching
  const handleCategorySelect = (cat: PIMCategoryMetadata) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(cat.subcategories[0] || "");
    setValidationErrors([]);

    // Initialize sensible defaults for the new category
    const initialAttrs: Record<string, any> = {};
    cat.fields.forEach((f) => {
      if (f.options && f.options.length > 0) {
        initialAttrs[f.key] = f.options[0];
      }
    });
    setDynamicAttributes(initialAttrs);

    // Suggest default image for preview
    if (cat.slug.includes("phone")) {
      setImages(["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"]);
      if (!title) setTitle("iPhone 16 Pro Max 256GB Desert Titanium");
      if (!basePrice) setBasePrice(179999);
      if (!originalPrice) setOriginalPrice(195000);
    } else if (cat.slug.includes("computer")) {
      setImages(["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"]);
      if (!title) setTitle("MacBook Pro 16\" M3 Max 36GB / 1TB SSD Space Black");
      if (!basePrice) setBasePrice(349000);
      if (!originalPrice) setOriginalPrice(375000);
    } else if (cat.slug.includes("fashion")) {
      setImages(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"]);
      if (!title) setTitle("Nike Air Jordan 1 Retro High OG Chicago");
      if (!basePrice) setBasePrice(18500);
      if (!originalPrice) setOriginalPrice(22000);
    } else if (cat.slug.includes("tv")) {
      setImages(["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80"]);
      if (!title) setTitle("Samsung 65\" OLED 4K Smart TV S90C");
      if (!basePrice) setBasePrice(189000);
      if (!originalPrice) setOriginalPrice(215000);
    } else if (cat.slug.includes("solar")) {
      setImages(["https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"]);
      if (!title) setTitle("Felicity Solar 5.12kWh 100Ah 51.2V LiFePO4 Lithium Battery");
      if (!basePrice) setBasePrice(145000);
      if (!originalPrice) setOriginalPrice(165000);
    } else {
      setImages(["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80"]);
      if (!title) setTitle("Nutricook Smart Air Fryer 2 XXL 5.5L 1700W");
      if (!basePrice) setBasePrice(16500);
      if (!originalPrice) setOriginalPrice(19000);
    }
  };

  const handleAttributeChange = (key: string, value: any) => {
    setDynamicAttributes((prev) => ({ ...prev, [key]: value }));
  };

  // Image Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const file = files[0];
      const res = await uploadImage(file, title.slice(0, 15).replace(/\s+/g, "-"));
      if (res.success && res.url) {
        setImages((prev) => [res.url!, ...prev]);
      } else {
        alert(res.message || "Failed to upload image");
      }
    } catch (err: any) {
      alert(err.message || "Upload error");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [...prev, imageUrlInput.trim()]);
    setImageUrlInput("");
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      return [chosen, ...copy];
    });
  };

  // Calculate discount percentage
  const discountPercentage = useMemo(() => {
    const p = Number(basePrice) || 0;
    const op = Number(originalPrice) || 0;
    if (op > p && p > 0) {
      return Math.round(((op - p) / op) * 100);
    }
    return 0;
  }, [basePrice, originalPrice]);

  // Submit & Publish to Neon PostgreSQL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    if (!title.trim()) {
      setValidationErrors(["Product title is required"]);
      return;
    }

    if (!basePrice || Number(basePrice) <= 0) {
      setValidationErrors(["Please provide a valid price greater than 0"]);
      return;
    }

    // 1. Zod polymorphic validation
    const valResult = validateCategoryAttributes(selectedCategory.slug, dynamicAttributes);
    if (!valResult.success && valResult.errors) {
      setValidationErrors(valResult.errors);
      return;
    }

    setIsSubmitting(true);

    const productPayload = {
      name: title.trim(),
      category: selectedCategory.name,
      subcategory: selectedSubcategory,
      itemType: selectedCategory.name,
      price: Number(basePrice),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discountPercentage,
      badge: badge === "None" ? undefined : badge,
      merchantStall,
      description: description || `Original ${title} with full warranty available at ${merchantStall}.`,
      frontImage: images[0] || "/placeholder.png",
      sideImage: images[1] || images[0] || "/placeholder.png",
      images: images,
      gallery: images.map((url, i) => ({ url, label: i === 0 ? "Front" : `Angle ${i}` })),
      attributes: dynamicAttributes,
    };

    try {
      const res = await createProduct(productPayload);
      if (res.success && res.product) {
        setPublishedProduct(res.product);
      } else {
        setValidationErrors([res.message || "Failed to publish product to catalog"]);
      }
    } catch (err: any) {
      setValidationErrors([err.message || "Network error while publishing product"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setPublishedProduct(null);
    setTitle("");
    setBasePrice("");
    setOriginalPrice("");
    setDescription("");
    handleCategorySelect(selectedCategory);
  };

  return (
    <div className="space-y-6">
      {/* Success Celebration Banner */}
      {publishedProduct && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl font-black">
                🎉
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  Product Successfully Listed &amp; Live!
                </h3>
                <p className="text-xs text-emerald-100">
                  <span className="font-bold text-white">{publishedProduct.name}</span> is now active in JuroMart marketplace.
                  SKU / ID: <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded">{publishedProduct.id}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getStorefrontUrl("/")}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-white text-emerald-800 rounded-xl font-bold text-xs hover:bg-emerald-50 transition-colors shadow-sm"
              >
                View on Storefront ↗
              </a>
              <button
                type="button"
                onClick={handleResetForm}
                className="py-2.5 px-4 bg-emerald-800/80 hover:bg-emerald-850 text-white rounded-xl font-bold text-xs transition-colors"
              >
                + List Another Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column PIM Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Comprehensive Listing Form (7 Columns) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-7 space-y-6">
          {/* Header & Category Tabs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  Enterprise PIM v2.4
                </span>
                <h2 className="text-xl font-black text-zinc-900 mt-1">
                  List New Product with Polymorphic Schemas
                </h2>
              </div>
              <span className="text-xs font-semibold text-zinc-400">
                PostgreSQL JSONB Engine
              </span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">
              Select category below to instantly load category-specific specifications, attributes, and Zod validation rules.
            </p>

            {/* Category Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PIM_CATEGORIES_METADATA.map((cat) => {
                const isSelected = selectedCategory.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-950/20"
                        : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${isSelected ? "text-white" : "text-zinc-900"}`}>
                        {cat.name}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? "text-emerald-100" : "text-zinc-400"}`}>
                        {cat.fields.length} specs
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Core Product Identity */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-2">
                <span>1. Core Product Identity</span>
              </h3>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., iPhone 16 Pro Max 256GB or Nike Air Jordan 1 Retro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Subcategory</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  >
                    {selectedCategory.subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Merchant Stall / Fulfilled By</label>
                  <input
                    type="text"
                    required
                    value={merchantStall}
                    onChange={(e) => setMerchantStall(e.target.value)}
                    className="w-full text-xs px-3 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Pricing, Promotions & Inventory */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                  2. Pricing &amp; Inventory Engine
                </h3>
                {discountPercentage > 0 && (
                  <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full">
                    {discountPercentage}% DISCOUNT ACTIVE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Selling Price (KES) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 18500"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full text-xs sm:text-sm font-bold text-emerald-700 px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Original MSRP (KES)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 22000"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full text-xs sm:text-sm text-zinc-600 px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">Stock in Stall</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm font-semibold text-zinc-700 px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Marketing Ribbon Badge</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_BADGES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBadge(b)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        badge === b
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 3: Dynamic Polymorphic Attributes */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>3. Dynamic Specifications ({selectedCategory.name})</span>
                  </h3>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Driven by polymorphic Zod schema. Stored as indexable JSONB in PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedCategory.fields.map((field: AttributeFieldMeta) => {
                  const currentValue = dynamicAttributes[field.key] || "";

                  return (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-700">
                        <span>
                          {field.label} {field.unit ? `(${field.unit})` : ""}{" "}
                          {field.required && <span className="text-red-500">*</span>}
                        </span>
                      </div>

                      {/* Chips selector */}
                      {field.type === "chips" && field.options ? (
                        <div className="flex flex-wrap gap-1.5">
                          {field.options.map((opt) => {
                            const isChipActive = currentValue === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAttributeChange(field.key, opt)}
                                className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                                  isChipActive
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : field.type === "select" && field.options ? (
                        <select
                          required={field.required}
                          value={currentValue}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          required={field.required}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          value={currentValue}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="w-full text-xs px-3 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Multi-Image Photography Studio */}
            <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800">
                  4. Photography &amp; Product Gallery ({images.length} Images)
                </h3>
                <span className="text-[10px] text-zinc-400 font-semibold">
                  Primary front image is first
                </span>
              </div>

              {/* Upload Dropzone / Button */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingImage ? "Uploading Image..." : "📸 Upload Local Image"}
                </button>

                <div className="flex-1 w-full flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Or paste external image URL..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              {/* Gallery Preview Strips */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-zinc-200 bg-white p-1.5 shadow-xs"
                    >
                      <div className="aspect-square relative rounded-lg overflow-hidden bg-zinc-100">
                        <img
                          src={imgUrl}
                          alt={`Product media ${idx}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow">
                            Front
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 mt-1.5">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="flex-1 py-1 text-[9px] font-bold bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-zinc-700 rounded transition-colors"
                          >
                            Set Front
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 text-[10px] text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 5: Description & Features */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                Product Description &amp; Highlights
              </label>
              <textarea
                rows={3}
                placeholder="Describe key highlights, warranty coverage, accessories in the box, or sizing tips..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none"
              />
            </div>

            {/* Validation Errors Alert */}
            {validationErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                <div className="font-bold">Please correct the following:</div>
                {validationErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            {/* Submit Action */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/20 hover:shadow-emerald-950/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Publishing to Neon PostgreSQL Catalog...</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Publish Product to Marketplace</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="py-4 px-5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live WYSIWYG Marketplace Card & JSON Schema Preview (5 Columns) */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          {/* Preview Mode Selector */}
          <div className="bg-white p-2 rounded-2xl border border-zinc-200 flex items-center justify-between shadow-xs">
            <span className="text-xs font-black uppercase text-zinc-700 px-2">
              Live WYSIWYG Preview
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setPreviewTab("card")}
                className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  previewTab === "card"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Storefront Card
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("json")}
                className={`text-xs font-bold px-3 py-1 rounded-xl transition-all cursor-pointer ${
                  previewTab === "json"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                JSONB Schema
              </button>
            </div>
          </div>

          {/* Tab 1: Live Storefront Product Card */}
          {previewTab === "card" ? (
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-md p-5 space-y-4">
              {/* Product Card Image Container */}
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100 relative group border border-zinc-100">
                <img
                  src={images[0] || "/placeholder.png"}
                  alt={title || "Preview product"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Badge Ribbon */}
                {badge && badge !== "None" && (
                  <span className="absolute top-3 left-3 bg-amber-50/95 text-amber-950 font-black text-[10px] px-2.5 py-1 rounded-full border border-amber-200/90 shadow-xs">
                    {badge}
                  </span>
                )}

                {/* Discount Percentage Pill */}
                {discountPercentage > 0 && (
                  <span className="absolute top-3 right-3 bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md">
                    -{discountPercentage}%
                  </span>
                )}

                <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-md">
                  📍 {merchantStall}
                </span>
              </div>

              {/* Title & Category */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {selectedCategory.name} • {selectedSubcategory}
                </span>
                <h4 className="font-extrabold text-base text-zinc-900 mt-1 line-clamp-2 leading-snug">
                  {title || "Untitled Product Title (e.g. iPhone 16 Pro Max)"}
                </h4>
              </div>

              {/* Dynamic Polymorphic Attributes Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {Object.entries(dynamicAttributes).map(([key, val]) => {
                  if (!val) return null;
                  return (
                    <span
                      key={key}
                      className="text-[10px] font-bold bg-zinc-100 text-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200"
                    >
                      <span className="text-zinc-400 capitalize">{key}:</span> {String(val)}
                    </span>
                  );
                })}
              </div>

              {/* Pricing & Checkout */}
              <div className="pt-3 border-t border-zinc-100 flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-black text-zinc-900">
                    KSh {basePrice ? Number(basePrice).toLocaleString() : "0"}
                  </div>
                  {originalPrice && Number(originalPrice) > Number(basePrice) && (
                    <div className="text-xs text-zinc-400 line-through">
                      KSh {Number(originalPrice).toLocaleString()}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="py-2 px-4 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors shadow-xs"
                >
                  Add to Cart
                </button>
              </div>

              <div className="text-[10px] text-zinc-400 text-center">
                ✓ Verified M-Pesa Express • 1-Hour CBD Boda Delivery Guaranteed
              </div>
            </div>
          ) : (
            /* Tab 2: PostgreSQL JSONB Payload Inspector */
            <div className="bg-zinc-950 text-emerald-400 rounded-3xl p-5 border border-zinc-800 font-mono text-xs overflow-x-auto shadow-md space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold border-b border-zinc-800 pb-2">
                Neon PostgreSQL Attributes JSONB
              </div>
              <pre className="text-[11px] leading-relaxed">
                {JSON.stringify(
                  {
                    category: selectedCategory.slug,
                    subcategory: selectedSubcategory,
                    title,
                    price: Number(basePrice) || 0,
                    originalPrice: Number(originalPrice) || undefined,
                    discountPercentage,
                    merchantStall,
                    attributes: dynamicAttributes,
                    images,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}

          {/* Quick Guidance Box */}
          <div className="bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-xs space-y-2 text-xs">
            <h5 className="font-bold text-zinc-800 flex items-center gap-1.5">
              <span>💡</span> Merchant Tip for Fast CBD Sales
            </h5>
            <p className="text-zinc-600 leading-relaxed text-[11px]">
              Listing accurate RAM, storage, battery, or shoe size specs guarantees high conversion from shoppers filtering on the JuroMart storefront. Items listed with clear photos dispatch within 12 minutes via the Nairobi CBD Boda courier network.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
