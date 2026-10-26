"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import SlideOverCartSheet from "./SlideOverCartSheet";
import CartToast from "./CartToast";

export default function GlobalCartDrawer() {
  const {
    isCartSheetOpen,
    setIsCartSheetOpen,
    cartItems,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <>
      <SlideOverCartSheet
        isOpen={isCartSheetOpen}
        onClose={() => setIsCartSheetOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onClearCart={clearCart}
      />
      <CartToast />
    </>
  );
}
