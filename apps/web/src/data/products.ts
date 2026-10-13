// ==============================================================================
// JuroMart Static Frontend Product Catalog
// Zero Database Load • Instant Edge Pre-rendering • Global Image CDN Support
// ==============================================================================

import { ProductItem } from "../components/DynamicProductCard";

export const INITIAL_PRODUCTS: ProductItem[] = [
  // ----------------------------------------------------------------------------
  // 1. Electronics & Gadgets
  // ----------------------------------------------------------------------------
  {
    id: "prod_earbuds",
    name: "Wireless Noise-Canceling Earbuds Pro",
    category: "Electronics",
    price: 4500,
    originalPrice: 5294,
    frontImage: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&q=80",
    merchantStall: "Imenti House • Stall G14",
    badge: "Ready for Pickup",
    variants: [
      { name: "Standard Stereo Edition", priceDelta: 0 },
      { name: "Spatial Audio + ANC (+KES 1,500)", priceDelta: 1500 },
    ],
  },
  {
    id: "prod_macbook",
    name: 'MacBook Air M2 13.6" Liquid Retina',
    category: "Electronics",
    price: 145000,
    originalPrice: 160000,
    frontImage: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80",
    merchantStall: "Kencom House • Suite 12",
    badge: "Verified CBD Merchant",
    variants: [
      { name: "256GB SSD (Included)", priceDelta: 0 },
      { name: "512GB SSD (+KES 12,000)", priceDelta: 12000 },
      { name: "1TB SSD (+KES 28,000)", priceDelta: 28000 },
    ],
  },
  {
    id: "prod_s24_ultra",
    name: "Samsung Galaxy S24 Ultra 5G - 512GB Titanium",
    category: "Electronics",
    price: 158000,
    originalPrice: 175000,
    frontImage: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80",
    merchantStall: "Kimathi Street • Tech Hub 3",
    badge: "Verified CBD Merchant",
    variants: [
      { name: "256GB Titanium Gray", priceDelta: 0 },
      { name: "512GB Titanium Black (+KES 12,000)", priceDelta: 12000 },
    ],
  },
  {
    id: "prod_anker_powerbank",
    name: "Anker 737 Power Bank 24,000mAh 140W Fast Charge",
    category: "Electronics",
    price: 13500,
    originalPrice: 15000,
    frontImage: "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&q=80",
    merchantStall: "Moi Avenue • Shop 18",
    badge: "45-Min Boda Dispatch",
  },
  {
    id: "prod_sony_headphones",
    name: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
    category: "Electronics",
    price: 42000,
    originalPrice: 48000,
    frontImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&q=80",
    merchantStall: "Imenti House • Stall B2",
    badge: "Ready for Pickup",
  },

  // ----------------------------------------------------------------------------
  // 2. Fashion & Streetwear
  // ----------------------------------------------------------------------------
  {
    id: "prod_hoodie",
    name: "Urban Heavyweight Cotton Hoodie - Jet Black",
    category: "Fashion",
    price: 2200,
    originalPrice: 2800,
    frontImage: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&q=80",
    merchantStall: "Afya Centre • Shop 4B",
    badge: "45-Min Boda Dispatch",
    colors: ["#111827", "#059669", "#2563EB"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: "prod_sneakers",
    name: "Retro High Leather Sneakers - White/Pine Green",
    category: "Fashion",
    price: 3800,
    originalPrice: 4500,
    frontImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80",
    merchantStall: "OTC Complex • Stall 8",
    badge: "Ready for Pickup",
    colors: ["#FFFFFF", "#059669", "#111827"],
    sizes: ["39", "40", "41", "42", "43"],
  },
  {
    id: "prod_denim_jacket",
    name: "Vintage Washed Denim Trucker Jacket",
    category: "Fashion",
    price: 3400,
    originalPrice: 4200,
    frontImage: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80",
    merchantStall: "Ronald Ngala • Stall 12",
    badge: "45-Min Boda Dispatch",
    sizes: ["M", "L", "XL"],
  },
  {
    id: "prod_minimal_watch",
    name: "Minimalist Chronograph Watch - Midnight Leather",
    category: "Fashion",
    price: 5800,
    originalPrice: 7200,
    frontImage: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&q=80",
    sideImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&q=80",
    merchantStall: "Tom Mboya Street • Stall 22",
    badge: "Verified CBD Merchant",
  },

  // ----------------------------------------------------------------------------
  // 3. Home & Appliances
  // ----------------------------------------------------------------------------
  {
    id: "prod_airfryer",
    name: "Digital Touch Air Fryer 6.5L - Rapid Air Convection",
    category: "Home & Appliances",
    price: 8900,
    originalPrice: 11500,
    frontImage: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&q=80",
    merchantStall: "River Road • Home Appliance Centre",
    badge: "45-Min Boda Dispatch",
  },
  {
    id: "prod_nutribullet",
    name: "Pro High-Speed Blender 1000W - Matte Black",
    category: "Home & Appliances",
    price: 7500,
    originalPrice: 9000,
    frontImage: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80",
    merchantStall: "Luthuli Avenue • Stall 15",
    badge: "Ready for Pickup",
  },

  // ----------------------------------------------------------------------------
  // 4. Groceries & Specialty
  // ----------------------------------------------------------------------------
  {
    id: "prod_coffee",
    name: "Nairobi Specialty Arabica Single-Origin Coffee Beans 500g",
    category: "Groceries",
    price: 1250,
    originalPrice: 1450,
    frontImage: "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=600&q=80",
    merchantStall: "Kenyatta Avenue • Roasters Corner",
    badge: "Ready for Pickup",
  },
];

// Helper functions for easy frontend querying with ZERO database overhead
export function getProductById(id: string): ProductItem | undefined {
  return INITIAL_PRODUCTS.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): ProductItem[] {
  if (category === "All") return INITIAL_PRODUCTS;
  return INITIAL_PRODUCTS.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}
