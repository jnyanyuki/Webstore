"use client";

import React from "react";

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 overflow-hidden animate-pulse flex flex-col justify-between h-full">
      <div className="flex flex-col flex-1 justify-between">
        {/* 4:5 Aspect Ratio Image Skeleton */}
        <div className="relative aspect-[4/5] w-full bg-gray-200/80 flex items-center justify-center p-3">
          <div className="absolute top-2.5 left-2.5 w-16 h-4 bg-gray-300/80 rounded-full"></div>
          <div className="w-2/3 h-2/3 bg-gray-300/50 rounded-xl"></div>
        </div>

        {/* Content Skeleton */}
        <div className="p-2.5 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <div className="w-14 h-3 bg-gray-200 rounded"></div>
              <div className="w-12 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-full h-3.5 bg-gray-200 rounded"></div>
            <div className="w-3/4 h-3.5 bg-gray-200 rounded"></div>
            <div className="w-24 h-5 bg-gray-300/80 rounded mt-1"></div>
          </div>

          {/* Pack Options Skeleton */}
          <div className="pt-1 flex items-center gap-1.5">
            <div className="w-12 h-5 bg-gray-200 rounded-md"></div>
            <div className="w-16 h-5 bg-gray-200 rounded-md"></div>
            <div className="w-16 h-5 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>

      {/* Action Footer Skeleton */}
      <div className="px-2.5 pb-2.5 sm:px-3.5 sm:pb-3.5 pt-2 border-t border-gray-100 bg-gray-50/40">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="w-16 sm:w-18 h-7 sm:h-8 bg-gray-200 rounded-lg sm:rounded-xl"></div>
          <div className="flex-1 h-7 sm:h-8 bg-gray-300/80 rounded-lg sm:rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

export function CategoryPillSkeleton() {
  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-hidden py-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="h-8 sm:h-9 w-24 sm:w-28 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"
        ></div>
      ))}
    </div>
  );
}
