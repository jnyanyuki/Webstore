import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ProductAlertToast } from "@/components/ProductAlertToast";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://juromart.com"),
  title: {
    default: "JuroMart - Nairobi CBD E-Commerce Marketplace & Merchant Portal",
    template: "%s | JuroMart",
  },
  description:
    "JuroMart connects verified Nairobi CBD merchants with express shoppers across Kenya. Sub-45 min Boda dispatch, instant stall pickup, and instant M-Pesa STK Push.",
  keywords: [
    "JuroMart",
    "Nairobi CBD shopping",
    "online shopping Kenya",
    "CBD Boda delivery",
    "M-Pesa marketplace",
    "electronics Nairobi",
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
    title: "JuroMart - Nairobi CBD Express Marketplace",
    description:
      "Shop verified electronics, fashion, and lifestyle items across Nairobi CBD with instant sub-45 min Boda dispatch and M-Pesa.",
    url: "https://juromart.com",
    siteName: "JuroMart",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "JuroMart - Nairobi CBD Express Marketplace",
    description:
      "Shop verified electronics, fashion, and lifestyle items across Nairobi CBD with instant sub-45 min Boda dispatch and M-Pesa.",
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
          {children}
          <ProductAlertToast />
        </AuthProvider>
      </body>
    </html>
  );
}
