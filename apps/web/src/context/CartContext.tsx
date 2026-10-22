"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ProductItem } from "@/components/DynamicProductCard";
import { CartItemType } from "@/components/SlideOverCartSheet";

interface CartContextType {
  cartItems: CartItemType[];
  isCartSheetOpen: boolean;
  setIsCartSheetOpen: (open: boolean) => void;
  addToCart: (
    product: ProductItem,
    quantityToAdd?: number,
    selectedVariant?: string
  ) => void;
  updateQuantity: (cartKeyOrId: string, delta: number) => void;
  removeItem: (cartKeyOrId: string) => void;
  clearCart: () => void;
  totalCartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItemType[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("juromart_cart");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load cart from localStorage", e);
      }
    }
    return [];
  });

  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("juromart_cart", JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to persist cart to localStorage", e);
    }
  }, [cartItems]);

  const addToCart = (
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

  const updateQuantity = (cartKeyOrId: string, delta: number) => {
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

  const removeItem = (cartKeyOrId: string) => {
    setCartItems((prev) => prev.filter((item) => (item.cartKey || item.id) !== cartKeyOrId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartSheetOpen,
        setIsCartSheetOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        totalCartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
