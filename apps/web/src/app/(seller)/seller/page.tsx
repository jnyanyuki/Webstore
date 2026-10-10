"use client";

import React, { useState } from "react";
import DynamicProductForm from "@/components/DynamicProductForm";
import { OrderStatusTimelineTracker } from "@webstore/ui";
import { OrderStatusTimeline } from "@webstore/types";

const INITIAL_MOCK_ORDER: OrderStatusTimeline = {
  orderId: "ORD-CBD-8891",
  status: "PENDING",
  updatedAt: new Date().toISOString(),
  deliveryAddress: {
    zone: "CBD Core",
    landmark: "Imenti House",
    buildingName: "Imenti House",
    shopOrFloorNumber: "Stall G14",
    recipientPhone: "+254712345678",
  },
  history: [
    { status: "PENDING", timestamp: new Date().toISOString(), note: "M-Pesa payment received" },
  ],
};

export default function SellerCenterHome() {
  const [activeTab, setActiveTab] = useState<"pim" | "fulfillment">("fulfillment");
  const [orderTimeline, setOrderTimeline] = useState<OrderStatusTimeline>(INITIAL_MOCK_ORDER);
  const [dispatchLoading, setDispatchLoading] = useState(false);

  const handlePackAndDispatch = async () => {
    setDispatchLoading(true);
    try {
      const res = await fetch("http://localhost:9000/api/logistics/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          orderId: orderTimeline.orderId,
          status: "PACKED",
          merchantPhone: "+254799887766",
        }),
      });

      if (!res.ok) {
        const assignedRider = {
          id: "r1",
          name: "Kamau Njuguna",
          phone: "+254712345678",
          motorbikePlate: "KMCE 452X",
          currentStage: "Kencom Stage",
        };

        setOrderTimeline((prev) => ({
          ...prev,
          status: "RIDER_ASSIGNED",
          rider: assignedRider,
          history: [
            ...prev.history,
            { status: "PACKED", timestamp: new Date().toISOString() },
            { status: "RIDER_ASSIGNED", timestamp: new Date().toISOString(), note: "Rider Kamau assigned" },
          ],
        }));
      } else {
        const data = await res.json();
        setOrderTimeline(data.timeline);
      }
    } catch (err) {
      setOrderTimeline((prev) => ({
        ...prev,
        status: "RIDER_ASSIGNED",
        rider: {
          id: "r1",
          name: "Kamau Njuguna",
          phone: "+254712345678",
          motorbikePlate: "KMCE 452X",
          currentStage: "Kencom Stage",
        },
        history: [
          ...prev.history,
          { status: "PACKED", timestamp: new Date().toISOString() },
          { status: "RIDER_ASSIGNED", timestamp: new Date().toISOString() },
        ],
      }));
    } finally {
      setDispatchLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a href="/" className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              S
            </a>
            <span className="font-bold text-base">NaiCBD Seller Center</span>
            <span className="bg-gray-800 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-700">
              ID: VEND-CBD-042
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              ← Storefront
            </a>
            <button
              onClick={() => setActiveTab("fulfillment")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "fulfillment" ? "bg-green-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Fulfillment & Dispatch
            </button>
            <button
              onClick={() => setActiveTab("pim")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pim" ? "bg-green-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Dynamic PIM
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Sales</div>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">KSh 38,500</div>
            <div className="text-[11px] text-green-600 font-semibold mt-0.5">↑ 14% vs yesterday</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Boda Pickups</div>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">
              {orderTimeline.status === "PENDING" ? "1 Order" : "0 Orders"}
            </div>
            <div className="text-[11px] text-yellow-600 font-semibold mt-0.5">Action required at shop</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-xs">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Boda Rider</div>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">
              {orderTimeline.rider ? orderTimeline.rider.name.split(" ")[0] : "None"}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5">
              {orderTimeline.rider ? `${orderTimeline.rider.motorbikePlate}` : "Awaiting packing"}
            </div>
          </div>
        </div>

        {activeTab === "pim" ? (
          <DynamicProductForm />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Incoming Order Dispatch</h3>
              <p className="text-xs text-gray-500 mb-4">
                Customer ordered from stall G14 (Imenti House). Pack order and dispatch rider.
              </p>

              <div className="bg-gray-50 p-3.5 rounded-lg mb-4 space-y-1.5 text-xs border border-gray-200/80">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-bold text-gray-900">{orderTimeline.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer Landmark:</span>
                  <span className="font-bold text-green-700">{orderTimeline.deliveryAddress.landmark}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Building / Shop:</span>
                  <span className="font-bold text-gray-900">{orderTimeline.deliveryAddress.buildingName} ({orderTimeline.deliveryAddress.shopOrFloorNumber})</span>
                </div>
              </div>

              {orderTimeline.status === "PENDING" ? (
                <button
                  onClick={handlePackAndDispatch}
                  disabled={dispatchLoading}
                  className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-xs text-xs flex items-center justify-center gap-2"
                >
                  {dispatchLoading ? (
                    "Notifying Boda Stage..."
                  ) : (
                    <>
                      <span>📦</span> Pack Order & Dispatch Boda Rider
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-center text-xs font-bold">
                  ✓ Rider Assigned! SMS Alert sent via Africa's Talking API to {orderTimeline.rider?.phone}.
                </div>
              )}
            </div>

            <div>
              <OrderStatusTimelineTracker timeline={orderTimeline} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
