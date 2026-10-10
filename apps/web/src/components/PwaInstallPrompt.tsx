"use client";

import React, { useEffect, useState } from "react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").then(
          (registration) => {
            console.log("[PWA] ServiceWorker registered with scope:", registration.scope);
          },
          (err) => {
            console.error("[PWA] ServiceWorker registration failed:", err);
          }
        );
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] Install prompt outcome: ${outcome}`);
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-gray-900 text-white p-4 rounded-2xl shadow-2xl border border-gray-800 z-50 flex items-center justify-between animate-bounce">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center font-bold text-lg">
          N
        </div>
        <div>
          <h4 className="font-bold text-sm">Install NaiCBD App</h4>
          <p className="text-xs text-gray-400">Faster shopping & offline mode</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-white p-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
