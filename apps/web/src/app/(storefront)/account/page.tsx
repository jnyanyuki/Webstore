"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import JuroMartLogo from "@/components/JuroMartLogo";

export default function AccountPage() {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses">("profile");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-gray-500">Loading your JuroMart account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FBFBFB] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-lg border border-gray-100">
          <h2 className="text-base font-bold text-gray-900 mb-2">Session Expired</h2>
          <p className="text-xs text-gray-500 mb-6">
            Please sign in to view your profile and order history.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-KE", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Recent Member";

  return (
    <div className="min-h-screen bg-[#FBFBFB] text-[#111827]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-90">
              <JuroMartLogo size="sm" />
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-bold text-gray-700">My Account</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-xs font-semibold text-gray-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Back to Store
            </Link>
            <button
              onClick={() => logout()}
              className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Account Banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-gray-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-emerald-400/40">
                {(user.fullName || user.email)[0].toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    {user.fullName || "JuroMart Shopper"}
                  </h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1">{user.email}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Member since {joinDate}</p>
              </div>
            </div>

            {(user.role === "SELLER" || user.role === "ADMIN") && (
              <Link
                href="/seller"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                <span>Merchant Hub Portal</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "orders"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            Express Orders & Deliveries
          </button>
          <button
            onClick={() => setActiveTab("addresses")}
            className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "addresses"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            CBD Pickup Stations & Addresses
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Personal & Security Credentials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Full Name
                </span>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  {user.fullName || "Not specified"}
                </p>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Email Address
                </span>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">{user.email}</p>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Phone (M-Pesa)
                </span>
                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                  {user.phone || "+254 (Not provided)"}
                </p>
              </div>

              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Account Type / Role
                </span>
                <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">Authentication Method</p>
                <p className="text-[11px] text-gray-500">
                  Cross-domain session cookie secured via `.juromart.com` and Render API
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                Active SSL Session
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Fulfillment Timeline
            </h2>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">
                    Rider Assigned
                  </span>
                  <p className="text-xs font-bold text-gray-900 mt-1">Order #ORD-CBD-8891</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-900">KES 4,850</p>
                  <p className="text-[10px] text-gray-500">M-Pesa Verified</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>
                    <strong>Assigned Rider:</strong> Kamau Njuguna (KMCE 452X) • Sub-45m Dispatch
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>
                    <strong>Pickup Destination:</strong> Imenti House Stall G14, CBD Core
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Addresses */}
        {activeTab === "addresses" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Saved Nairobi CBD Drop-off Landmarks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-800">Primary Drop-off</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                    Default
                  </span>
                </div>
                <p className="text-xs font-bold text-gray-900">Imenti House / Kencom Stage</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Zone: CBD Core, Nairobi</p>
                <p className="text-[11px] text-gray-500">Sub-45 min motorcycle courier guaranteed</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 hover:border-emerald-300 transition-colors">
                <span className="text-xs font-bold text-gray-800 block mb-2">Secondary Address</span>
                <p className="text-xs font-bold text-gray-900">Afya Centre Stage</p>
                <p className="text-[11px] text-gray-500 mt-0.5">Zone: CBD Core, Nairobi</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
