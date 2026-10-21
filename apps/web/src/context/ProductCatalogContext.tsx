"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { ProductItem } from "@/components/DynamicProductCard";
import { INITIAL_PRODUCTS } from "@/data/products";
import { apiClient } from "@/lib/apiClient";

export interface ProductOverride {
  id: string;
  name?: string;
  category?: string;
  subcategory?: string;
  itemType?: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  description?: string;
  merchantStall?: string;
  frontImage?: string;
  sideImage?: string;
  images?: string[];
  gallery?: { url: string; label?: string }[];
  variants?: { name: string; priceDelta: number }[];
  attributes?: Record<string, any>;
  discountPercentage?: number;
  updatedBy?: string;
  updatedAt?: string;
}

interface ProductCatalogContextType {
  products: ProductItem[];
  overrides: Record<string, ProductOverride>;
  isLoading: boolean;
  createProduct: (data: Partial<ProductOverride> & { name: string; price: number; category: string }) => Promise<{ success: boolean; product?: ProductOverride; message?: string }>;
  updateProduct: (data: Partial<ProductOverride> & { id: string; resetPromotion?: boolean }) => Promise<{ success: boolean; message?: string }>;
  batchResetPromotions: (category?: string, productIds?: string[]) => Promise<{ success: boolean; count?: number; message?: string }>;
  uploadImage: (file: File, productId?: string) => Promise<{ success: boolean; url?: string; message?: string }>;
  refreshOverrides: () => Promise<void>;
  getProductById: (id: string) => ProductItem | undefined;
}

const ProductCatalogContext = createContext<ProductCatalogContextType | undefined>(undefined);

