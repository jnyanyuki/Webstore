import { z } from "zod";

export interface AttributeFieldMeta {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "chips";
  required: boolean;
  options?: string[];
  unit?: string;
  placeholder?: string;
  helpText?: string;
}

// 1. Phones & Tablets Schema
export const PhonesTabletsSchema = z.object({
  brand: z.string().min(1, "Brand is required"),
  ram: z.string().min(1, "RAM capacity is required"),
  storage: z.string().min(1, "Internal storage is required"),
  screen_size: z.union([z.string(), z.number()]).optional(),
  battery: z.string().optional(),
  network: z.string().optional(),
  os: z.string().optional(),
  sim_slots: z.string().optional(),
  condition: z.string().optional(),
});

// 2. Computers & Gaming Schema
export const ComputersGamingSchema = z.object({
  device_type: z.string().optional(),
  processor: z.string().min(1, "Processor/CPU is required"),
  ram: z.string().min(1, "RAM capacity is required"),
  storage: z.string().min(1, "Primary storage is required"),
  gpu: z.string().optional(),
  screen_size: z.union([z.string(), z.number()]).optional(),
  os: z.string().optional(),
  refresh_rate: z.string().optional(),
});

// 3. Fashion & Apparel Schema
export const FashionSchema = z.object({
  apparel_type: z.string().min(1, "Apparel or shoe type is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Primary color is required"),
  gender: z.string().optional(),
  material: z.string().optional(),
  fit: z.string().optional(),
  occasion: z.string().optional(),
});

// 4. TVs & Audio Schema
export const TvsAudioSchema = z.object({
  screen_size: z.string().optional(),
  display_tech: z.string().optional(),
  audio_output: z.string().optional(),
  smart_os: z.string().optional(),
  sound_tech: z.string().optional(),
  connectivity: z.string().optional(),
});

// 5. Solar & Power Backup Schema
export const SolarPowerSchema = z.object({
  battery_type: z.string().optional(),
  capacity: z.string().min(1, "Capacity (Wh/Ah) is required"),
  inverter_rating: z.string().optional(),
  voltage: z.string().optional(),
  warranty_years: z.union([z.string(), z.number()]).optional(),
});

// 6. Home Appliances Schema
export const AppliancesSchema = z.object({
  appliance_type: z.string().optional(),
  power_rating: z.union([z.string(), z.number()]).optional(),
  warranty_months: z.union([z.string(), z.number()]).optional(),
  dimensions: z.string().optional(),
  capacity: z.string().optional(),
});

// Backward compatibility alias
export const ElectronicsSchema = PhonesTabletsSchema;
export const ApparelSchema = FashionSchema;

// Registry mapping category slugs & variations to their respective Zod schemas
export const CATEGORY_SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  // Phones & Tablets
  "phones-tablets": PhonesTabletsSchema,
  phones: PhonesTabletsSchema,
  tablets: PhonesTabletsSchema,

  // Computers & Gaming
  "computers-gaming": ComputersGamingSchema,
  computers: ComputersGamingSchema,
  gaming: ComputersGamingSchema,
  laptops: ComputersGamingSchema,
  electronics: PhonesTabletsSchema,

  // Fashion & Apparel
  fashion: FashionSchema,
  "mens-fashion": FashionSchema,
  "womens-fashion": FashionSchema,
  "mens-fashion-shoes": FashionSchema,
  apparel: FashionSchema,
  shoes: FashionSchema,

  // TVs & Audio
  "tvs-audio": TvsAudioSchema,
  audio: TvsAudioSchema,
  tv: TvsAudioSchema,

  // Solar & Power
  "solar-power": SolarPowerSchema,
  "solar-power-backup": SolarPowerSchema,
  solar: SolarPowerSchema,

  // Home Appliances
  "home-appliances": AppliancesSchema,
  appliances: AppliancesSchema,
};

// Rich Category Metadata Definition for Enterprise PIM
export interface PIMCategoryMetadata {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  subcategories: string[];
  fields: AttributeFieldMeta[];
}

