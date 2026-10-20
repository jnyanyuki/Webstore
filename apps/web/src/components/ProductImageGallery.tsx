"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getProductImageUrl } from "@/lib/imageKitUrls";

export type ProductImageInput =
  | {
      front: string;
      side?: string;
    }
  | string[]
  | { url: string; label?: string }[];

interface ProductImageGalleryProps {
  images: ProductImageInput;
  title: string;
}

export default function ProductImageGallery({ images, title }: ProductImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const imageList: string[] = React.useMemo(() => {
    if (Array.isArray(images)) {
      return images.map((item) => (typeof item === "string" ? item : item.url)).filter(Boolean);
    }
    const list = [images.front];
    if (images.side && images.side !== images.front) {
      list.push(images.side);
    }
    return list;
  }, [images]);

  const currentImagePath = imageList[activeImageIndex] || imageList[0] || "";

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

  return (
    <div className="flex flex-col gap-4">
      {/* Main High-Resolution Display */}
      <div
        className="group relative aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
        onClick={() => setIsZoomed(true)}
      >
        <Image
          src={galleryUrl}
          alt={`${title} - View ${activeImageIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 550px"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          priority
        />
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
          <span>🔍 Click to inspect (1600px HD)</span>
        </div>

        {imageList.length > 1 && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {activeImageIndex + 1} / {imageList.length}
          </div>
        )}
      </div>

      {/* Thumbnail Switcher (if multiple images exist) */}
      {imageList.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
          {imageList.map((imgUrl, idx) => {
            const thumbUrl = getProductImageUrl({
              path: imgUrl,
              variant: "thumb",
              quality: 80,
            });
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer bg-white ${
                  activeImageIndex === idx
                    ? "border-emerald-600 ring-2 ring-emerald-600/20 scale-105 shadow-xs"
                    : "border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100"
                }`}
              >
                <Image
                  src={thumbUrl}
                  alt={`${title} - Thumbnail ${idx + 1}`}
                  fill
                  className="object-contain p-1"
                />
              </button>
            );
          })}
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
