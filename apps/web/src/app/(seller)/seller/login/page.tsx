import React from "react";
import type { Metadata } from "next";
import JuroMartLogo from "@/components/JuroMartLogo";
import { getStorefrontUrl } from "@/lib/domainUrls";
import MerchantLoginForm from "./MerchantLoginForm";

export const metadata: Metadata = {
  title: "Seller Center Sign In | JuroMart Merchant Portal",
  description: "Sign in to JuroMart Merchant Center to manage catalog inventory, fulfill customer orders, and dispatch boda couriers across Nairobi CBD.",
};

interface PageProps {
  searchParams?: Promise<{ redirect?: string }>;
}

export default async function MerchantLoginPage({ searchParams }: PageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const redirectTarget = resolvedParams.redirect || "/";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative">
      {/* Background Decorative Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.15),rgba(255,255,255,0))] pointer-events-none"></div>

      <div className="w-full max-w-md bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
        {/* Subtle emerald ambient glow in card */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-10 -mt-10"></div>

        {/* Header & Logo (Inlined in Initial Server HTML for Instant 0ms LCP) */}
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

        {/* Interactive Form Island */}
        <MerchantLoginForm redirectTarget={redirectTarget} />

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

      <div className="mt-8 text-center text-[11px] text-gray-600">
        <span>© {new Date().getFullYear()} JuroMart Kenya. Secured 256-bit Merchant Gateway.</span>
      </div>
    </div>
  );
}
