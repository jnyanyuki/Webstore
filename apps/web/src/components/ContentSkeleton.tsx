"use client";

import React from "react";

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="aspect-[4/5] bg-gray-200/80 w-full relative">
        <div className="absolute bottom-3 left-3 w-20 h-5 bg-gray-300 rounded-md"></div>
      </div>
      <div className="p-5 space-y-3">
        <div className="w-16 h-3 bg-gray-200 rounded"></div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="w-24 h-6 bg-gray-300 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full h-11 bg-gray-200 rounded-xl mt-4"></div>
      </div>
    </div>
  );
}

export function CategoryPillSkeleton() {
  return (
    <div className="flex items-center gap-3 overflow-hidden py-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-10 w-28 bg-gray-200 rounded-xl animate-pulse flex-shrink-0"
        ></div>
      ))}
    </div>
  );
}