export function ProductCatalogProvider({ children }: { children: React.ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, ProductOverride>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Fetch persistent overrides from PostgreSQL
  const fetchOverrides = useCallback(async () => {
    try {
      const res = await apiClient.get<{ success: boolean; overrides: Record<string, ProductOverride> }>(
        "/api/products/overrides"
      );
      if (res && res.overrides) {
        setOverrides(res.overrides);
      }
    } catch (err) {
      console.warn("[ProductCatalogContext] Could not load product overrides:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverrides();
  }, [fetchOverrides]);

  // 2. Real-Time SSE Listener for catalog updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apiUrl = apiClient.getBaseUrl();
    let es: EventSource | null = null;

    try {
      es = new EventSource(`${apiUrl}/api/notifications/stream`);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "PRODUCT_CATALOG_UPDATED" && data.payload?.product) {
            const p = data.payload.product;
            setOverrides((prev) => ({ ...prev, [p.id]: p }));
          } else if (data.type === "PRODUCT_PROMOTIONS_RESET") {
            fetchOverrides();
          }
        } catch {
          // ignore non-json
        }
      };
    } catch {
      // EventSource fallback
    }

    return () => {
      es?.close();
    };
  }, [fetchOverrides]);

  // 3. Merge INITIAL_PRODUCTS with active overrides and prepend new products
  const products = useMemo(() => {
    const initialMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
    const mergedList: ProductItem[] = [];

    // Prepend newly created products stored in overrides that are not in initial static data
    for (const [id, override] of Object.entries(overrides)) {
      if (!initialMap.has(id)) {
        mergedList.push({
          id: override.id,
          name: override.name || "Untitled Product",
          category: override.category || "General",
          subcategory: override.subcategory || override.category || "General",
          itemType: override.itemType || override.category || "General",
          price: override.price || 0,
          originalPrice: override.originalPrice,
          badge: override.badge,
          description: override.description,
          merchantStall: override.merchantStall || "Stall G14 • Imenti House",
          frontImage: override.frontImage || (override.images && override.images.length > 0 ? override.images[0] : "/placeholder.png"),
          sideImage: override.sideImage || (override.images && override.images.length > 1 ? override.images[1] : override.frontImage || "/placeholder.png"),
          images: override.images || [],
          gallery: override.gallery || [],
          variants: override.variants || [],
          attributes: override.attributes || {},
        } as any);
      }
    }

    // Merge initial products with overrides
    for (const p of INITIAL_PRODUCTS) {
      const override = overrides[p.id];
      if (!override) {
        mergedList.push(p);
      } else {
        mergedList.push({
          ...p,
          name: override.name ?? p.name,
          category: override.category ?? p.category,
          subcategory: override.subcategory ?? p.subcategory,
          itemType: override.itemType ?? p.itemType,
          price: override.price ?? p.price,
          originalPrice: override.originalPrice !== undefined ? override.originalPrice : p.originalPrice,
          badge: override.badge !== undefined ? override.badge : p.badge,
          description: override.description ?? p.description,
          merchantStall: override.merchantStall ?? p.merchantStall,
          frontImage: override.frontImage ?? p.frontImage,
          sideImage: override.sideImage ?? p.sideImage,
          images: override.images ?? p.images,
          gallery: override.gallery ?? p.gallery,
          variants: override.variants ?? p.variants,
          attributes: override.attributes || (p as any).attributes || {},
        } as any);
      }
    }

    return mergedList;
  }, [overrides]);

  // 4. Create & publish new product with dynamic polymorphic attributes (Merchant & Admin)
  const createProduct = async (
    data: Partial<ProductOverride> & { name: string; price: number; category: string }
  ): Promise<{ success: boolean; product?: ProductOverride; message?: string }> => {
    try {
      const res = await apiClient.post<{ success: boolean; product: ProductOverride; message: string }>(
        "/api/products/create",
        data
      );

      if (res && res.success && res.product) {
        setOverrides((prev) => ({ ...prev, [res.product.id]: res.product }));
        return { success: true, product: res.product, message: res.message };
      }
      return { success: false, message: "Failed to publish product" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to publish product" };
    }
  };

  // 5. Update product details & promotions (Super Admin)
  const updateProduct = async (
    data: Partial<ProductOverride> & { id: string; resetPromotion?: boolean }
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await apiClient.post<{ success: boolean; product: ProductOverride; message: string }>(
        "/api/products/update",
        data
      );

      if (res && res.success && res.product) {
        setOverrides((prev) => ({ ...prev, [res.product.id]: res.product }));
        return { success: true, message: res.message };
      }
      return { success: false, message: "Update failed" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to update product" };
    }
  };

  // 5. Batch reset promotions for a category or product IDs
  const batchResetPromotions = async (
    category?: string,
    productIds?: string[]
  ): Promise<{ success: boolean; count?: number; message?: string }> => {
    try {
      const res = await apiClient.post<{ success: boolean; count: number; message: string }>(
        "/api/products/batch-reset-promotions",
        { category, productIds }
      );
      if (res && res.success) {
        await fetchOverrides();
        return { success: true, count: res.count, message: res.message };
      }
      return { success: false, message: "Batch reset failed" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to reset promotions" };
    }
  };

  // 6. Upload product image (Super Admin)
  const uploadImage = async (
    file: File,
    productId?: string
  ): Promise<{ success: boolean; url?: string; message?: string }> => {
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await apiClient.post<{ success: boolean; url: string; error?: string }>(
        "/api/products/upload-image",
        {
          dataUrl,
          filename: file.name,
          productId,
        }
      );

      if (res && res.success && res.url) {
        return { success: true, url: res.url };
      }
      return { success: false, message: res?.error || "Image upload failed" };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to upload image" };
    }
  };

  const getProductById = useCallback(
    (id: string): ProductItem | undefined => {
      return products.find((p) => p.id === id);
    },
    [products]
  );

  return (
    <ProductCatalogContext.Provider
      value={{
        products,
        overrides,
        isLoading,
        createProduct,
        updateProduct,
        batchResetPromotions,
        uploadImage,
        refreshOverrides: fetchOverrides,
        getProductById,
      }}
    >
      {children}
    </ProductCatalogContext.Provider>
  );
}

export function useProductCatalog(): ProductCatalogContextType {
  const context = useContext(ProductCatalogContext);
  if (!context) {
    throw new Error("useProductCatalog must be used within a ProductCatalogProvider");
  }
  return context;
}