export const PIM_CATEGORIES_METADATA: PIMCategoryMetadata[] = [
  {
    id: "cat_phones",
    name: "Phones & Tablets",
    slug: "phones-tablets",
    icon: "📱",
    description: "Smartphones, iPads, Android tablets, smartwatches & mobile accessories",
    subcategories: ["Smartphones", "iPhones", "Tablets & iPads", "Smartwatches", "Feature Phones", "Phone Accessories"],
    fields: [
      { key: "brand", label: "Brand", type: "select", required: true, options: ["Apple", "Samsung", "Google Pixel", "Xiaomi", "Tecno", "Infinix", "Oppo", "Vivo", "Nokia", "Other"] },
      { key: "ram", label: "RAM Capacity", type: "chips", required: true, options: ["4GB", "6GB", "8GB", "12GB", "16GB", "24GB"], unit: "GB" },
      { key: "storage", label: "Internal Storage", type: "chips", required: true, options: ["64GB", "128GB", "256GB", "512GB", "1TB"], unit: "ROM" },
      { key: "screen_size", label: "Screen Size", type: "text", required: false, placeholder: "e.g. 6.7 inches Super Retina XDR" },
      { key: "battery", label: "Battery Capacity", type: "text", required: false, placeholder: "e.g. 5,000 mAh (Fast 45W)" },
      { key: "network", label: "Network Band", type: "select", required: false, options: ["5G Enabled", "4G LTE", "Dual SIM 5G", "Wi-Fi Only"] },
      { key: "os", label: "Operating System", type: "select", required: false, options: ["iOS 18", "Android 15 (One UI)", "Android 14", "iPadOS"] },
      { key: "sim_slots", label: "SIM Configuration", type: "select", required: false, options: ["Dual Physical Nano-SIM", "Physical SIM + eSIM", "Dual eSIM", "Single SIM"] },
      { key: "condition", label: "Item Condition", type: "select", required: true, options: ["Brand New (Factory Sealed)", "Certified Refurbished (Grade A)", "Open Box Like New"] },
    ],
  },
  {
    id: "cat_computers",
    name: "Computers & Gaming",
    slug: "computers-gaming",
    icon: "💻",
    description: "Laptops, MacBooks, gaming consoles, desktop PCs & high-performance GPUs",
    subcategories: ["Laptops", "MacBooks", "Gaming Consoles (PS5/Xbox)", "Desktop PCs", "PC Monitors", "PC Components"],
    fields: [
      { key: "device_type", label: "Device Classification", type: "select", required: true, options: ["Laptop / Ultrabook", "Apple MacBook", "Gaming Laptop", "PlayStation / Xbox Console", "Desktop Workstation", "PC Monitor"] },
      { key: "processor", label: "Processor / CPU", type: "text", required: true, placeholder: "e.g. Apple M3 Pro / Intel Core i7-14700H / AMD Ryzen 9" },
      { key: "ram", label: "RAM Memory", type: "chips", required: true, options: ["8GB", "16GB", "32GB", "64GB", "128GB"] },
      { key: "storage", label: "Storage Drive", type: "select", required: true, options: ["256GB NVMe SSD", "512GB NVMe SSD", "1TB NVMe Gen4 SSD", "2TB NVMe SSD", "1TB HDD + 256GB SSD"] },
      { key: "gpu", label: "Dedicated Graphics / GPU", type: "text", required: false, placeholder: "e.g. NVIDIA RTX 4070 8GB / Apple 18-Core GPU" },
      { key: "screen_size", label: "Display Size & Resolution", type: "text", required: false, placeholder: "e.g. 16.2\" Liquid Retina XDR (120Hz ProMotion)" },
      { key: "os", label: "Pre-installed OS", type: "select", required: false, options: ["macOS Sequoia", "Windows 11 Pro Genuine", "Windows 11 Home", "Ubuntu Linux", "Console OS"] },
      { key: "refresh_rate", label: "Refresh Rate", type: "select", required: false, options: ["60Hz", "120Hz ProMotion", "144Hz Gaming", "165Hz", "240Hz Esports"] },
    ],
  },
  {
    id: "cat_fashion",
    name: "Men's & Women's Fashion",
    slug: "fashion",
    icon: "👟",
    description: "Original sneakers, official shoes, suits, streetwear hoodies, jeans & accessories",
    subcategories: ["Sneakers & Sports Shoes", "Official & Loafers", "T-Shirts & Polos", "Hoodies & Jackets", "Suits & Blazers", "Jeans & Chinos", "Dresses & Skirts"],
    fields: [
      { key: "apparel_type", label: "Apparel / Footwear Type", type: "select", required: true, options: ["Sneakers / Running Shoes", "Official Leather Shoes / Loafers", "T-Shirt / Graphic Tee", "Hoodie / Sweatshirt", "Denim Jeans", "Bespoke Suit / Blazer", "Jacket / Windbreaker", "Dress / Gown"] },
      { key: "size", label: "Size", type: "chips", required: true, options: ["XS", "S", "M", "L", "XL", "XXL", "UK 7 (EU 41)", "UK 8 (EU 42)", "UK 9 (EU 43)", "UK 10 (EU 44)", "UK 11 (EU 45)"] },
      { key: "color", label: "Primary Color", type: "chips", required: true, options: ["Midnight Black", "Pure White", "Navy Blue", "Charcoal Grey", "Olive Green", "Beige / Khaki", "Burgundy Red", "Multi-Color"] },
      { key: "gender", label: "Target Gender", type: "select", required: false, options: ["Men", "Women", "Unisex"] },
      { key: "material", label: "Fabric & Material", type: "text", required: false, placeholder: "e.g. 100% Combed Heavyweight Cotton / Full Grain Italian Leather" },
      { key: "fit", label: "Cut & Fit", type: "select", required: false, options: ["Regular Fit", "Slim Fit", "Oversized Streetwear", "Athletic Fit", "Tailored Fit"] },
      { key: "occasion", label: "Style Occasion", type: "select", required: false, options: ["Casual & Daily", "Formal & Business", "Smart Casual", "Activewear & Gym", "Night Out / Party"] },
    ],
  },
  {
    id: "cat_tvs",
    name: "TVs & Audio Systems",
    slug: "tvs-audio",
    icon: "📺",
    description: "4K Smart TVs, home theatres, soundbars, studio headphones & wireless buds",
    subcategories: ["Smart 4K TVs", "OLED & QLED TVs", "Soundbars & Subwoofers", "Studio Headphones", "Wireless Earbuds", "PA & Bluetooth Speakers"],
    fields: [
      { key: "screen_size", label: "Display Size", type: "select", required: false, options: ["32 inches", "43 inches", "50 inches", "55 inches", "65 inches", "75 inches", "85 inches"] },
      { key: "display_tech", label: "Display Panel Technology", type: "select", required: false, options: ["OLED (Self-Lit Pixels)", "QLED Quantum Dot", "4K Ultra HD LED", "Mini-LED", "Full HD"] },
      { key: "audio_output", label: "RMS Power Output", type: "text", required: false, placeholder: "e.g. 600W RMS / 100W Soundbar" },
      { key: "sound_tech", label: "Surround Sound Format", type: "select", required: false, options: ["Dolby Atmos 5.1.2ch", "DTS:X Spatial Audio", "Dolby Digital Plus", "Stereo 2.1"] },
      { key: "smart_os", label: "Smart TV Platform", type: "select", required: false, options: ["Google TV (Android 14)", "Samsung Tizen OS", "LG webOS 24", "Apple AirPlay 2", "None"] },
      { key: "connectivity", label: "Key Ports & Connectivity", type: "text", required: false, placeholder: "e.g. 4x HDMI 2.1 (eARC), Bluetooth 5.3, Wi-Fi 6" },
    ],
  },
  {
    id: "cat_solar",
    name: "Solar & Power Backup",
    slug: "solar-power",
    icon: "⚡",
    description: "Solar panels, lithium batteries, pure sine wave inverters & portable stations",
    subcategories: ["Solar Inverters", "Lithium LiFePO4 Batteries", "Solar Panels", "Portable Power Stations", "Charge Controllers", "Complete Backup Kits"],
    fields: [
      { key: "battery_type", label: "Battery Chemistry", type: "select", required: true, options: ["Lithium LiFePO4 (6,000+ Cycles)", "Deep Cycle Gel", "Tubular Lead Acid", "AGM Sealed", "Integrated Powerstation"] },
      { key: "capacity", label: "Energy Capacity", type: "text", required: true, placeholder: "e.g. 5.12 kWh / 100Ah 48V / 2400Wh" },
      { key: "inverter_rating", label: "Continuous Inverter Output", type: "select", required: false, options: ["1,000W Pure Sine", "3,000W (3kVA)", "5,000W (5kVA)", "8,000W (8kVA)", "10,000W (10kVA)"] },
      { key: "voltage", label: "System DC Voltage", type: "select", required: false, options: ["48V DC (Standard Home)", "24V DC", "12V DC", "High Voltage 400V"] },
      { key: "warranty_years", label: "Manufacturer Warranty", type: "select", required: false, options: ["10 Years (Tier 1 LiFePO4)", "5 Years", "2 Years", "1 Year"] },
    ],
  },
  {
    id: "cat_appliances",
    name: "Home & Kitchen Appliances",
    slug: "home-appliances",
    icon: "🍳",
    description: "Refrigerators, microwaves, air fryers, washing machines & kitchen tech",
    subcategories: ["Double Door Fridges", "Air Fryers & Ovens", "Microwave Ovens", "Washing Machines", "Blenders & Food Processors", "Electric Pressure Cookers"],
    fields: [
      { key: "appliance_type", label: "Appliance Category", type: "select", required: true, options: ["Double Door Refrigerator", "Digital Air Fryer XXL", "Inverter Microwave", "Front Load Washer", "Commercial Blender", "Smart Electric Cooker"] },
      { key: "capacity", label: "Volume / Capacity", type: "text", required: false, placeholder: "e.g. 260 Litres / 8 Litres / 9 Kg Wash" },
      { key: "power_rating", label: "Power Consumption", type: "text", required: false, placeholder: "e.g. 1800 Watts (Energy Star A+++)" },
      { key: "warranty_months", label: "Official Warranty", type: "select", required: false, options: ["24 Months (2 Years)", "12 Months (1 Year)", "10 Years on Inverter Motor", "6 Months"] },
      { key: "dimensions", label: "Physical Dimensions", type: "text", required: false, placeholder: "e.g. 550 x 600 x 1670 mm" },
    ],
  },
];

/**
 * Validate category-specific polymorphic JSONB attributes before DB write or API submit
 */
export function validateCategoryAttributes(categorySlug: string, attributes: unknown) {
  const schema = CATEGORY_SCHEMA_REGISTRY[categorySlug.toLowerCase()];
  if (!schema) {
    return { success: true, data: attributes };
  }

  const result = schema.safeParse(attributes);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`),
    };
  }

  return { success: true, data: result.data };
}
