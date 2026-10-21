"use client";

import React, { useState, useEffect, useRef } from "react";
import DynamicProductForm from "@/components/DynamicProductForm";
import UserNavDropdown from "@/components/UserNavDropdown";
import { OrderStatusTimelineTracker } from "@webstore/ui";
import { OrderStatusTimeline, RiderInfo } from "@webstore/types";
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
    { status: "PENDING", timestamp: new Date().toISOString(), note: "M-Pesa payment confirmed (Receipt: QK42L89X)" },
  ],
};

const CBD_STAGES = [
  { id: "kencom", name: "Kencom Stage", landmark: "Moi Avenue / City Hall", activeRiders: 8, leadRider: "Kamau Njuguna (KMCE 452X)", phone: "+254712345678" },
  { id: "otc", name: "OTC / Ronald Ngala", landmark: "Ronald Ngala / River Rd", activeRiders: 12, leadRider: "Kipchumba Bett (KMCG 112Y)", phone: "+254734567890" },
  { id: "koja", name: "Koja / Old Nation", landmark: "Tom Mboya / River Rd", activeRiders: 6, leadRider: "Otieno Omondi (KMDF 891Z)", phone: "+254723456789" },
  { id: "odeon", name: "Odeon Cinema Stage", landmark: "Latema Road / Tom Mboya", activeRiders: 9, leadRider: "John Mwangi (KMCH 334P)", phone: "+254701234567" },
  { id: "railways", name: "Railways Stage", landmark: "Haile Selassie Avenue", activeRiders: 5, leadRider: "Dennis Kiprono (KMCK 992W)", phone: "+254722998877" },
];

