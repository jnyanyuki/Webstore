/// <reference types="react" />
import React from "react";
import { OrderStatusTimeline, OrderFulfillmentStatus } from "@webstore/types";

// 1. Standardized Currency PriceTag Component
export function PriceTag({ amount, originalAmount }: { amount: number; originalAmount?: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xl font-extrabold text-gray-900">KSh {amount.toLocaleString()}</span>
      {originalAmount && (
        <span className="text-xs text-gray-400 line-through">KSh {originalAmount.toLocaleString()}</span>
      )}
    </div>
  );
}

// 2. Dynamic Attribute Badge Component
export function AttributeBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
      <span className="text-gray-500 mr-1">{label}:</span> {value}
    </span>
  );
}

// 3. Category Mega Menu Component
export function CategoryMegaMenu({ categories, onSelect }: { categories: string[]; onSelect?: (cat: string) => void }) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect && onSelect(cat)}
          className="whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-200 text-gray-700 hover:border-green-600 hover:text-green-600 transition-colors shadow-sm"
        >
          {cat}
        </button>
      ))}
    </nav>
  );
}

// 4. Shared Order Status Timeline Tracker Component
const STEPS: { status: OrderFulfillmentStatus; label: string; description: string }[] = [
  { status: "PENDING", label: "Order Received", description: "Payment confirmed via M-Pesa" },
  { status: "PACKED", label: "Merchant Packed", description: "Vendor has packaged your items" },
  { status: "RIDER_ASSIGNED", label: "Boda Rider Assigned", description: "Rider notified for pickup" },
  { status: "IN_TRANSIT", label: "In Transit", description: "Rider en route to your landmark" },
  { status: "DELIVERED", label: "Delivered", description: "Handed over safely" },
];

export function OrderStatusTimelineTracker({ timeline }: { timeline: OrderStatusTimeline }) {
  const currentStepIndex = STEPS.findIndex((s) => s.status === timeline.status);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Order #{timeline.orderId}</h3>
          <p className="text-xs text-gray-500">Destination: {timeline.deliveryAddress.landmark} ({timeline.deliveryAddress.buildingName})</p>
        </div>
        <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">
          {timeline.status.replace("_", " ")}
        </span>
      </div>

      {timeline.rider && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
              🏍️
            </div>
            <div>
              <div className="font-bold text-gray-900">{timeline.rider.name}</div>
              <div className="text-xs text-gray-600">{timeline.rider.motorbikePlate} • Stage: {timeline.rider.currentStage}</div>
            </div>
          </div>
          <a
            href={`tel:${timeline.rider.phone}`}
            className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Call Rider
          </a>
        </div>
      )}

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-gray-200">
        {STEPS.map((step, idx) => {
          const isCompleted = idx <= currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div key={step.status} className="relative flex items-start gap-4 z-10">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-colors ${
                  isCompleted
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white border-gray-300 text-gray-400"
                } ${isCurrent ? "ring-4 ring-green-100" : ""}`}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className={`font-bold text-sm ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>
                  {step.label}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
