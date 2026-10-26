"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import NairobiDeliverySelector from "./NairobiDeliverySelector";
import MpesaCheckout from "./MpesaCheckout";
import { OrderStatusTimelineTracker } from "@webstore/ui";
import { DeliveryAddress, OrderStatusTimeline } from "@webstore/types";
import { ProductItem } from "./DynamicProductCard";
import { getColorHex, KNOWN_COLOR_MAP, isLightColor } from "@/lib/productColors";
import { useAuth } from "@/context/AuthContext";

const FREE_DELIVERY_THRESHOLD = 5000;

const DEFAULT_DELIVERY_ADDRESS: DeliveryAddress = {
  zone: "CBD Core",
  landmark: "Imenti House",
  buildingName: "Imenti House",
  shopOrFloorNumber: "Stall G14",
  recipientPhone: "254712345678",
};

export type CartItemType = ProductItem & {
  quantity: number;
  selectedVariant?: string;
  selectedColor?: string;
  cartKey?: string;
};

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
  cartItems: CartItemType[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}) {
  const { user, isAuthenticated, isProfileComplete, login, register, updateProfile } = useAuth();
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Authentication gate state
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Registration state
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Profile completion state
  const [profileName, setProfileName] = useState(user?.fullName || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Persistent delivery address from localStorage
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("juromart_delivery_address");
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load delivery address from localStorage", e);
      }
    }
    return DEFAULT_DELIVERY_ADDRESS;
  });

  // Sync address changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("juromart_delivery_address", JSON.stringify(deliveryAddress));
    } catch (e) {
      console.error("Failed to persist delivery address to localStorage", e);
    }
  }, [deliveryAddress]);

  // Sync profile fields with user
  useEffect(() => {
    if (user) {
      if (user.fullName) setProfileName(user.fullName);
      if (user.phone) setProfilePhone(user.phone);
    }
  }, [user]);

  const [activeTimeline, setActiveTimeline] = useState<OrderStatusTimeline | null>(null);

  if (!isOpen) return null;

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const deliveryProgress = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100);
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal);

  const handleAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await login({ email: loginEmail, password: loginPassword });
    } catch (err: any) {
      setAuthError(err?.message || "Invalid email or password. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAuthRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || regName.trim().length < 2) {
      setAuthError("Full name is required (minimum 2 characters)");
      return;
    }
    if (!regPhone.trim() || regPhone.trim().length < 9) {
      setAuthError("Valid phone number is required (for M-Pesa & rider coordination)");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      await register({
        email: regEmail,
        password: regPassword,
        fullName: regName.trim(),
        phone: regPhone.trim(),
      });
      setDeliveryAddress((prev) => ({ ...prev, recipientPhone: regPhone.trim() }));
    } catch (err: any) {
      setAuthError(err?.message || "Registration failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || profileName.trim().length < 2) {
      setProfileError("Full name is required for order delivery");
      return;
    }
    if (!profilePhone.trim() || profilePhone.trim().length < 9) {
      setProfileError("Valid phone number is required (for M-Pesa push)");
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      await updateProfile({
        fullName: profileName.trim(),
        phone: profilePhone.trim(),
      });
      setDeliveryAddress((prev) => ({ ...prev, recipientPhone: profilePhone.trim() }));
    } catch (err: any) {
      setProfileError(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between border-l border-gray-100 animate-slideInRight">
        {/* Cart Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg sm:text-xl text-gray-900">Your Shopping Basket</span>
            <span className="text-xs font-bold bg-[#004f98]/10 text-[#004f98] px-2 py-0.5 rounded-full">
              {cartItems.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-100 p-2 rounded-full transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Top Delivery Location Bar & Saved Address Card */}
        <div className="bg-white border-b border-gray-100 shadow-2xs flex-shrink-0">
          <div className="p-3 sm:p-3.5 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#004f98]/10 text-[#004f98] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Deliver to:</span>
                  <span className="text-[#004f98] font-black">{deliveryAddress.zone}</span>
                </div>
                <p className="text-xs font-bold text-gray-900 truncate">
                  {deliveryAddress.buildingName || deliveryAddress.landmark}
                  {deliveryAddress.shopOrFloorNumber ? ` (${deliveryAddress.shopOrFloorNumber})` : ""}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingAddress((prev) => !prev)}
              className="text-xs font-bold text-[#004f98] hover:text-[#003d75] bg-[#004f98]/10 hover:bg-[#004f98]/20 px-2.5 py-1.5 rounded-lg border border-[#004f98]/20 transition-colors flex-shrink-0 cursor-pointer"
            >
              {isEditingAddress ? "Done" : "Change"}
            </button>
          </div>

          {/* Inline Expandable Address Selector */}
          {isEditingAddress && (
            <div className="p-3 bg-gray-50/80 border-t border-gray-100 animate-in fade-in slide-in-from-top-2 duration-200">
              <NairobiDeliverySelector
                initialAddress={deliveryAddress}
                onAddressChange={(addr) => setDeliveryAddress(addr)}
              />
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(false)}
                  className="bg-[#004f98] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs hover:bg-[#003d75] cursor-pointer"
                >
                  Save &amp; Continue
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Free Delivery Threshold Bar */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 p-3 sm:p-3.5 flex-shrink-0">
          <div className="flex justify-between items-center text-xs font-bold text-emerald-900 mb-1.5">
            <span>
              {remainingForFreeDelivery === 0
                ? "🎉 You've unlocked Free CBD Boda Delivery!"
                : `Add KSh ${remainingForFreeDelivery.toLocaleString()} more for Free CBD Delivery`}
            </span>
            <span>{Math.round(deliveryProgress)}%</span>
          </div>
          <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${deliveryProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Cart Contents / Checkout Step */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTimeline ? (
            <OrderStatusTimelineTracker timeline={activeTimeline} />
          ) : step === "cart" ? (
            cartItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 text-2xl">
                  🛒
                </div>
                <div className="font-bold text-gray-700">Your cart is empty</div>
                <p className="text-xs text-gray-400">Add electronics, fashion, or household items.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cartItems.map((item) => {
                  const itemKey = item.cartKey || item.id;
                  return (
                    <div
                      key={itemKey}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Image
                          src={item.frontImage}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-12 h-12 object-contain bg-white rounded-lg border border-gray-200/60 p-1 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {item.selectedColor && (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-800 bg-white px-2 py-0.5 rounded-full border border-gray-200/90 shadow-2xs">
                                <span
                                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                    isLightColor(getColorHex(item.selectedColor))
                                      ? "border border-gray-300"
                                      : "border border-black/10"
                                  }`}
                                  style={{
                                    background:
                                      KNOWN_COLOR_MAP[item.selectedColor.toLowerCase()]?.bgGradient ||
                                      getColorHex(item.selectedColor),
                                  }}
                                />
                                <span>{item.selectedColor}</span>
                              </span>
                            )}
                            {item.selectedVariant && item.selectedVariant !== item.selectedColor && (
                              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {item.selectedVariant}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-extrabold text-[#004f98] mt-0.5">
                            KSh {item.price.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemKey, -1)}
                            className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(itemKey, 1)}
                            className="px-2 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(itemKey)}
                          className="text-gray-400 hover:text-rose-600 p-1 text-xs cursor-pointer"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Checkout Step */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setStep("cart")}
                className="text-xs font-bold text-[#004f98] hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Back to Cart Items
              </button>

              {/* GATE 1: User Must Be Authenticated */}
              {!isAuthenticated ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#004f98] flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      Sign In to Confirm Order
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sign in or create an account to secure your dispatch &amp; tracking.
                    </p>
                  </div>

                  {/* Auth Mode Toggle */}
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setAuthError(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authMode === "login"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setAuthError(null);
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        authMode === "register"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                    >
                      New Customer
                    </button>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                      {authError}
                    </div>
                  )}

                  {authMode === "login" ? (
                    <form onSubmit={handleAuthLogin} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-[#004f98] hover:bg-[#003d75] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {authLoading ? "Signing In..." : "Sign In & Continue"}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleAuthRegister} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Full Name (for delivery handover)
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. John Kamau"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Phone Number (M-Pesa)
                        </label>
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="2547XXXXXXXX"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="you@domain.com"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full bg-[#004f98] hover:bg-[#003d75] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        {authLoading ? "Creating Account..." : "Create Account & Continue"}
                      </button>
                    </form>
                  )}
                </div>
              ) : !isProfileComplete ? (
                /* GATE 2: User Must Have Completed Minimum Standard Profile */
                <div className="bg-white border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 stroke-[2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">
                        Complete Minimum Delivery Profile
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        To confirm your dispatch and enable M-Pesa push, please provide your recipient name and phone.
                      </p>
                    </div>
                  </div>

                  {profileError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                      {profileError}
                    </div>
                  )}

                  <form onSubmit={handleProfileSubmit} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Full Name (for courier/rider handover)
                      </label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="e.g. John Kamau"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Rider Contact Phone (M-Pesa registered)
                      </label>
                      <input
                        type="text"
                        required
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        placeholder="2547XXXXXXXX"
                        className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#004f98] focus:border-[#004f98] outline-none font-medium"
                      />
                    </div>

                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Account Email:</span>
                        <span className="font-bold text-gray-800">{user?.email || "Shopper"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Zone:</span>
                        <span className="font-bold text-gray-800">{deliveryAddress.zone}</span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="w-full bg-[#004f98] hover:bg-[#003d75] disabled:opacity-50 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {profileLoading ? "Saving Profile..." : "Save Profile & Unlock Payment"}
                    </button>
                  </form>
                </div>
              ) : (
                /* GATE PASSED: Authenticated + Completed Minimum Profile */
                <>
                  {/* Verified Shopper Badge */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                        <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {user?.fullName || "Verified Shopper"}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Verified
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate font-mono">
                          {user?.phone || deliveryAddress.recipientPhone}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setProfileError(null)}
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex-shrink-0"
                    >
                      {user?.email}
                    </button>
                  </div>

                  {/* Confirmed Delivery Destination Card in Checkout */}
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-[#004f98] uppercase tracking-wider flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Delivery Destination
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingAddress(true);
                          setStep("cart");
                        }}
                        className="text-xs font-bold text-[#004f98] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div className="space-y-0.5 text-xs text-gray-800">
                      <p className="font-bold text-gray-900">
                        {deliveryAddress.buildingName}, {deliveryAddress.shopOrFloorNumber}
                      </p>
                      <p className="text-gray-600">
                        Near {deliveryAddress.landmark} • {deliveryAddress.zone}
                      </p>
                      <p className="text-gray-500 font-mono text-[11px]">
                        Recipient Contact: {user?.phone || deliveryAddress.recipientPhone}
                      </p>
                    </div>
                  </div>

                  {/* Instant M-Pesa STK Push Form with prefilled phone */}
                  <MpesaCheckout
                    amount={cartTotal}
                    cartId={`cart_${Date.now()}`}
                    initialPhone={user?.phone || deliveryAddress.recipientPhone}
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer Subtotal & Checkout CTA */}
        {!activeTimeline && cartItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-white space-y-3 flex-shrink-0">
            <div className="flex justify-between items-center text-sm font-bold text-gray-700">
              <span>Subtotal:</span>
              <span className="text-xl font-black text-gray-900">
                KSh {cartTotal.toLocaleString()}
              </span>
            </div>

            {step === "cart" ? (
              <button
                type="button"
                onClick={() => setStep("checkout")}
                className="w-full bg-[#004f98] hover:bg-[#003d75] active:scale-[0.98] text-white font-bold py-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Proceed to Instant Checkout</span>
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
