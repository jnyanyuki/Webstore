"use client";

import React from "react";

interface FacetOption {
  value: string;
  count: number;
}

interface FilterGroup {
  key: string;
  label: string;
  options: FacetOption[];
}

export default function CatalogFacets({ facets }: { facets: FilterGroup[] }) {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-5 hidden md:block">
      <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Filters</h3>
      
      <div className="flex flex-col gap-6">
        {facets.map((group) => (
          <div key={group.key}>
            <h4 className="font-semibold text-gray-800 mb-3">{group.label}</h4>
            <div className="flex flex-col gap-2">
              {group.options.map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      className="peer appearance-none w-5 h-5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none checked:bg-green-600 checked:border-green-600 transition-all cursor-pointer"
                    />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                    {option.value}
                  </span>
                  <span className="text-xs text-gray-400 ml-auto bg-gray-50 px-2 py-0.5 rounded-full">
                    {option.count}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
