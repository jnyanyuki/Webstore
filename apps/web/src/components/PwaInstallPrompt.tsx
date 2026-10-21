"use client";

import React, { useEffect, useState } from "react";
import JuroMartLogo from "@/components/JuroMartLogo";

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
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 bg-gray-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-gray-800 z-50 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 bg-emerald-950/80 border border-emerald-500/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
          <JuroMartLogo variant="icon" size="sm" />
        </div>
        <div>
          <h4 className="font-bold text-sm tracking-tight">Install JuroMart App</h4>
          <p className="text-xs text-gray-400">Faster shopping & offline mode</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstallClick}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800/60 transition-colors"
          aria-label="Close install prompt"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
