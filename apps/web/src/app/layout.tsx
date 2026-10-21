import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProductAlertToast } from "@/components/ProductAlertToast";
import { AuthProvider } from "@/context/AuthContext";
import { ProductCatalogProvider } from "@/context/ProductCatalogContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://juromart.com"),
  title: {
    default: "JuroMart - Express Online Shopping & Fast Doorstep Delivery",
    template: "%s | JuroMart",
  },
  description:
    "Shop verified electronics, fashion, and everyday essentials on JuroMart. Instant dispatch, live tracked fulfillment, and secure instant M-Pesa checkout.",
  keywords: [
    "JuroMart",
    "online shopping Kenya",
    "express delivery Nairobi",
    "instant delivery Kenya",
    "M-Pesa checkout",
    "electronics Kenya",
    "fashion Kenya",
  ],
  authors: [{ name: "JuroMart Kenya" }],
  creator: "JuroMart",
  publisher: "JuroMart",
  formatDetection: {
    email: false,
    address: true,
    telephone: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "JuroMart - Express Online Shopping & Fast Doorstep Delivery",
    description:
      "Shop verified electronics, fashion, and everyday essentials with instant dispatch, live courier tracking, and secure M-Pesa checkout.",
    url: "https://juromart.com",
    siteName: "JuroMart",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JuroMart - Express Online Shopping & Fast Doorstep Delivery",
    description:
      "Shop verified electronics, fashion, and everyday essentials with instant dispatch, live courier tracking, and secure M-Pesa checkout.",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FBFBFB] text-[#111827]">
        <AuthProvider>
          <ProductCatalogProvider>
            {children}
            <ProductAlertToast />
          </ProductCatalogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
