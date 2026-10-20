"use client";

import React from "react";

interface JuroMartLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  inverted?: boolean;
}

export default function JuroMartLogo({
  className = "",
  size = "md",
  variant = "full",
  inverted = false,
}: JuroMartLogoProps) {
  // Dimensions map
  const iconDimensions = {
    sm: { w: 26, h: 26 },
    md: { w: 32, h: 32 },
    lg: { w: 42, h: 42 },
  }[size];

  const textStyles = {
    sm: "text-base tracking-tight",
    md: "text-lg tracking-tight",
    lg: "text-2xl tracking-tight",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Dynamic JuroMart Emblem: Stylized 'J' Shopping Bag + Verified Speed Arrow */}
      <svg
        width={iconDimensions.w}
        height={iconDimensions.h}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 transition-transform duration-200 hover:scale-105"
      >
        <defs>
          <linearGradient id="jmEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="jmAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Outer Bag Handle */}
        <path
          d="M36 28 C36 18, 64 18, 64 28"
          stroke="url(#jmEmeraldGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Shopping Bag contour forming a smooth, dynamic letter 'J' */}
        <path
          d="M26 34 H74 V72 C74 84, 62 92, 48 92 C32 92, 20 82, 20 68 C20 54, 34 50, 44 46"
          stroke="url(#jmEmeraldGrad)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Verified Delivery Speed Arrow (Center upward thrust) */}
        <path
          d="M48 68 L62 48 M62 48 H48 M62 48 V62"
          stroke="url(#jmAccentGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Verified Authenticity Checkmark */}
        <path
          d="M38 72 L44 78 L56 66"
          stroke="#059669"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Typography Wordmark */}
      {variant === "full" && (
        <div className="flex items-center">
          <span
            className={`font-black ${textStyles} ${
              inverted ? "text-white" : "text-gray-900"
            }`}
          >
            Juro<span className="text-emerald-600">Mart</span>
          </span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5"></span>
        </div>
      )}
    </div>
  );
}
