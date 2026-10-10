import React from "react";
import Image from "next/image";
import Link from "next/link";
import MpesaCheckout from "@/components/MpesaCheckout";

export const revalidate = 60;

export async function generateStaticParams() {
  return [
    { id: "prod_earbuds" },
    { id: "prod_hoodie" },
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = {
    id,
    title: id === "prod_earbuds" ? "Wireless Noise-Canceling Earbuds" : "Urban Cotton Hoodie - Black",
    price: id === "prod_earbuds" ? 4500 : 2200,
    category: id === "prod_earbuds" ? "Electronics" : "Fashion",
    attributes: id === "prod_earbuds"
      ? { ram: "N/A", battery_life: "24hrs", bluetooth: "v5.3", warranty: "12 months" }
      : { size: "L", color: "Black", material: "100% Organic Cotton" },
    description: "Premium quality item sourced directly from verified Nairobi CBD vendors with instant 45-minute Boda delivery.",
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-green-600 font-bold text-sm flex items-center gap-1 hover:underline">
            ← Back to Storefront
          </Link>
          <span className="text-xs bg-green-100 text-green-800 font-semibold px-2.5 py-1 rounded-full">
            Edge ISR Cached (60s)
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
          <div className="aspect-square bg-gray-100 rounded-xl relative flex items-center justify-center">
            <span className="text-4xl">🛍️</span>
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-green-600 uppercase tracking-wider">{product.category}</span>
              <h1 className="text-3xl font-extrabold text-gray-900 mt-1 mb-3">{product.title}</h1>
              <div className="text-2xl font-black text-gray-900 mb-4">KSh {product.price.toLocaleString()}</div>
              
              <p className="text-sm text-gray-600 mb-6">{product.description}</p>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.attributes).map(([key, val]) => (
                    <div key={key} className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500 capitalize">{key.replace("_", " ")}:</span>
                      <span className="font-semibold text-gray-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <MpesaCheckout amount={product.price} cartId={`pdp_${product.id}`} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
