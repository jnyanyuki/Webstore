"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/imageKitUrls";

interface ProductImageGalleryProps {
  images: {
    front: string;
    side?: string;
  };
  title: string;
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [activeImageKey, setActiveImageKey] = useState<"front" | "side">("front");
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImagePath = activeImageKey === "front" ? images.front : images.side || images.front;

  // 1. High-Quality PDP Gallery URL (900px, 85% quality, Retina)
  const galleryUrl = getProductImageUrl({
    path: currentImagePath,
    variant: "gallery",
    quality: 85,
  });

  // 2. Ultra High-Res Zoom URL for inspect modal (1600px, 90% quality)
  const highResZoomUrl = getProductImageUrl({
    path: currentImagePath,
    variant: "zoom",
    quality: 90,
  });

  // 3. Thumbnails for switcher (150px, 80% quality)
  const frontThumb = getProductImageUrl({
    path: images.front,
    variant: "thumb",
    quality: 80,
  });

  const sideThumb = images.side
    ? getProductImageUrl({
        path: images.side,
        variant: "thumb",
        quality: 80,
      })
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Main High-Resolution Display */}
      <div
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
        onClick={() => setIsZoomed(true)}
      >
        <Image
          src={galleryUrl}
          alt={`${title} - View`}
          fill
          sizes="(max-width: 768px) 100vw, 550px"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          priority
        />
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          <span>🔍 Click to inspect (1600px HD)</span>
        </div>
      </div>

      {/* Thumbnail Switcher (if multiple images exist) */}
      {sideThumb && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveImageKey("front")}
            className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${
              activeImageKey === "front"
                ? "border-green-600 ring-2 ring-green-600/20"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <Image src={frontThumb} alt="Front View Thumbnail" fill className="object-contain p-1" />
          </button>
          <button
            type="button"
            onClick={() => setActiveImageKey("side")}
            className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition-all ${
              activeImageKey === "side"
                ? "border-green-600 ring-2 ring-green-600/20"
                : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <Image src={sideThumb} alt="Side View Thumbnail" fill className="object-contain p-1" />
          </button>
        </div>
      )}

      {/* Full-Screen High-Resolution Inspection Lightbox */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md transition-opacity"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative h-[88vh] w-[90vw] max-w-6xl">
            <Image
              src={highResZoomUrl}
              alt={`${title} - Ultra HD Inspection`}
              fill
              className="object-contain"
              unoptimized
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(false);
              }}
              className="absolute -top-3 -right-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg hover:bg-gray-100 font-bold text-lg"
              aria-label="Close high-res inspection"
            >
              ✕
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/75 px-4 py-1.5 text-xs text-white">
              Retina 2x (1600px, 90% Quality) • Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
