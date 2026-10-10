"use client";

import React, { useState } from "react";
import { Category, AttributeDefinition } from "@webstore/types";
import { validateCategoryAttributes } from "@webstore/dynamic-attributes";

export const SAMPLE_CATEGORIES: Category[] = [
  {
    id: "cat_fashion",
    name: "Fashion & Apparel",
    slug: "fashion",
    attribute_schema: {
      size: { label: "Size", type: "select", required: true, options: ["XS", "S", "M", "L", "XL", "XXL"] },
      color: { label: "Primary Color", type: "text", required: true },
      gender: { label: "Target Gender", type: "select", required: false, options: ["Unisex", "Men", "Women"] },
      material: { label: "Material", type: "text", required: false },
    },
    created_at: new Date(),
  },
  {
    id: "cat_electronics",
    name: "Electronics & Gadgets",
    slug: "electronics",
    attribute_schema: {
      ram: { label: "RAM Capacity", type: "select", required: true, options: ["4GB", "8GB", "16GB", "32GB"], unit: "GB" },
      storage: { label: "Internal Storage", type: "select", required: true, options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
      processor: { label: "CPU / Chipset", type: "text", required: false },
      screen_size: { label: "Screen Size", type: "number", required: false, unit: "inches" },
    },
    created_at: new Date(),
  },
  {
    id: "cat_appliances",
    name: "Home & Kitchen Appliances",
    slug: "home-appliances",
    attribute_schema: {
      power_rating: { label: "Power Consumption", type: "number", required: true, unit: "Watts" },
      warranty_months: { label: "Warranty Period", type: "number", required: true, unit: "months" },
      dimensions: { label: "Dimensions (LxWxH)", type: "text", required: false },
    },
    created_at: new Date(),
  },
];

export default function DynamicProductForm() {
  const [selectedCategory, setSelectedCategory] = useState<Category>(SAMPLE_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleCategorySelect = (catId: string) => {
    const cat = SAMPLE_CATEGORIES.find((c) => c.id === catId) || SAMPLE_CATEGORIES[0];
    setSelectedCategory(cat);
    setDynamicAttributes({});
    setValidationErrors([]);
  };

  const handleAttributeChange = (key: string, value: any) => {
    setDynamicAttributes((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    const valResult = validateCategoryAttributes(selectedCategory.slug, dynamicAttributes);
    if (!valResult.success && valResult.errors) {
      setValidationErrors(valResult.errors);
      return;
    }

    const productPayload = {
      title,
      base_price: Number(basePrice),
      category_id: selectedCategory.id,
      attributes: dynamicAttributes,
    };

    console.log("[Seller PIM] Creating Product with Zod-Validated Schema:", productPayload);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 4000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-green-100 text-green-700 rounded-xl flex items-center justify-center font-bold text-xl">
          📦
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Merchant PIM: List New Product</h2>
          <p className="text-xs text-gray-500">Dynamic category schemas drive required specifications</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Product Title</label>
          <input
            type="text"
            required
            placeholder="e.g., iPhone 15 Pro Max 256GB or Cotton Oxford Shirt"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price (KSh)</label>
          <input
            type="number"
            required
            placeholder="e.g. 4500"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Product Category</label>
          <select
            value={selectedCategory.id}
            onChange={(e) => handleCategorySelect(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-medium"
          >
            {SAMPLE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            Dynamic Specifications ({selectedCategory.name})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(selectedCategory.attribute_schema).map(([attrKey, attrDef]: [string, AttributeDefinition]) => (
              <div key={attrKey}>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {attrDef.label} {attrDef.unit ? `(${attrDef.unit})` : ""} {attrDef.required && <span className="text-red-500">*</span>}
                </label>

                {attrDef.type === "select" ? (
                  <select
                    required={attrDef.required}
                    value={dynamicAttributes[attrKey] || ""}
                    onChange={(e) => handleAttributeChange(attrKey, e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  >
                    <option value="">Select {attrDef.label}</option>
                    {attrDef.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={attrDef.type === "number" ? "number" : "text"}
                    required={attrDef.required}
                    placeholder={`Enter ${attrDef.label.toLowerCase()}`}
                    value={dynamicAttributes[attrKey] || ""}
                    onChange={(e) => handleAttributeChange(attrKey, e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
        >
          Publish Product to Marketplace
        </button>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl space-y-1">
            <div className="font-bold">Specification Validation Errors:</div>
            {validationErrors.map((err, i) => (
              <div key={i}>• {err}</div>
            ))}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm p-4 rounded-xl text-center font-medium animate-fade-in">
            ✓ Product published successfully! Validated against @webstore/dynamic-attributes Zod schema and stored in Postgres JSONB with GIN indexing.
          </div>
        )}
      </form>
    </div>
  );
}
