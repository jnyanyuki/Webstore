import React from "react";
import "./globals.css";

export const metadata = {
  title: "NaiCBD Seller Center",
  description: "Merchant portal for Nairobi CBD vendors",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
