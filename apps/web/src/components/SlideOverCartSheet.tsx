"use client";

import React, { useState } from "react";
import NairobiDeliverySelector from "./NairobiDeliverySelector";
import MpesaCheckout from "./MpesaCheckout";
import { OrderStatusTimelineTracker } from "@webstore/ui";
import { DeliveryAddress, OrderStatusTimeline } from "@webstore/types";
import { ProductItem } from "./DynamicProductCard";

const FREE_DELIVERY_THRESHOLD = 5000;

export default function SlideOverCartSheet({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: {
  isOpen: boolean;
  onClose: () => void;
  cartItems: (ProductItem & { quantity: number })[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}) {
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    zone: "CBD Core",
    landmark: "Imenti House",
    buildingName: "Imenti House",
    shopOrFloorNumber: "Stall G14",
    recipientPhone: "254712345678",
  });
  const [activeTimeline, setActiveTimeline] = useState<OrderStatusTimeline | null>(null);

  if (!isOpen) return null;

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryProgress = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-gray-100 animate-slideInRight">
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-gray-900">Your Shopping Cart</span>
            <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              {cartItems.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="bg-emerald-50/70 border-b border-emerald-100 p-4">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-900 mb-1.5">
            <span>
              {remainingForFreeDelivery === 0
                ? "🎉 You've unlocked Free CBD Boda Delivery!"
                : `Add KSh ${remainingForFreeDelivery.toLocaleString()} more for Free CBD Delivery`}
            </span>
            <span>{Math.round(deliveryProgress)}%</span>
          </div>
          <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${deliveryProgress}%` }}
            ></div>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTimeline ? (
            <OrderStatusTimelineTracker timeline={activeTimeline} />
          ) : step === "cart" ? (
            cartItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 text-2xl">
                  🛒
                </div>
                <div className="font-bold text-gray-700">Your cart is empty</div>
                <p className="text-xs text-gray-400">Add electronics or fashion items from CBD merchants.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.frontImage}
                        alt={item.name}
                        className="w-12 h-12 object-contain bg-white rounded-lg border border-gray-200/60 p-1"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                        <div className="text-xs font-extrabold text-emerald-700 mt-0.5">
                          KSh {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-white border rounded-lg">
                        <button
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-gray-400 hover:text-rose-600 p-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-5">
              <button
                onClick={() => setStep("cart")}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                ← Back to Cart Summary
              </button>

              <NairobiDeliverySelector onAddressChange={(addr) => setDeliveryAddress(addr)} />

              <MpesaCheckout
                amount={cartTotal}
                cartId={`cart_${Date.now()}`}
                onSuccess={({ orderId, phone }) => {
                  setActiveTimeline({
                    orderId,
                    status: "PENDING",
                    updatedAt: new Date().toISOString(),
                    deliveryAddress: { ...deliveryAddress, recipientPhone: phone },
                    history: [
                      {
                        status: "PENDING",
                        timestamp: new Date().toISOString(),
                        note: "M-Pesa payment prompt dispatched",
                      },
                    ],
                  });
                }}
              />
            </div>
          )}
        </div>

        {!activeTimeline && cartItems.length > 0 && (
          <div className="p-5 border-t border-gray-100 bg-white space-y-3">
            <div className="flex justify-between items-center text-sm font-bold text-gray-700">
              <span>Subtotal:</span>
              <span className="text-xl font-black text-gray-900">
                KSh {cartTotal.toLocaleString()}
              </span>
            </div>

            {step === "cart" ? (
              <button
                onClick={() => setStep("checkout")}
                className="w-full bg-gray-900 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
              >
                Proceed to Single-Screen Checkout →
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
