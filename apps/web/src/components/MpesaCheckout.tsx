"use client";

import React, { useState, useEffect } from "react";
import type { MpesaStkPushRequest } from "@webstore/types";
import { MarketplaceApiClient } from "@webstore/api-client";

const apiClient = new MarketplaceApiClient();

export default function MpesaCheckout({
  amount,
  cartId,
  onSuccess,
}: {
  amount: number;
  cartId: string;
  onSuccess?: (details: { orderId: string; phone: string }) => void;
}) {
  const [phone, setPhone] = useState("254712345678");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "prompt_sent" | "success" | "error">("idle");
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (status === "prompt_sent" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0 && status === "prompt_sent") {
      setStatus("success");
      if (onSuccess) {
        onSuccess({ orderId: `ORD-${Date.now().toString().slice(-4)}`, phone });
      }
    }
    return () => clearInterval(timer);
  }, [status, countdown, onSuccess, phone]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("loading");

    try {
      const payload: MpesaStkPushRequest = {
        phoneNumber: phone,
        amount,
        accountReference: cartId,
        transactionDesc: "NaiCBD Store Checkout",
      };

      await apiClient.initiateMpesaStkPush(payload);
      setStatus("prompt_sent");
      setCountdown(60);
    } catch (err) {
      console.error(err);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          Pay via M-Pesa Express
        </h3>
        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
          Instant Confirmation
        </span>
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        <div>
          <label htmlFor="phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            M-Pesa Phone Number (+254)
          </label>
          <input
            id="phone"
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-mono font-bold text-gray-900"
            placeholder="2547XXXXXXXX"
            disabled={loading || status === "prompt_sent"}
          />
        </div>

        <div className="flex justify-between items-center text-base font-extrabold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <span>Amount to Pay:</span>
          <span className="text-emerald-700">KSh {amount.toLocaleString()}</span>
        </div>

        {status === "idle" || status === "loading" ? (
          <button
            type="submit"
            disabled={loading || phone.length < 12}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Contacting Safaricom Daraja...
              </span>
            ) : (
              "Send M-Pesa STK Push Prompt"
            )}
          </button>
        ) : null}

        {status === "prompt_sent" && (
          <div className="bg-emerald-50/80 border border-emerald-200 p-5 rounded-2xl text-center space-y-4 animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg border-2 border-emerald-400 animate-bounce">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>

            <div>
              <div className="font-extrabold text-emerald-950 text-base">
                Incoming M-Pesa Prompt Sent!
              </div>
              <p className="text-xs text-emerald-800 mt-1">
                Please enter your M-Pesa PIN on your phone (<span className="font-mono font-bold">{phone}</span>)...
              </p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-xs font-bold text-gray-500">Waiting for PIN entry:</span>
              <span className="text-sm font-black font-mono text-emerald-700 bg-white px-2.5 py-1 rounded-md border border-emerald-200">
                {countdown}s
              </span>
            </div>

            <div className="pt-2 border-t border-emerald-200/60">
              <button
                type="button"
                onClick={handleCheckout}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 underline"
              >
                Didn&apos;t receive prompt? Click to resend STK Push or Pay via Paybill 174379
              </button>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="text-xs text-rose-700 bg-rose-50 p-3.5 rounded-xl border border-rose-200 text-center space-y-2">
            <div>Failed to send M-Pesa prompt to {phone}. Please verify your phone format (e.g. 2547XXXXXXXX).</div>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="text-xs font-bold text-rose-800 underline block mx-auto"
            >
              Try Again
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
