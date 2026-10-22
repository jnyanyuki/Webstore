"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import {
  PIM_CATEGORIES_METADATA,
  PIMCategoryMetadata,
  AttributeFieldMeta,
  getFieldsForCategoryAndSubcategory,
  resolveCategoryForProduct,
  validateCategoryAttributes,
  getCategoryBySlugOrName,
} from "@webstore/dynamic-attributes";
import { useProductCatalog, ProductOverride } from "@/context/ProductCatalogContext";
import { useAuth } from "@/context/AuthContext";
import { ProductItem } from "@/components/DynamicProductCard";
import { getStorefrontUrl } from "@/lib/domainUrls";
import {
  ProductColorOption,
  PRESET_COLOR_PALETTES,
  KNOWN_COLOR_MAP,
  getColorHex,
  getProductColorOptions,
} from "@/lib/productColors";

const PRESET_BADGES = [
  "None",
  "🔥 Best Seller",
  "⚡ Flash Deal",
  "🛡️ 1-Year Warranty",
  "✨ Hot Deal",
  "💎 Premium Grade",
  "Top Rated",
  "New Arrival",
];

interface DynamicProductFormProps {
  initialProductId?: string | null;
  onProductSaved?: (product: any) => void;
}

export default function DynamicProductForm({
  initialProductId,
  onProductSaved,
}: DynamicProductFormProps = {}) {
  const { user } = useAuth();
  const { products, createProduct, updateProduct, uploadImage, overrides } = useProductCatalog();

  // Mode: "create" (list new product) vs "manage" (edit existing catalog product)
  const [activeMode, setActiveMode] = useState<"create" | "manage">("create");

  // Manage mode product selection state
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  // Selected Category & Subcategory
  const [selectedCategory, setSelectedCategory] = useState<PIMCategoryMetadata>(
    PIM_CATEGORIES_METADATA[0]
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    PIM_CATEGORIES_METADATA[0].subcategories[0]
  );

  // Core Product Details
  const [productId, setProductId] = useState<string>("");
  const [title, setTitle] = useState("");
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

  // Color & Finish Options State
  const [colorOptions, setColorOptions] = useState<ProductColorOption[]>([
    { name: "Natural Titanium", hex: "#C2BCB2", bgGradient: "linear-gradient(135deg, #d3cdc4, #a8a299)" },
    { name: "Desert Titanium", hex: "#BFA48F", bgGradient: "linear-gradient(135deg, #d5bdab, #a78f7c)" },
    { name: "White Titanium", hex: "#F2F1ED", bgGradient: "linear-gradient(135deg, #ffffff, #deddd8)" },
    { name: "Black Titanium", hex: "#3C3C3D", bgGradient: "linear-gradient(135deg, #4a4a4c, #2b2b2c)" },
  ]);
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#C2BCB2");
  const [newColorImage, setNewColorImage] = useState("");
  const [selectedPreviewColorIndex, setSelectedPreviewColorIndex] = useState(0);

  // Validation & Processing Status
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [publishedProduct, setPublishedProduct] = useState<any | null>(null);
  const [previewTab, setPreviewTab] = useState<"card" | "json">("card");

  // Quick Promotion % Presets State
  const [isCustomDiscountOpen, setIsCustomDiscountOpen] = useState(false);
  const [customDiscountValue, setCustomDiscountValue] = useState("");

  // Dynamic active fields driven by Category + Subcategory
  const activeFields = useMemo(() => {
    return getFieldsForCategoryAndSubcategory(selectedCategory.slug, selectedSubcategory);
  }, [selectedCategory, selectedSubcategory]);

  // Filtered catalog products for the manage search combobox
  const filteredCatalogProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products.slice(0, 15);
    const q = productSearchQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
          (p.merchantStall && p.merchantStall.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [products, productSearchQuery]);

  // Load a catalog product into the PIM Studio
  const handleLoadProduct = (prod: ProductItem) => {
    setSelectedProductId(prod.id);
    setProductId(prod.id);
    setTitle(prod.name);
    setBasePrice(prod.price);
    setOriginalPrice(prod.originalPrice || "");
    setBadge(prod.badge || "None");
    setMerchantStall(prod.merchantStall || "Stall G14 • Imenti House");
    setDescription(prod.description || "");

    // Quick Promotion % state check
    const currentDisc = prod.originalPrice && prod.originalPrice > prod.price
      ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
      : 0;
    if (currentDisc > 0 && ![5, 10, 15, 20, 25].includes(currentDisc)) {
      setIsCustomDiscountOpen(true);
      setCustomDiscountValue(String(currentDisc));
    } else {
      setIsCustomDiscountOpen(false);
      setCustomDiscountValue("");
    }

    // Media
    const prodImages = prod.images && prod.images.length > 0 ? prod.images : [prod.frontImage];
    setImages(prodImages.filter(Boolean));

    // Resolve Category & Subcategory Schema
    const resolved = resolveCategoryForProduct(prod.category, prod.subcategory);
    setSelectedCategory(resolved.category);
    setSelectedSubcategory(resolved.subcategory);

    // Dynamic Attributes: use existing or extract defaults
    const existingAttrs = (prod as any).attributes || {};
    const initialAttrs: Record<string, any> = { ...existingAttrs };

    // Fill missing fields with defaults from options if not present
    const fields = getFieldsForCategoryAndSubcategory(resolved.category.slug, resolved.subcategory);
    fields.forEach((f) => {
      if (initialAttrs[f.key] === undefined && f.options && f.options.length > 0) {
        initialAttrs[f.key] = f.options[0];
      }
    });

    setDynamicAttributes(initialAttrs);

    // Color & Finish Options
    const loadedColors = (prod as any).colorOptions && (prod as any).colorOptions.length > 0
      ? (prod as any).colorOptions
      : (prod as any).colors && (prod as any).colors.length > 0
      ? getProductColorOptions(prod)
      : getProductColorOptions(prod);
    setColorOptions(loadedColors || []);
    setSelectedPreviewColorIndex(0);

    setValidationErrors([]);
    setPublishedProduct(null);
    setIsSearchDropdownOpen(false);
    setActiveMode("manage");
  };

  // React to initialProductId prop if provided
  useEffect(() => {
    if (initialProductId) {
      const match = products.find((p) => p.id === initialProductId);
      if (match) {
        handleLoadProduct(match);
      }
    }
  }, [initialProductId, products]);

  // Handle Category Switching
  const handleCategorySelect = (cat: PIMCategoryMetadata) => {
    setSelectedCategory(cat);
    const sub = cat.subcategories[0] || "General";
    setSelectedSubcategory(sub);
    setValidationErrors([]);

    // Initialize sensible defaults for the new category & subcategory
    const fields = getFieldsForCategoryAndSubcategory(cat.slug, sub);
    const initialAttrs: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.options && f.options.length > 0) {
        initialAttrs[f.key] = f.options[0];
      }
    });
    setDynamicAttributes(initialAttrs);

    // If creating from scratch and no custom image set, suggest domain placeholder
    if (activeMode === "create") {
      if (cat.slug.includes("phone")) {
        setImages(["https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"]);
      } else if (cat.slug.includes("computer")) {
        setImages(["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"]);
      } else if (cat.slug.includes("footwear") || cat.slug.includes("shoe")) {
        setImages(["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"]);
      } else if (cat.slug.includes("fashion")) {
        setImages(["https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80"]);
      } else if (cat.slug.includes("tv")) {
        setImages(["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80"]);
      } else if (cat.slug.includes("solar")) {
        setImages(["https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"]);
      } else {
        setImages(["https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80"]);
      }

      if (cat.slug.includes("phone") || cat.slug.includes("tablet")) {
        setColorOptions(PRESET_COLOR_PALETTES[0].colors);
      } else if (cat.slug.includes("fashion") || cat.slug.includes("apparel") || cat.slug.includes("suit")) {
        setColorOptions(PRESET_COLOR_PALETTES[5].colors);
      } else if (cat.slug.includes("footwear") || cat.slug.includes("shoe")) {
        setColorOptions(PRESET_COLOR_PALETTES[6].colors);
      } else {
        setColorOptions(PRESET_COLOR_PALETTES[7].colors);
      }
      setSelectedPreviewColorIndex(0);
    }
  };

  // Handle Subcategory Switching
  const handleSubcategorySelect = (sub: string) => {
    setSelectedSubcategory(sub);
    setValidationErrors([]);

    // Refresh dynamic fields for the newly selected subcategory
    const fields = getFieldsForCategoryAndSubcategory(selectedCategory.slug, sub);
    setDynamicAttributes((prev) => {
      const updated = { ...prev };
      fields.forEach((f) => {
        if (updated[f.key] === undefined && f.options && f.options.length > 0) {
          updated[f.key] = f.options[0];
        }
      });
      return updated;
    });
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

  // Quick Promotion % Presets handlers
  const handleApplyPresetDiscount = (pct: number) => {
    setIsCustomDiscountOpen(false);
    setCustomDiscountValue("");
    const currPrice = Number(basePrice) || 0;
    const currMsrp = Number(originalPrice) || 0;
    const baseMsrp = currMsrp > currPrice ? currMsrp : currPrice || 1000;

    if (pct === 0) {
      setOriginalPrice(currPrice > 0 ? currPrice : "");
      return;
    }

    const newPrice = Math.round(baseMsrp * (1 - pct / 100));
    setOriginalPrice(baseMsrp);
    setBasePrice(newPrice);
  };

  const handleApplyCustomDiscount = (val?: string) => {
    const raw = val !== undefined ? val : customDiscountValue;
    const num = Math.min(99, Math.max(1, Math.round(Number(raw))));
    if (isNaN(num)) return;
    const currPrice = Number(basePrice) || 0;
    const currMsrp = Number(originalPrice) || 0;
    const baseMsrp = currMsrp > currPrice ? currMsrp : currPrice || 1000;

    const newPrice = Math.round(baseMsrp * (1 - num / 100));
    setOriginalPrice(baseMsrp);
    setBasePrice(newPrice);
    setCustomDiscountValue(String(num));
    setIsCustomDiscountOpen(true);
  };

  // Color & Finish Option Handlers
  const handleAddColorOption = () => {
    if (!newColorName.trim()) return;
    const cleanName = newColorName.trim();
    const mapEntry = KNOWN_COLOR_MAP[cleanName.toLowerCase()];
    const hex = newColorHex || mapEntry?.hex || getColorHex(cleanName);
    const bgGradient = mapEntry?.bgGradient;

    setColorOptions((prev) => [
      ...prev,
      {
        name: cleanName,
        hex,
        bgGradient,
        image: newColorImage || undefined,
      },
    ]);
    setNewColorName("");
    setNewColorHex("#C2BCB2");
    setNewColorImage("");
  };

  const handleRemoveColorOption = (index: number) => {
    setColorOptions((prev) => prev.filter((_, idx) => idx !== index));
    if (selectedPreviewColorIndex >= index && selectedPreviewColorIndex > 0) {
      setSelectedPreviewColorIndex((prev) => prev - 1);
    }
  };

  const handleColorNameChange = (val: string) => {
    setNewColorName(val);
    const lower = val.trim().toLowerCase();
    if (KNOWN_COLOR_MAP[lower]) {
      setNewColorHex(KNOWN_COLOR_MAP[lower].hex);
    }
  };

  const handleApplyPalette = (paletteColors: ProductColorOption[], mode: "replace" | "append" = "replace") => {
    if (mode === "replace") {
      setColorOptions(paletteColors);
    } else {
      setColorOptions((prev) => {
        const existingNames = new Set(prev.map((c) => c.name.toLowerCase()));
        const toAdd = paletteColors.filter((c) => !existingNames.has(c.name.toLowerCase()));
        return [...prev, ...toAdd];
      });
    }
    setSelectedPreviewColorIndex(0);
  };

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
    const valResult = validateCategoryAttributes(
      selectedCategory.slug,
      dynamicAttributes,
      selectedSubcategory
    );
    if (!valResult.success && valResult.errors) {
      setValidationErrors(valResult.errors);
      return;
    }

    setIsSubmitting(true);

    const productPayload = {
      id: activeMode === "manage" && productId ? productId : undefined,
      name: title.trim(),
      category: selectedCategory.name,
      subcategory: selectedSubcategory,
      itemType: selectedCategory.name,
      price: Number(basePrice),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      discountPercentage,
      badge: badge === "None" ? undefined : badge,
      merchantStall,
      description:
        description || `Original ${title} with full warranty available at ${merchantStall}.`,
      frontImage: images[0] || "/placeholder.png",
      sideImage: images[1] || images[0] || "/placeholder.png",
      images: images,
      gallery: images.map((url, i) => ({ url, label: i === 0 ? "Front" : `Angle ${i}` })),
      attributes: dynamicAttributes,
      colors: colorOptions.map((c) => c.name),
      colorOptions: colorOptions,
    };

    try {
      if (activeMode === "manage" && productId) {
        // Update existing product in Neon DB
        const res = await updateProduct({
          ...productPayload,
          id: productId,
        });
        if (res.success) {
          setPublishedProduct({ ...productPayload, id: productId });
          onProductSaved?.(productPayload);
        } else {
          setValidationErrors([res.message || "Failed to update product"]);
        }
      } else {
        // Create brand new product
        const res = await createProduct(productPayload as any);
        if (res.success && res.product) {
          setPublishedProduct(res.product);
          onProductSaved?.(res.product);
        } else {
          setValidationErrors([res.message || "Failed to publish product to catalog"]);
        }
      }
    } catch (err: any) {
      setValidationErrors([err.message || "Network error while saving product"]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setPublishedProduct(null);
    setSelectedProductId(null);
    setProductId("");
    setTitle("");
    setBasePrice("");
    setOriginalPrice("");
    setDescription("");
    setColorOptions([]);
    setNewColorName("");
    setNewColorHex("#C2BCB2");
    setNewColorImage("");
    setSelectedPreviewColorIndex(0);
    setActiveMode("create");
    handleCategorySelect(selectedCategory);
  };

  return (
    <div className="space-y-6">
      {/* Top Controller Bar: Mode Switching & Manage Product Picker */}
      <div className="p-4 rounded-3xl bg-white border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveMode("create");
              setPublishedProduct(null);
              setSelectedProductId(null);
              setProductId("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeMode === "create"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/20"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            ➕ List New Product
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode("manage");
              setPublishedProduct(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeMode === "manage"
                ? "bg-zinc-900 text-white shadow-md shadow-zinc-950/20"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            🔍 Manage & Edit Catalog Item ({products.length})
          </button>
        </div>

        {/* Catalog Search & Picker Combobox (When in Manage Mode) */}
        {activeMode === "manage" && (
          <div className="relative flex-1 max-w-md">
            <div className="flex items-center gap-2 px-3.5 py-2 bg-zinc-50 border border-zinc-200 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all">
              <span className="text-zinc-400">🔍</span>
              <input
                type="text"
                placeholder="Search catalog product to load into PIM..."
                value={productSearchQuery}
                onFocus={() => setIsSearchDropdownOpen(true)}
                onChange={(e) => {
                  setProductSearchQuery(e.target.value);
                  setIsSearchDropdownOpen(true);
                }}
                className="w-full text-xs font-medium bg-transparent focus:outline-hidden text-zinc-900"
              />
              {selectedProductId && (
                <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md whitespace-nowrap">
                  Loaded
                </span>
              )}
            </div>

            {/* Dropdown Results */}
            {isSearchDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-zinc-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 text-xs font-bold uppercase tracking-wider text-zinc-500 bg-zinc-50 flex items-center justify-between">
                  <span>Select Product to Edit Schema & Details</span>
                  <button
                    type="button"
                    onClick={() => setIsSearchDropdownOpen(false)}
                    className="text-zinc-500 hover:text-zinc-900 font-bold"
                  >
                    ✕
                  </button>
                </div>
                {filteredCatalogProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    No matching products found.
                  </div>
                ) : (
                  filteredCatalogProducts.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleLoadProduct(prod)}
                      className="w-full p-2.5 flex items-center gap-3 hover:bg-emerald-50/60 transition-colors text-left cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 overflow-hidden relative shrink-0 border border-zinc-200">
                        <Image
                          src={prod.frontImage || "/placeholder.png"}
                          alt={prod.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-zinc-900 truncate">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-semibold text-emerald-700">{prod.category}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-700">KES {prod.price.toLocaleString()}</span>
                          {prod.merchantStall && (
                            <>
                              <span>•</span>
                              <span className="truncate">{prod.merchantStall}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-emerald-600 transition-colors shrink-0">
                        Edit →
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Global Schema Coverage Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] font-extrabold text-zinc-700 tracking-tight">
            15 Dedicated Domains • 62 Subcategories Active
          </span>
        </div>
      </div>

      {/* Success Celebration Banner */}
      {publishedProduct && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white shadow-xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl font-black">
                🎉
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {activeMode === "manage" ? "Product Updated Successfully!" : "Product Published to Platform!"}
                </h3>
                <p className="text-xs text-emerald-100">
                  {publishedProduct.name} ({publishedProduct.id}) is live with dynamic polymorphic attributes synced to Neon PostgreSQL.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={getStorefrontUrl(`/product/${publishedProduct.id}`)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-white text-emerald-900 rounded-xl text-xs font-black shadow-md hover:bg-emerald-50 transition-colors"
              >
                👁️ View on Storefront
              </a>
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 bg-emerald-950/40 hover:bg-emerald-950/60 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {activeMode === "manage" ? "Edit Another" : "List Another"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Two-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): The Polymorphic Listing Engine */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Header & Active Schema Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedCategory.icon}</span>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                  {activeMode === "manage" ? `Edit: ${title || "Catalog Product"}` : "Product Information Management Studio"}
                </h2>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {selectedCategory.domain} • Dedicated Polymorphic Schema
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200 shrink-0 self-start sm:self-auto">
              Schema: {selectedCategory.slug}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Category Domain Grid Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                1. Dedicated Domain Category ({PIM_CATEGORIES_METADATA.length} Domains)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {PIM_CATEGORIES_METADATA.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-black shadow-xs"
                          : "bg-zinc-50/70 border-zinc-200/70 text-zinc-700 hover:bg-zinc-100/70 hover:border-zinc-300"
                      }`}
                    >
                      <span className="text-xl shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">{cat.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{cat.subcategories.length} subcategories</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Subcategory Selector */}
            <div className="space-y-2.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                2. Subcategory Specification (Swaps Dynamic Attributes)
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedCategory.subcategories.map((sub) => {
                  const isSelected = selectedSubcategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => handleSubcategorySelect(sub)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Core Identity & Pricing Engine */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                3. Core Identity, Pricing & Commercial Terms
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1">
                    Product Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. iPhone 16 Pro Max 256GB Desert Titanium / Italian Tailored Blazer"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Selling Price (KES) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">
                        KES
                      </span>
                      <input
                        type="number"
                        required
                        min="1"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="185000"
                        className="w-full pl-12 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-bold text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-700">
                        Original MSRP / Strikethrough
                      </label>
                      {discountPercentage > 0 && (
                        <span className="text-xs font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                          -{discountPercentage}% Off
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-zinc-400">
                        KES
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={originalPrice}
                        onChange={(e) => setOriginalPrice(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="205000"
                        className="w-full pl-12 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Promotion % Presets Engine */}
                <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-xl p-3">
                  <div className="text-xs font-bold text-zinc-700 mb-1.5 flex items-center justify-between">
                    <span>Quick Promotion % Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDiscount(0)}
                      className="text-red-600 hover:text-red-700 font-bold underline cursor-pointer text-xs"
                    >
                      Reset Promotion (Clear to 0%)
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Reset Button */}
                    <button
                      type="button"
                      onClick={() => handleApplyPresetDiscount(0)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        discountPercentage === 0
                          ? "bg-zinc-900 text-white shadow-xs"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Reset
                    </button>

                    {/* 5, 10, 15, 20, 25 Presets */}
                    {[5, 10, 15, 20, 25].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => handleApplyPresetDiscount(pct)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          discountPercentage === pct && !isCustomDiscountOpen
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {pct}% OFF
                      </button>
                    ))}

                    {/* Custom Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDiscountOpen(!isCustomDiscountOpen);
                        if (!customDiscountValue && discountPercentage) {
                          setCustomDiscountValue(String(discountPercentage));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCustomDiscountOpen ||
                        (Boolean(discountPercentage) &&
                          ![0, 5, 10, 15, 20, 25].includes(discountPercentage))
                          ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span>Custom</span>
                      {Boolean(
                        discountPercentage &&
                          ![0, 5, 10, 15, 20, 25].includes(discountPercentage)
                      ) && (
                        <span className="bg-white/20 px-1.5 py-0.2 rounded text-xs font-black">
                          {discountPercentage}%
                        </span>
                      )}
                    </button>

                    {/* Custom Percentage Inline Form */}
                    {isCustomDiscountOpen && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 rounded-xl px-2.5 py-1 animate-in fade-in zoom-in-95 duration-150">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          placeholder="%"
                          value={customDiscountValue}
                          autoFocus
                          onChange={(e) => setCustomDiscountValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCustomDiscount();
                            }
                          }}
                          className="w-12 text-xs font-bold px-1.5 py-0.5 bg-white border border-emerald-300 rounded-lg text-emerald-950 focus:outline-hidden focus:ring-1 focus:ring-emerald-600 text-center"
                        />
                        <span className="text-xs font-bold text-emerald-800">%</span>
                        <button
                          type="button"
                          onClick={() => handleApplyCustomDiscount()}
                          className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-colors cursor-pointer"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Merchant Stall / Branch
                    </label>
                    <input
                      type="text"
                      value={merchantStall}
                      onChange={(e) => setMerchantStall(e.target.value)}
                      placeholder="Stall G14 • Imenti House"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      Promotional Badge
                    </label>
                    <select
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    >
                      {PRESET_BADGES.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Dedicated Polymorphic Attribute Engine */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                    4. Dedicated Specifications ({selectedSubcategory})
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Polymorphic attributes validated against domain Zod schema
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full">
                  {activeFields.length} Attributes Defined
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50/70 p-4 rounded-2xl border border-zinc-200/80">
                {activeFields.map((field) => {
                  const currentValue = dynamicAttributes[field.key] || "";

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-zinc-700">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        {field.unit && (
                          <span className="text-xs text-zinc-500 font-mono font-bold">
                            {field.unit}
                          </span>
                        )}
                      </div>

                      {/* Chips / Pills Input */}
                      {field.type === "chips" && field.options ? (
                        <div className="flex flex-wrap gap-1.5">
                          {field.options.map((opt) => {
                            const isSelected = currentValue === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleAttributeChange(field.key, opt)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : field.type === "select" && field.options ? (
                        /* Select Dropdown */
                        <select
                          value={currentValue}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="">Select {field.label}...</option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        /* Text or Number Input */
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={currentValue}
                          placeholder={field.placeholder || `Enter ${field.label}...`}
                          onChange={(e) => handleAttributeChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Photography Studio & Multi-Image Gallery */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                    5. Photography Studio ({images.length} Images)
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    First image will serve as primary storefront hero
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingImage ? "Uploading..." : "📷 Upload Photo"}
                </button>
              </div>

              {/* URL Direct Add */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Add URL
                </button>
              </div>

              {/* Thumbnails Row */}
              <div className="flex flex-wrap gap-3 pt-1">
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-20 h-20 rounded-2xl overflow-hidden border border-zinc-200 group bg-zinc-100 shadow-xs"
                  >
                    <Image
                      src={imgUrl}
                      alt={`Product Photo ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 right-1 bg-emerald-600 text-white text-xs font-black uppercase text-center rounded py-0.5 shadow-xs">
                        Primary
                      </span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                      {idx !== 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          title="Set as primary"
                          className="w-6 h-6 rounded-full bg-white text-zinc-900 text-xs font-bold flex items-center justify-center hover:bg-emerald-100 cursor-pointer"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        title="Delete image"
                        className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center hover:bg-rose-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Color Finishes & Product Variations */}
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                      6. Color & Finish Configuration
                    </h3>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                      {colorOptions.length} Configured
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Configure authentic device finishes or apparel colors with live swatches and photo linking
                  </p>
                </div>

                {colorOptions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setColorOptions([])}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer self-start sm:self-auto"
                  >
                    Clear All Finishes
                  </button>
                )}
              </div>

              {/* Quick Preset Palettes */}
              <div className="bg-zinc-50/80 border border-zinc-200/80 rounded-2xl p-3.5 space-y-2">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 flex items-center justify-between">
                  <span>🎨 One-Click Preset Palettes:</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Click to apply palette finishes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLOR_PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      type="button"
                      onClick={() => handleApplyPalette(palette.colors, "replace")}
                      className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 hover:text-emerald-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                    >
                      {/* Mini Preview Dots */}
                      <div className="flex -space-x-1">
                        {palette.colors.slice(0, 3).map((c, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-white shadow-2xs inline-block"
                            style={{ background: c.bgGradient || c.hex }}
                          />
                        ))}
                      </div>
                      <span>{palette.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Swatches List */}
              {colorOptions.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-zinc-600">
                    Configured Finishes (Assignable to gallery photos):
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {colorOptions.map((opt, idx) => (
                      <div
                        key={opt.name + idx}
                        className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-zinc-300 transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-7 h-7 rounded-full shrink-0 shadow-xs border border-black/10 flex items-center justify-center font-bold text-[10px]"
                            style={{ background: opt.bgGradient || opt.hex }}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-zinc-900 truncate">
                              {opt.name}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                              <span>{opt.hex}</span>
                              {opt.image && (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-sans font-bold flex items-center gap-1">
                                  🖼️ Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {/* Image selector dropdown */}
                          {images.length > 0 && (
                            <select
                              value={opt.image || ""}
                              onChange={(e) => {
                                const chosen = e.target.value;
                                setColorOptions((prev) =>
                                  prev.map((c, i) => (i === idx ? { ...c, image: chosen || undefined } : c))
                                );
                              }}
                              className="text-[10px] bg-white border border-zinc-200 rounded-lg px-2 py-1 text-zinc-700 focus:outline-hidden font-medium"
                              title="Assign specific photograph to this color"
                            >
                              <option value="">No custom image</option>
                              {images.map((img, imgIdx) => (
                                <option key={imgIdx} value={img}>
                                  Photo #{imgIdx + 1}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRemoveColorOption(idx)}
                            className="w-6 h-6 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer text-xs"
                            title="Remove finish"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-50 border border-dashed border-zinc-300 text-center text-xs text-zinc-500">
                  No color options configured yet. Use a preset palette above or add custom finishes below.
                </div>
              )}

              {/* Add Custom Finish Bar */}
              <div className="p-3 bg-zinc-100/70 border border-zinc-200 rounded-2xl space-y-2.5">
                <div className="text-xs font-bold text-zinc-700">Add Custom Color / Finish:</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-5">
                    <input
                      type="text"
                      placeholder="e.g. Natural Titanium, Emerald Green"
                      value={newColorName}
                      onChange={(e) => handleColorNameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddColorOption();
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3 flex items-center gap-1.5">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-zinc-200 cursor-pointer p-0.5 bg-white shrink-0"
                      title="Pick color"
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      placeholder="#000000"
                      className="w-full px-2 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-800 uppercase focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    {images.length > 0 && (
                      <select
                        value={newColorImage}
                        onChange={(e) => setNewColorImage(e.target.value)}
                        className="w-full px-2 py-2 bg-white border border-zinc-200 rounded-xl text-xs text-zinc-700 focus:outline-hidden"
                      >
                        <option value="">Link photo...</option>
                        {images.map((img, imgIdx) => (
                          <option key={imgIdx} value={img}>
                            Photo #{imgIdx + 1}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={handleAddColorOption}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Description & Selling Points */}
            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                7. Product Description & Warranty Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include key details like warranty duration, box contents, or seller guarantees..."
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Validation Errors Notice */}
            {validationErrors.length > 0 && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
                <div className="font-bold">Please correct the following:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-bold transition-all cursor-pointer"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Processing...</span>
                  </>
                ) : activeMode === "manage" ? (
                  <span>💾 Save Changes to Neon DB</span>
                ) : (
                  <span>🚀 Publish to JuroMart Catalog</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Live WYSIWYG Storefront Preview & Neon PostgreSQL JSONB Inspector */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          {/* Preview Tab Selector */}
          <div className="flex items-center justify-between p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200/80">
            <button
              type="button"
              onClick={() => setPreviewTab("card")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                previewTab === "card"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              🛍️ Storefront Card Preview
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("json")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                previewTab === "json"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              🐘 Neon JSONB Inspector
            </button>
          </div>

          {previewTab === "card" ? (
            /* WYSIWYG Card Preview */
            <div className="p-5 rounded-3xl bg-white border border-zinc-200/90 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold tracking-wider uppercase text-zinc-500">
                  Live Marketplace WYSIWYG
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedSubcategory}
                </span>
              </div>

              {/* Image Preview Carousel */}
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-100">
                <Image
                  src={
                    (colorOptions[selectedPreviewColorIndex]?.image) ||
                    images[0] ||
                    "/placeholder.png"
                  }
                  alt={title || "Product Preview"}
                  fill
                  className="object-cover transition-all duration-200"
                />
                {badge && badge !== "None" && (
                  <div className="absolute top-3 left-3 px-3 py-1 bg-amber-400/95 text-zinc-950 font-black text-xs rounded-full shadow-md backdrop-blur-xs">
                    {badge}
                  </div>
                )}
                {discountPercentage > 0 && (
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600 text-white font-black text-xs rounded-full shadow-md">
                    -{discountPercentage}%
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="font-semibold text-emerald-800">{selectedCategory.name}</span>
                  <span className="text-[11px] font-medium truncate max-w-[150px]">
                    📍 {merchantStall}
                  </span>
                </div>

                <h4 className="text-base font-black text-zinc-900 leading-snug line-clamp-2">
                  {title || "Untitled Product Listing"}
                </h4>

                {/* Live Storefront Color Swatches Preview */}
                {colorOptions.length > 0 && (
                  <div className="pt-1.5 pb-0.5">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px]">
                        Finish:{" "}
                        <span className="text-zinc-900 font-extrabold">
                          {colorOptions[selectedPreviewColorIndex]?.name || colorOptions[0]?.name}
                        </span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-medium">
                        {colorOptions.length} finishes
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {colorOptions.map((opt, idx) => {
                        const isSelected = selectedPreviewColorIndex === idx;
                        const isWhite =
                          opt.hex.toLowerCase() === "#ffffff" || opt.hex.toLowerCase() === "#f2f1ed";
                        return (
                          <button
                            key={opt.name + idx}
                            type="button"
                            onClick={() => setSelectedPreviewColorIndex(idx)}
                            className={`w-6 h-6 rounded-full transition-all relative cursor-pointer flex items-center justify-center ${
                              isSelected
                                ? "ring-2 ring-emerald-600 ring-offset-2 scale-110 shadow-xs"
                                : "hover:scale-105 opacity-85 hover:opacity-100"
                            }`}
                            title={opt.name}
                            style={{
                              background: opt.bgGradient || opt.hex,
                              border: isWhite ? "1px solid #d1d5db" : "1px solid rgba(0,0,0,0.12)",
                            }}
                          >
                            {isSelected && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isWhite ? "bg-zinc-900" : "bg-white"
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Price Display */}
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-xl font-black text-zinc-900 font-mono">
                    KES {(Number(basePrice) || 0).toLocaleString()}
                  </span>
                  {originalPrice && Number(originalPrice) > (Number(basePrice) || 0) && (
                    <span className="text-xs text-zinc-400 line-through font-mono">
                      KES {Number(originalPrice).toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Key Dynamic Specifications Chips */}
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {Object.entries(dynamicAttributes)
                    .slice(0, 5)
                    .map(([k, v]) => {
                      if (!v) return null;
                      return (
                        <span
                          key={k}
                          className="text-xs font-bold px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded-md border border-zinc-200"
                        >
                          <span className="capitalize">{k.replace(/_/g, " ")}:</span> {String(v)}
                        </span>
                      );
                    })}
                </div>

                <p className="text-xs text-zinc-500 pt-1 line-clamp-2">
                  {description || "No description provided yet."}
                </p>

                {/* Simulated Order Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 bg-emerald-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 opacity-90"
                  >
                    <span>Instant Boda Dispatch</span>
                    <span>•</span>
                    <span>KES {(Number(basePrice) || 0).toLocaleString()}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* PostgreSQL JSONB Schema Inspector */
            <div className="p-5 rounded-3xl bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  PostgreSQL attributes JSONB
                </span>
                <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800">
                  Valid Schema
                </span>
              </div>
              <pre className="overflow-x-auto p-2 bg-zinc-900/60 rounded-xl max-h-96 text-[11px] leading-relaxed">
                {JSON.stringify(
                  {
                    id: activeMode === "manage" && productId ? productId : `PROD-${selectedCategory.slug.slice(0, 4).toUpperCase()}-...`,
                    name: title || "Untitled",
                    category: selectedCategory.name,
                    subcategory: selectedSubcategory,
                    price: Number(basePrice) || 0,
                    originalPrice: originalPrice ? Number(originalPrice) : null,
                    discountPercentage,
                    badge: badge === "None" ? null : badge,
                    merchantStall,
                    colors: colorOptions.map((c) => c.name),
                    colorOptions: colorOptions,
                    attributes: dynamicAttributes,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
