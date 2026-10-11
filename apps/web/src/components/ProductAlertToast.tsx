"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

export interface AlertNotification {
  id: string;
  type: "NOTIFICATION_TOAST";
  event: "PRICE_DROP" | "BACK_IN_STOCK";
  product_id: number;
  product_title: string;
  product_slug: string;
  data: {
    new_price?: number;
    old_price?: number;
    current_price?: number;
    discount_amount?: number;
    discount_percent?: number;
    new_stock?: number;
  };
}

interface ProductAlertToastProps {
  userId?: number;
  wsUrl?: string;
}

export function ProductAlertToast({
  userId = 999,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws/notifications",
}: ProductAlertToastProps) {
  const [toasts, setToasts] = useState<AlertNotification[]>([]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let pingInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      try {
        const fullUrl = `${wsUrl}?user_id=${userId}`;
        socket = new WebSocket(fullUrl);

        socket.onopen = () => {
          pingInterval = setInterval(() => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send("ping");
            }
          }, 25000);
        };

        socket.onmessage = (event) => {
          if (event.data === "pong") return;
          try {
            const payload: AlertNotification = JSON.parse(event.data);
            if (payload.type === "NOTIFICATION_TOAST") {
              const toastItem = {
                ...payload,
                id: `${payload.product_id}-${Date.now()}`,
              };
              setToasts((prev) => [toastItem, ...prev.slice(0, 4)]);

              // Auto dismiss after 7 seconds
              setTimeout(() => {
                setToasts((current) => current.filter((t) => t.id !== toastItem.id));
              }, 7000);
            }
          } catch {
            // Ignore non-json messages
          }
        };

        socket.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          if (isMounted) {
            reconnectTimer = setTimeout(connect, 4000);
          }
        };

        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        if (isMounted) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isMounted = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (pingInterval) clearInterval(pingInterval);
      if (socket) socket.close();
    };
  }, [userId, wsUrl]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full px-4 sm:px-0"
      role="region"
      aria-label="Product Notifications"
    >
      {toasts.map((toast) => {
        const isPriceDrop = toast.event === "PRICE_DROP";
        const price = isPriceDrop ? toast.data.new_price : toast.data.current_price;

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-2xl rounded-xl p-4 flex gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5"
          >
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                isPriceDrop ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              }`}
            >
              {isPriceDrop ? "🏷️" : "📦"}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isPriceDrop
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}
                >
                  {isPriceDrop ? "Price Drop" : "Back in Stock"}
                </span>
                {isPriceDrop && toast.data.discount_percent && (
                  <span className="text-xs font-bold text-emerald-600">
                    -{toast.data.discount_percent}% OFF
                  </span>
                )}
              </div>

              <h4 className="font-semibold text-xs text-gray-900 truncate">
                {toast.product_title}
              </h4>

              <p className="text-xs font-bold text-gray-900 mt-1">
                Now: KES {price?.toLocaleString()}
                {isPriceDrop && toast.data.old_price && (
                  <span className="ml-1.5 font-normal text-gray-400 line-through text-[11px]">
                    KES {toast.data.old_price.toLocaleString()}
                  </span>
                )}
                {!isPriceDrop && toast.data.new_stock && (
                  <span className="ml-1.5 font-normal text-gray-500 text-[11px]">
                    ({toast.data.new_stock} units available)
                  </span>
                )}
              </p>

              <div className="mt-2 flex items-center justify-between">
                <Link
                  href={`/products/${toast.product_slug}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                >
                  View Product &rarr;
                </Link>
                <button
                  onClick={() =>
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id))
                  }
                  className="text-gray-400 hover:text-gray-600 text-xs px-1"
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
