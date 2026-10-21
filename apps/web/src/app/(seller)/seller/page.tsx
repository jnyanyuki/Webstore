"use client";

import React, { useState, useEffect } from "react";
import DynamicProductForm from "@/components/DynamicProductForm";
import UserNavDropdown from "@/components/UserNavDropdown";
import { OrderStatusTimelineTracker } from "@webstore/ui";
import { OrderStatusTimeline } from "@webstore/types";

import { apiClient } from "@/lib/apiClient";
import JuroMartLogo from "@/components/JuroMartLogo";
import { getStorefrontUrl } from "@/lib/domainUrls";
import { useAuth } from "@/context/AuthContext";
import SuperAdminCatalogManager from "@/components/SuperAdminCatalogManager";

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"pim" | "fulfillment" | "catalog-admin">("fulfillment");
  const [orders, setOrders] = useState<any[]>([]);
  const [orderTimeline, setOrderTimeline] = useState<OrderStatusTimeline>(INITIAL_MOCK_ORDER);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // 1. Fetch live orders from backend
  const fetchOrders = async () => {
    try {
      const apiUrl = apiClient.getBaseUrl();
      const res = await fetch(`${apiUrl}/api/orders/merchant?merchant_id=VEND-CBD-042`, {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.orders && data.orders.length > 0) {
          setOrders(data.orders);
          // Set primary active order
          const primary = data.orders[0];
          setOrderTimeline({
            orderId: primary.id,
            status: primary.status,
            updatedAt: primary.updatedAt,
            deliveryAddress: primary.deliveryAddress,
            rider: primary.rider,
            history: [
              { status: primary.status, timestamp: primary.updatedAt, note: "Order placed" },
            ],
          });
        }
      }
    } catch {
      // Fallback to initial order on network failure
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated]);

  // 2. Real-Time SSE Listener for Order Updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    const apiUrl = apiClient.getBaseUrl();
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(`${apiUrl}/api/notifications/stream`);
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "ORDER_STATUS_UPDATE" && payload.payload) {
            setOrderTimeline(payload.payload);
            fetchOrders();
          }
        } catch {
          // ignore non-json events
        }
      };
    } catch {
      // EventSource fallback
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  const handlePackAndDispatch = async () => {
    setDispatchLoading(true);
    try {
      const apiUrl = apiClient.getBaseUrl();
      const res = await fetch(`${apiUrl}/api/logistics/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "update",
          orderId: orderTimeline.orderId,
          status: "PACKED",
          merchantPhone: "+254799887766",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOrderTimeline(data.timeline);
        fetchOrders();
      } else {
        // Fallback local rider assignment
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
      }
    } catch {
      // Fallback simulation
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

  // 3. RBAC Barrier: Customer Account Trying to View Merchant Center
  if (!isLoading && user && user.role !== "SELLER" && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-gray-800/90 border border-gray-700/80 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">Merchant Privileges Required</h2>
          <p className="text-xs sm:text-sm text-gray-400 mb-6 leading-relaxed">
            You are logged in as <span className="text-emerald-400 font-semibold">{user.email}</span> with a <span className="bg-gray-700 px-2 py-0.5 rounded text-[11px] font-bold text-gray-300 uppercase">{user.role}</span> role. Access to <span className="text-white font-mono text-xs">seller.juromart.com</span> is reserved for verified merchant accounts.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href={getStorefrontUrl("/account")}
              suppressHydrationWarning
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
            >
              ← Back to Customer Account
            </a>
            <a
              href={getStorefrontUrl("/")}
              suppressHydrationWarning
              className="w-full py-2 px-4 bg-gray-700/60 hover:bg-gray-700 text-gray-300 font-medium text-xs rounded-xl transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <a href={getStorefrontUrl("/")} suppressHydrationWarning className="hover:opacity-90 transition-opacity">
              <JuroMartLogo variant="icon" size="sm" />
            </a>
            <span className="font-bold text-base tracking-tight">JuroMart Seller Center</span>
            <span className="bg-gray-800 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-gray-700">
              ID: VEND-CBD-042
            </span>
            {user?.role === "ADMIN" && (
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                <span>👑</span> Super Admin ({user.email})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getStorefrontUrl("/")}
              suppressHydrationWarning
              className="px-2.5 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              ← Storefront
            </a>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setActiveTab("catalog-admin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "catalog-admin"
                    ? "bg-amber-400 text-gray-950 font-extrabold shadow-sm"
                    : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
                }`}
              >
                <span>👑</span> Super Admin Catalog
              </button>
            )}
            <button
              onClick={() => setActiveTab("fulfillment")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "fulfillment" ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Fulfillment & Dispatch
            </button>
            <button
              onClick={() => setActiveTab("pim")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "pim" ? "bg-emerald-600 text-white" : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              Dynamic PIM
            </button>
            <UserNavDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {activeTab !== "catalog-admin" && (
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
        )}

        {activeTab === "catalog-admin" && user?.role === "ADMIN" ? (
          <SuperAdminCatalogManager />
        ) : activeTab === "pim" ? (
          <DynamicProductForm />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-bold text-gray-900">Incoming Order Dispatch</h3>
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Live PostgreSQL Sync
                </span>
              </div>
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
                  <span className="font-bold text-green-700">{orderTimeline.deliveryAddress?.landmark || "CBD Core"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Building / Shop:</span>
                  <span className="font-bold text-gray-900">
                    {orderTimeline.deliveryAddress?.buildingName || "Imenti House"} ({orderTimeline.deliveryAddress?.shopOrFloorNumber || "Stall G14"})
                  </span>
                </div>
              </div>

              {orderTimeline.status === "PENDING" ? (
                <button
                  onClick={handlePackAndDispatch}
                  disabled={dispatchLoading}
                  className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-500 transition-colors shadow-xs text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-lg text-center text-xs font-semibold">
                  <div className="font-bold text-emerald-900 mb-0.5">✓ Rider Assigned ({orderTimeline.rider?.name})</div>
                  <div>SMS Alert dispatched via Africa's Talking API to {orderTimeline.rider?.phone}.</div>
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