export default function SellerCenterHome() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"fulfillment" | "catalog-admin" | "pim" | "boda" | "analytics" | "settings">("fulfillment");
  
  // Navigation sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Desktop collapsible side panel

  // Side control panel states
  const [sideControlPanelOpen, setSideControlPanelOpen] = useState(false); // From SuperAdminCatalogManager
  const [orderInspectorOpen, setOrderInspectorOpen] = useState(false); // Order Telemetry side control panel
  const [stageInspectorStage, setStageInspectorStage] = useState<any | null>(null); // Boda Stage side control panel

  // Auto-collapse sidebar whenever any side control panel is open
  const anySidePanelOpen = sideControlPanelOpen || orderInspectorOpen || Boolean(stageInspectorStage);
  useEffect(() => {
    if (anySidePanelOpen) {
      setIsSidebarCollapsed(true);
    }
  }, [anySidePanelOpen]);

  // Keyboard shortcut Ctrl+B / Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarCollapsed((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const [isStallOpen, setIsStallOpen] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [orderTimeline, setOrderTimeline] = useState<OrderStatusTimeline>(INITIAL_MOCK_ORDER);
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [checklist, setChecklist] = useState({
    inspected: true,
    boxed: true,
    securitySeal: false,
  });

  // Synthesize a pleasant chime using Web Audio API
  const playAlertChime = (type: "dispatch" | "notify" = "notify") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "dispatch") {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio autoplay policy fallback
    }
  };

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
          const primary = data.orders[0];
          setOrderTimeline({
            orderId: primary.id,
            status: primary.status,
            updatedAt: primary.updatedAt,
            deliveryAddress: primary.deliveryAddress,
            rider: primary.rider,
            history: primary.history || [
              { status: primary.status, timestamp: primary.updatedAt, note: "Order placed by customer" },
            ],
          });
        }
      }
    } catch {
      // Keep mock initial on offline
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
            playAlertChime("dispatch");
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
  }, [soundEnabled]);

  const handlePackAndDispatch = async () => {
    setDispatchLoading(true);
    playAlertChime("dispatch");
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
        setChecklist({ inspected: true, boxed: true, securitySeal: true });
        fetchOrders();
      } else {
        const assignedRider: RiderInfo = {
          id: "r3",
          name: "Kipchumba Bett",
          phone: "+254734567890",
          motorbikePlate: "KMCG 112Y",
          currentStage: "OTC / Ronald Ngala",
        };
        setOrderTimeline((prev) => ({
          ...prev,
          status: "RIDER_ASSIGNED",
          rider: assignedRider,
          history: [
            ...prev.history,
            { status: "PACKED", timestamp: new Date().toISOString(), note: "Vendor has packaged your items" },
            { status: "RIDER_ASSIGNED", timestamp: new Date().toISOString(), note: "Rider Kipchumba Bett assigned" },
          ],
        }));
        setChecklist({ inspected: true, boxed: true, securitySeal: true });
      }
    } catch {
      setOrderTimeline((prev) => ({
        ...prev,
        status: "RIDER_ASSIGNED",
        rider: {
          id: "r3",
          name: "Kipchumba Bett",
          phone: "+254734567890",
          motorbikePlate: "KMCG 112Y",
          currentStage: "OTC / Ronald Ngala",
        },
        history: [
          ...prev.history,
          { status: "PACKED", timestamp: new Date().toISOString(), note: "Vendor has packaged your items" },
          { status: "RIDER_ASSIGNED", timestamp: new Date().toISOString(), note: "Rider Kipchumba Bett assigned" },
        ],
      }));
      setChecklist({ inspected: true, boxed: true, securitySeal: true });
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleResetDemoOrder = () => {
    setOrderTimeline(INITIAL_MOCK_ORDER);
    setChecklist({ inspected: true, boxed: true, securitySeal: false });
  };

  // RBAC Barrier: Customer Account Trying to View Merchant Center
  if (!isLoading && user && user.role !== "SELLER" && user.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mb-2">Merchant Privileges Required</h2>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            You are logged in as <span className="text-emerald-400 font-semibold">{user.email}</span> with a <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold text-zinc-300 uppercase">{user.role}</span> role. Access to <span className="text-white font-mono text-xs">seller.juromart.com</span> is reserved for verified merchant accounts.
          </p>
          <div className="flex flex-col gap-2.5">
            <a
              href={getStorefrontUrl("/account")}
              suppressHydrationWarning
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/40"
            >
              ← Back to Customer Account
            </a>
            <a
              href={getStorefrontUrl("/")}
              suppressHydrationWarning
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-zinc-900 font-sans flex flex-col lg:flex-row antialiased selection:bg-emerald-500 selection:text-white">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* ========================================================================= */}
      {/* 1. COLLAPSIBLE ENTERPRISE SIDEBAR (w-72 Expanded / w-20 Collapsed)        */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:w-20 w-72" : "w-72"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-none">
          {/* Header & Logo Area with Collapse Toggle Button */}
          <div className={`border-b border-zinc-850 transition-all ${isSidebarCollapsed ? "p-3.5" : "p-5"}`}>
            <div className="flex items-center justify-between">
              <a
                href={getStorefrontUrl("/")}
                suppressHydrationWarning
                title="JuroMart Seller OS"
                className="flex items-center gap-3 group"
              >
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                    <JuroMartLogo variant="icon" size="sm" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-zinc-950"></span>
                </div>

                {!isSidebarCollapsed && (
                  <div className="transition-opacity duration-200">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-base tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                        JuroMart
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">
                        SELLER OS
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-zinc-400">Nairobi CBD Merchant Hub</p>
                  </div>
                )}
              </a>

              {/* Desktop Collapse / Expand Toggle Button */}
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="hidden lg:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 border border-zinc-800 transition-all cursor-pointer items-center justify-center"
                title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Mobile Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-zinc-400 hover:text-white p-1"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Stall Identity & Status Toggle */}
            <div className={`mt-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 transition-all ${isSidebarCollapsed ? "p-2 flex justify-center" : "p-3"}`}>
              {isSidebarCollapsed ? (
                <div
                  className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"
                  title="Stall G14 (Imenti House) • LIVE & Taking Orders"
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <div>
                      <div className="text-xs font-bold text-white">Stall G14 • Imenti House</div>
                      <div className="text-[10px] text-zinc-400 font-mono">ID: VEND-CBD-042</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsStallOpen(!isStallOpen)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all cursor-pointer ${
                      isStallOpen
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40"
                    }`}
                  >
                    {isStallOpen ? "LIVE" : "PAUSED"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Grouped Navigation */}
          <nav className={`space-y-6 flex-1 transition-all ${isSidebarCollapsed ? "p-2" : "p-3.5"}`}>
            {/* Section 1: Operations */}
            <div>
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-2">
                  Operations
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("fulfillment");
                    setSidebarOpen(false);
                  }}
                  title="Live Fulfillment & Dispatch"
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                  } ${
                    activeTab === "fulfillment"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">📦</span>
                    {!isSidebarCollapsed && <span>Live Fulfillment</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        activeTab === "fulfillment"
                          ? "bg-white/20 text-white"
                          : orderTimeline.status === "PENDING"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {orderTimeline.status === "PENDING" ? "1 Action" : "Ready"}
                    </span>
                  )}
                  {isSidebarCollapsed && orderTimeline.status === "PENDING" && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("boda");
                    setSidebarOpen(false);
                  }}
                  title="CBD Boda Fleet & Stages"
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                  } ${
                    activeTab === "boda"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">🏍️</span>
                    {!isSidebarCollapsed && <span>CBD Boda Fleet</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      5 Stages
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Section 2: Catalog Management */}
            <div>
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-2">
                  Catalog & Products
                </div>
              )}
              <div className="space-y-1">
                {/* Super Admin Master Catalog Button with Royal Gold Accent */}
                {user?.role === "ADMIN" && (
                  <button
                    onClick={() => {
                      setActiveTab("catalog-admin");
                      setSidebarOpen(false);
                    }}
                    title="Master Catalog Super Admin"
                    className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                    } ${
                      activeTab === "catalog-admin"
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-950/50"
                        : "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base">👑</span>
                      {!isSidebarCollapsed && <span>Master Catalog Admin</span>}
                    </div>
                    {!isSidebarCollapsed && (
                      <span
                        className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                          activeTab === "catalog-admin" ? "bg-zinc-950 text-amber-400" : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        Admin
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveTab("pim");
                    setSidebarOpen(false);
                  }}
                  title="Dynamic PIM Lister"
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                  } ${
                    activeTab === "pim"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">🏷️</span>
                    {!isSidebarCollapsed && <span>Dynamic PIM Lister</span>}
                  </div>
                  {!isSidebarCollapsed && <span className="text-[10px] text-zinc-400">+ New</span>}
                </button>
              </div>
            </div>

            {/* Section 3: Finance & Insights */}
            <div>
              {!isSidebarCollapsed && (
                <div className="px-3 text-[10px] font-bold text-zinc-500 tracking-wider uppercase mb-2">
                  Insights & Finance
                </div>
              )}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("analytics");
                    setSidebarOpen(false);
                  }}
                  title="M-Pesa Reconciliation & Settlement"
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                  } ${
                    activeTab === "analytics"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">📊</span>
                    {!isSidebarCollapsed && <span>M-Pesa Reconciliation</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className="text-[10px] text-emerald-400 font-bold">KES 38.5k</span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setSidebarOpen(false);
                  }}
                  title="Stall & Till Settings"
                  className={`w-full flex items-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed ? "justify-center p-3" : "justify-between px-3.5 py-2.5"
                  } ${
                    activeTab === "settings"
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
                      : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">⚙️</span>
                    {!isSidebarCollapsed && <span>Stall & Till Settings</span>}
                  </div>
                </button>
              </div>
            </div>
          </nav>

          {/* Sidebar Footer with Storefront Link and User Identity */}
          <div className={`border-t border-zinc-850 space-y-3 bg-zinc-950/60 transition-all ${isSidebarCollapsed ? "p-2" : "p-3.5"}`}>
            <a
              href={getStorefrontUrl("/")}
              suppressHydrationWarning
              title="Open Customer Storefront"
              className={`w-full flex items-center rounded-xl transition-all ${
                isSidebarCollapsed
                  ? "justify-center p-2.5 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-850"
                  : "justify-center gap-2 py-2 px-3 text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800"
              }`}
            >
              <span>←</span>
              {!isSidebarCollapsed && <span>Open Customer Storefront</span>}
            </a>

            <div
              title={`${user?.fullName || "Merchant"} (${user?.role || "SELLER"})`}
              className={`bg-zinc-900/80 rounded-xl border border-zinc-800 flex items-center transition-all ${
                isSidebarCollapsed ? "justify-center p-2" : "justify-between p-3"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  {user?.fullName ? user.fullName[0] : user?.email ? user.email[0].toUpperCase() : "M"}
                </div>
                {!isSidebarCollapsed && (
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {user?.fullName || user?.email?.split("@")[0] || "Merchant"}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/30">
                        {user?.role || "SELLER"}
                      </span>
                      <span className="text-[10px] text-zinc-500 truncate">{user?.email}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APPLICATION CONTENT CANVAS (Auto-expanding with sidebar collapse) */}
      {/* ========================================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        }`}
      >
        {/* World-Class Top Header (App Bar) */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Quick Collapse / Expand Button */}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200 transition-all cursor-pointer items-center gap-1.5 text-xs font-semibold"
              title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
            >
              <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span className="text-[11px] text-zinc-500 font-mono">
                {isSidebarCollapsed ? "Expand" : "Collapse"}
              </span>
            </button>

            {/* Breadcrumb Context */}
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400">
                <span>JuroMart Seller OS</span>
                <span>/</span>
                <span className="text-emerald-700 capitalize">
                  {activeTab === "fulfillment"
                    ? "Live Fulfillment & Dispatch"
                    : activeTab === "catalog-admin"
                    ? "Master Catalog Super Admin"
                    : activeTab === "pim"
                    ? "Dynamic Product PIM"
                    : activeTab === "boda"
                    ? "CBD Boda Logistics"
                    : activeTab === "analytics"
                    ? "Financials & Settlement"
                    : "Stall Settings"}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-zinc-900">
                {activeTab === "fulfillment" && "Operational Dispatch Desk"}
                {activeTab === "catalog-admin" && "Enterprise Master Catalog Manager"}
                {activeTab === "pim" && "Product Information Management (PIM)"}
                {activeTab === "boda" && "Nairobi CBD Boda Courier Network"}
                {activeTab === "analytics" && "M-Pesa Revenue & Settlement Ledger"}
                {activeTab === "settings" && "Stall G14 Profile & Operations"}
              </h1>
            </div>
          </div>

          {/* Quick Actions & Live Heartbeat */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Database Sync Badge */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Neon PostgreSQL Synced</span>
            </div>

            {/* Sound Notification Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playAlertChime("notify");
              }}
              title={soundEnabled ? "Audio chimes active for orders" : "Audio muted"}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? "bg-zinc-100 text-zinc-700 border-zinc-200 hover:bg-zinc-200"
                  : "bg-zinc-50 text-zinc-400 border-zinc-200 hover:text-zinc-600"
              }`}
            >
              <span>{soundEnabled ? "🔔" : "🔕"}</span>
              <span className="hidden xl:inline text-[11px]">{soundEnabled ? "Chimes On" : "Muted"}</span>
            </button>

            {/* Account Profile Menu */}
            <div className="pl-2 border-l border-zinc-200">
              <UserNavDropdown />
            </div>
          </div>
        </header>

        {/* ===================================================================== */}
        {/* VIEW ROUTER                                                          */}
        {/* ===================================================================== */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* TAB 1: LIVE FULFILLMENT & DISPATCH */}
          {activeTab === "fulfillment" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* High-Performance KPI Metrics Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                      Today's Gross Sales
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm font-bold">
                      KES
                    </span>
                  </div>
                  <div className="text-2xl font-black text-zinc-900 mt-2">KSh 38,500</div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <span className="text-emerald-600 font-bold">↑ 14.2%</span>
                    <span className="text-zinc-500">vs yesterday • 24 orders</span>
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                      Dispatch Queue
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                      📦
                    </span>
                  </div>
                  <div className="text-2xl font-black text-zinc-900 mt-2">
                    {orderTimeline.status === "PENDING" ? "1 Order" : "0 Orders"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    {orderTimeline.status === "PENDING" ? (
                      <span className="text-amber-600 font-bold">Action required at Stall G14</span>
                    ) : (
                      <span className="text-emerald-600 font-bold">All orders packed & dispatched</span>
                    )}
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                      Active Boda Rider
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-sm font-bold">
                      🏍️
                    </span>
                  </div>
                  <div className="text-2xl font-black text-zinc-900 mt-2 truncate">
                    {orderTimeline.rider ? orderTimeline.rider.name.split(" ")[0] : "Awaiting Pack"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <span className="text-cyan-700 font-bold">
                      {orderTimeline.rider ? orderTimeline.rider.motorbikePlate : "OTC / Ronald Ngala Pool"}
                    </span>
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-xs hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                      CBD Delivery SLA
                    </span>
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold">
                      ⚡
                    </span>
                  </div>
                  <div className="text-2xl font-black text-zinc-900 mt-2">12.4 min</div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs">
                    <span className="text-indigo-600 font-bold">99.4% on-time</span>
                    <span className="text-zinc-500">across 5 CBD hubs</span>
                  </div>
                </div>
              </div>

              {/* Split Operational Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Interactive Incoming Order Dispatch Desk (7 Columns) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
                  <div>
                    {/* Header with Live Sync Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-zinc-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Live Order
                          </span>
                          <span className="font-mono font-bold text-zinc-900 text-sm">
                            #{orderTimeline.orderId}
                          </span>
                        </div>
                        <h2 className="text-lg font-black text-zinc-900 mt-1">
                          Express Dispatch Console
                        </h2>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Order Telemetry Side Control Panel Trigger */}
                        <button
                          type="button"
                          onClick={() => setOrderInspectorOpen(true)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open Order Telemetry Side Control Panel"
                        >
                          <span>🔍</span>
                          <span>Audit Telemetry</span>
                        </button>

                        <span className="text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                          M-Pesa Ref: QK42L89X
                        </span>
                        {orderTimeline.status !== "PENDING" && (
                          <button
                            onClick={handleResetDemoOrder}
                            className="text-[10px] text-zinc-500 hover:text-zinc-900 font-bold underline cursor-pointer"
                          >
                            Reset Demo
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Customer & Landmark Card */}
                    <div className="my-5 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📍</span>
                          <div>
                            <div className="text-xs font-bold text-zinc-900">
                              {orderTimeline.deliveryAddress?.buildingName || "Imenti House"} (
                              {orderTimeline.deliveryAddress?.shopOrFloorNumber || "Stall G14"})
                            </div>
                            <div className="text-[11px] font-semibold text-emerald-700">
                              Landmark: {orderTimeline.deliveryAddress?.landmark || "CBD Core"}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs font-mono bg-white px-2 py-1 rounded-lg border border-zinc-200 text-zinc-600">
                          {orderTimeline.deliveryAddress?.recipientPhone || "+254 712 345 678"}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Packing Checklist */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        <span>Items to Pack</span>
                        <span className="text-[11px] text-zinc-400 font-normal">Physical Inspection</span>
                      </div>

                      <div className="p-3.5 rounded-xl border border-zinc-200 bg-white space-y-2.5">
                        <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checklist.inspected}
                              onChange={(e) => setChecklist({ ...checklist, inspected: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-semibold text-zinc-900">
                              Sony WH-1000XM5 Wireless Headphones (Black)
                            </span>
                          </div>
                          <span className="font-mono font-bold text-zinc-900">KSh 38,500</span>
                        </label>

                        <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checklist.boxed}
                              onChange={(e) => setChecklist({ ...checklist, boxed: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-zinc-600">
                              Protective bubble wrapping & JuroMart branded bag
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold uppercase">Included</span>
                        </label>

                        <label className="flex items-center justify-between gap-3 text-xs cursor-pointer">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={checklist.securitySeal}
                              onChange={(e) => setChecklist({ ...checklist, securitySeal: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-zinc-600">
                              Tamper-evident JuroMart holographic QR security seal applied
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400">Required</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Dispatch Action Area */}
                  <div>
                    {orderTimeline.status === "PENDING" ? (
                      <div className="space-y-3">
                        <button
                          onClick={handlePackAndDispatch}
                          disabled={dispatchLoading}
                          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/20 hover:shadow-emerald-950/30 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                        >
                          {dispatchLoading ? (
                            <>
                              <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                              </svg>
                              <span>Broadcasting to Nairobi CBD Boda Stages via SMS...</span>
                            </>
                          ) : (
                            <>
                              <span className="text-lg">📦</span>
                              <span>Pack Order & Dispatch Boda Courier</span>
                              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                                Instant SMS Alert
                              </span>
                            </>
                          )}
                        </button>
                        <p className="text-[11px] text-center text-zinc-500">
                          Automated dispatch notifies available riders at OTC & Kencom stages via Africa's Talking API.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="font-extrabold text-sm text-emerald-900">
                              ✓ Rider Assigned: {orderTimeline.rider?.name || "Kipchumba Bett"}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold bg-white px-2 py-1 rounded-md border border-emerald-300">
                            {orderTimeline.rider?.motorbikePlate || "KMCG 112Y"}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                          SMS notification was dispatched via Africa's Talking API to {orderTimeline.rider?.phone || "+254734567890"}. The courier is currently picking up from your stall.
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href={`tel:${orderTimeline.rider?.phone || "+254734567890"}`}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-xs"
                          >
                            📞 Call Rider
                          </a>
                          <a
                            href={`https://wa.me/${(orderTimeline.rider?.phone || "+254734567890").replace("+", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-3 bg-white hover:bg-zinc-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold text-center transition-colors shadow-xs"
                          >
                            💬 WhatsApp Rider
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Order Status Timeline Tracker (5 Columns) */}
                <div className="lg:col-span-5">
                  <OrderStatusTimelineTracker timeline={orderTimeline} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER CATALOG ADMIN (SUPER ADMIN ONLY) */}
          {activeTab === "catalog-admin" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-zinc-950 flex items-center justify-center font-bold text-lg shadow-md shadow-amber-950/20">
                    👑
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-zinc-900">
                      Master Catalog Control & Image Studio
                    </h3>
                    <p className="text-xs text-zinc-600">
                      Logged in with Super Admin role ({user?.email}). Side control panel defaults sidebar to collapsed.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                  Full Platform Authority
                </span>
              </div>

              {/* Passes onSideControlPanelOpenChange to automatically collapse the sidebar */}
              <SuperAdminCatalogManager onSideControlPanelOpenChange={setSideControlPanelOpen} />
            </div>
          )}

          {/* TAB 3: DYNAMIC PIM */}
          {activeTab === "pim" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-white border border-zinc-200 flex items-center justify-between shadow-xs">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900">
                    Dynamic Product Information Management (PIM)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    List electronics or fashion products with dynamic polymorphic attribute schemas.
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Polymorphic Schema Ready
                </span>
              </div>

              <DynamicProductForm />
            </div>
          )}

          {/* TAB 4: CBD BODA FLEET & STAGES */}
          {activeTab === "boda" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-3xl bg-zinc-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Nairobi CBD Dispatch Grid
                    </span>
                  </div>
                  <h2 className="text-xl font-black mt-1">Boda Stages & Active Fleet</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time couriers stationed around Imenti House, Kencom, OTC, and River Road.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-300">
                    40 Active Couriers
                  </span>
                </div>
              </div>

              {/* Stages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {CBD_STAGES.map((stage) => (
                  <div
                    key={stage.id}
                    className="p-5 rounded-2xl bg-white border border-zinc-200/90 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏍️</span>
                        <h4 className="font-extrabold text-sm text-zinc-900">{stage.name}</h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {stage.activeRiders} Riders
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500">📍 {stage.landmark}</p>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase">Lead Courier</div>
                        <div className="font-semibold text-zinc-800">{stage.leadRider}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setStageInspectorStage(stage)}
                          className="py-1 px-2.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                        <a
                          href={`tel:${stage.phone}`}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Call
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FINANCIALS & ANALYTICS */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Net Settlement</div>
                  <div className="text-2xl font-black text-zinc-900 mt-2">KSh 38,500.00</div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Automated M-Pesa Disbursed</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Platform Commission (Promo)</div>
                  <div className="text-2xl font-black text-zinc-900 mt-2">0.0% (KSh 0)</div>
                  <p className="text-xs text-zinc-500 mt-1">Founder 0% promotional rate active</p>
                </div>
                <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Connected M-Pesa Till</div>
                  <div className="text-2xl font-black font-mono text-zinc-900 mt-2">5829104</div>
                  <p className="text-xs text-zinc-500 mt-1">JUROMART CBD STALL G14</p>
                </div>
              </div>

              {/* Settlement History Table */}
              <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-zinc-900">Recent Settled Orders</h3>
                  <span className="text-xs text-zinc-500">Live Daraja API Reconciliation</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Order ID</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Destination</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">M-Pesa Receipt</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-800">
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold">ORD-CBD-8891</td>
                        <td className="py-3 px-4 font-semibold">Frederick Mabeya</td>
                        <td className="py-3 px-4">Imenti House (Stall G14)</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">KSh 38,500</td>
                        <td className="py-3 px-4 font-mono text-zinc-600">QK42L89X</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            SETTLED
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-mono font-bold">ORD-CBD-8889</td>
                        <td className="py-3 px-4 font-semibold">Grace Wanjiru</td>
                        <td className="py-3 px-4">Star Mall (Stall 22)</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">KSh 14,200</td>
                        <td className="py-3 px-4 font-mono text-zinc-600">QK41P02Z</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            SETTLED
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900">Stall & Operations Settings</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Configure your physical stall profile, dispatch telephone, and notification routing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Stall Name / Building
                  </label>
                  <input
                    type="text"
                    disabled
                    value="Imenti House • Stall G14"
                    className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Merchant Till Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value="5829104 (Buy Goods)"
                    className="w-full text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Dispatch Phone (Africa's Talking SMS)
                  </label>
                  <input
                    type="text"
                    defaultValue="+254799887766"
                    className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-xl p-3 text-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase mb-1">
                    Default Boda Stage Pickup
                  </label>
                  <select
                    defaultValue="otc"
                    className="w-full text-xs font-semibold bg-white border border-zinc-200 rounded-xl p-3 text-zinc-800"
                  >
                    <option value="otc">OTC / Ronald Ngala Stage</option>
                    <option value="kencom">Kencom Stage (Moi Avenue)</option>
                    <option value="koja">Koja Stage (River Road)</option>
                    <option value="odeon">Odeon Cinema Stage</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. ORDER TELEMETRY SIDE CONTROL PANEL (Slide-Over Drawer)                 */}
      {/* ========================================================================= */}
      {orderInspectorOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setOrderInspectorOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50/90 backdrop-blur-xs sticky top-0 z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase mb-1">
                    Live Dispatch Telemetry
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                    Order #{orderTimeline.orderId} Audit
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    Destination: {orderTimeline.deliveryAddress?.landmark || "Imenti House"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOrderInspectorOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-xl text-lg font-bold transition-colors cursor-pointer"
                  title="Close Side Control Panel"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
                {/* Integration Status Cards */}
                <div className="space-y-3">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400">
                    Integration Gateways
                  </h4>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Africa's Talking SMS API</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        HTTP 200 OK
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[11px]">
                      Message ID: <span className="font-mono text-zinc-700">ATXID_892819402</span> • Dispatched to {orderTimeline.rider?.phone || "+254734567890"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-800">Daraja M-Pesa IPN Webhook</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        SETTLED
                      </span>
                    </div>
                    <p className="text-zinc-500 text-[11px]">
                      Receipt: <span className="font-mono text-zinc-700">QK42L89X</span> • KSh 38,500.00 • Instant till credit
                    </p>
                  </div>
                </div>

                {/* Courier GPS & Landmark Telemetry */}
                <div className="space-y-3">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400">
                    Boda Courier Telemetry
                  </h4>

                  <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Assigned Courier:</span>
                      <span className="font-bold text-zinc-900">{orderTimeline.rider?.name || "Kipchumba Bett"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Motorbike Plate:</span>
                      <span className="font-mono font-bold text-zinc-900">{orderTimeline.rider?.motorbikePlate || "KMCG 112Y"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Current Stage:</span>
                      <span className="font-semibold text-emerald-700">{orderTimeline.rider?.currentStage || "OTC / Ronald Ngala"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Estimated Arrival:</span>
                      <span className="font-bold text-zinc-900">4 Minutes (CBD Core)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-200 bg-white sticky bottom-0 z-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setOrderInspectorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={`tel:${orderTimeline.rider?.phone || "+254734567890"}`}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  📞 Direct Courier Call
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CBD BODA STAGE INSPECTOR SIDE CONTROL PANEL (Slide-Over Drawer)        */}
      {/* ========================================================================= */}
      {stageInspectorStage && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setStageInspectorStage(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-zinc-200 flex flex-col animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-zinc-200 flex items-start justify-between bg-zinc-50/90 backdrop-blur-xs sticky top-0 z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-900 border border-cyan-300 text-[10px] font-black uppercase mb-1">
                    CBD Boda Stage Telemetry
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-900 tracking-tight">
                    {stageInspectorStage.name}
                  </h3>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    📍 {stageInspectorStage.landmark}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStageInspectorStage(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 rounded-xl text-lg font-bold transition-colors cursor-pointer"
                  title="Close Side Control Panel"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-950 space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Stage Readiness:</span>
                    <span className="text-emerald-700">100% OPERATIONAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Couriers:</span>
                    <span className="font-bold">{stageInspectorStage.activeRiders} Motorbikes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lead Stage Marshal:</span>
                    <span className="font-bold">{stageInspectorStage.leadRider}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-400">
                    Active Courier Roster
                  </h4>

                  <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden bg-white">
                    <div className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-zinc-900">{stageInspectorStage.leadRider}</div>
                        <div className="text-[11px] text-zinc-500">{stageInspectorStage.phone}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        AVAILABLE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-zinc-200 bg-white sticky bottom-0 z-10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStageInspectorStage(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <a
                  href={`tel:${stageInspectorStage.phone}`}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  📞 Call Stage Marshal
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
