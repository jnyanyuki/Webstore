"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import JuroMartLogo from "@/components/JuroMartLogo";
import { getStorefrontUrl } from "@/lib/domainUrls";

function MerchantLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide your merchant email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const authUser = await login({ email: email.trim(), password });

      // Role Check: Verify merchant privileges
      if (authUser && authUser.role !== "SELLER" && authUser.role !== "ADMIN") {
        setError(
          `Access Denied: Your account (${authUser.email}) has a ${authUser.role} role. Access to the Seller Center requires an approved Merchant/Seller account.`
        );
        setIsSubmitting(false);
        return;
      }

      router.push(redirectTarget);
    } catch (err: any) {
      setError(
        err?.message || "Invalid merchant credentials. Please verify your email and password."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
      {/* Subtle emerald ambient glow in card */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

      {/* Header & Logo */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <a
          href={getStorefrontUrl("/")}
          suppressHydrationWarning
          className="mb-3 inline-block hover:opacity-90 transition-opacity"
        >
          <JuroMartLogo size="md" inverted={true} />
        </a>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider uppercase mb-2">
          <span>Merchant Partner Portal</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Seller Center Sign In
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Manage inventory, fulfill orders, and dispatch boda couriers
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
          <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1 font-medium leading-relaxed">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5" htmlFor="email">
            Merchant Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. stall@juromart.com"
              className="w-full pl-9 pr-3.5 py-2.5 text-xs sm:text-sm bg-gray-800/80 border border-gray-700 rounded-xl focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-gray-300" htmlFor="password">
              Password
            </label>
            <span className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm bg-gray-800/80 border border-gray-700 rounded-xl focus:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all text-white placeholder:text-gray-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Authenticating Merchant...</span>
            </>
          ) : (
            <span>Sign In to Seller Center →</span>
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="mt-6 pt-5 border-t border-gray-800 text-center relative z-10 space-y-3">
        <p className="text-xs text-gray-400">
          Want to sell on JuroMart?{" "}
          <a
            href="mailto:merchants@juromart.com?subject=Merchant%20Stall%20Onboarding"
            className="text-emerald-400 font-semibold hover:underline"
          >
            Apply for Vendor Onboarding
          </a>
        </p>

        <div>
          <a
            href={getStorefrontUrl("/")}
            suppressHydrationWarning
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span>←</span> Back to Customer Storefront
          </a>
        </div>
      </div>
    </div>
  );
}

export default function MerchantLoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative">
      {/* Background Decorative Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none"></div>
      
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 animate-pulse text-center">
            <div className="h-8 bg-gray-800 rounded-lg w-1/2 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-800 rounded w-3/4 mx-auto mb-6"></div>
            <div className="h-10 bg-gray-800 rounded-xl mb-4"></div>
            <div className="h-10 bg-gray-800 rounded-xl"></div>
          </div>
        }
      >
        <MerchantLoginForm />
      </Suspense>

      <div className="mt-8 text-center text-[11px] text-gray-600">
        <span>© {new Date().getFullYear()} JuroMart Kenya. Secured 256-bit Merchant Gateway.</span>
      </div>
    </div>
  );
}
