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

// ==============================================================================
// 1. DEDICATED DOMAIN ZOD SCHEMAS (Covering All Catalog Categories & Subcategories)
// ==============================================================================

// 1. Phones & Tablets Schema (Smartphones, Accessories, Wearables, Parts)
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
  camera_specs: z.string().optional(),
  fast_charging: z.string().optional(),
});

// 2. Computers & Gaming Schema (Laptops, PCs, Consoles, Hardware, Peripherals)
export const ComputersGamingSchema = z.object({
  device_type: z.string().optional(),
  processor: z.string().min(1, "Processor/CPU is required"),
  ram: z.string().min(1, "RAM capacity is required"),
  storage: z.string().min(1, "Primary storage is required"),
  gpu: z.string().optional(),
  screen_size: z.union([z.string(), z.number()]).optional(),
  os: z.string().optional(),
  refresh_rate: z.string().optional(),
  form_factor: z.string().optional(),
  ports_connectivity: z.string().optional(),
});

// 3. TVs & Audio Schema (Televisions, Audio & Headphones, Sound Systems, Projectors)
export const TvsAudioSchema = z.object({
  screen_size: z.string().optional(),
  display_tech: z.string().optional(),
  audio_output: z.string().optional(),
  smart_os: z.string().optional(),
  sound_tech: z.string().optional(),
  connectivity: z.string().optional(),
  noise_cancellation: z.string().optional(),
  battery_life: z.string().optional(),
});

// 4. Home Appliances Schema (Kitchen, Cooling, Heavy, Laundry, Climate)
export const AppliancesSchema = z.object({
  appliance_type: z.string().optional(),
  capacity: z.string().optional(),
  power_rating: z.union([z.string(), z.number()]).optional(),
  energy_rating: z.string().optional(),
  warranty_months: z.union([z.string(), z.number()]).optional(),
  dimensions: z.string().optional(),
  inverter_tech: z.string().optional(),
});

// 5. Solar & Power Backup Schema (Solar Systems, Inverters, Batteries, Generators)
export const SolarPowerSchema = z.object({
  battery_type: z.string().optional(),
  capacity: z.string().min(1, "Capacity (Wh/Ah/kWh) is required"),
  inverter_rating: z.string().optional(),
  voltage: z.string().optional(),
  warranty_years: z.union([z.string(), z.number()]).optional(),
  cycle_life: z.string().optional(),
  solar_input: z.string().optional(),
});

// 6. Fashion & Clothing Schema (Men's & Women's Clothing, Underwear, Loungewear)
export const FashionClothingSchema = z.object({
  apparel_type: z.string().min(1, "Apparel type is required"),
  size: z.string().min(1, "Size is required"),
  color: z.string().min(1, "Primary color is required"),
  gender: z.string().optional(),
  material: z.string().optional(),
  fit: z.string().optional(),
  occasion: z.string().optional(),
  season: z.string().optional(),
});

// 7. Footwear & Shoes Schema (Men's Footwear, Women's Shoes)
export const FootwearSchema = z.object({
  shoe_type: z.string().min(1, "Shoe type is required"),
  shoe_size: z.string().min(1, "Shoe size is required"),
  color: z.string().min(1, "Color is required"),
  upper_material: z.string().optional(),
  sole_material: z.string().optional(),
  closure_type: z.string().optional(),
  gender: z.string().optional(),
});

// 8. Watches, Jewelry & Optics Schema
export const WatchesJewelrySchema = z.object({
  item_type: z.string().optional(),
  movement_type: z.string().optional(),
  material_composition: z.string().optional(),
  water_resistance: z.string().optional(),
  strap_band_type: z.string().optional(),
  lens_protection: z.string().optional(),
  gender: z.string().optional(),
});

// 9. Furniture & Home Living Schema
export const FurnitureHomeSchema = z.object({
  product_type: z.string().optional(),
  primary_material: z.string().optional(),
  dimensions: z.string().optional(),
  color_finish: z.string().optional(),
  assembly_required: z.string().optional(),
  seating_capacity: z.string().optional(),
});

// 10. Beauty, Health & Personal Care Schema
export const HealthBeautySchema = z.object({
  device_type: z.string().optional(),
  power_source: z.string().optional(),
  skin_hair_type: z.string().optional(),
  heat_speed_levels: z.string().optional(),
  waterproof_rating: z.string().optional(),
  volume_capacity: z.string().optional(),
});

// 11. Automotive & Hardware Schema
export const AutomotiveHardwareSchema = z.object({
  equipment_type: z.string().optional(),
  voltage_power: z.string().optional(),
  compatibility: z.string().optional(),
  material_grade: z.string().optional(),
  safety_certification: z.string().optional(),
});

// 12. Smart Home & Security Schema
export const SmartHomeSecuritySchema = z.object({
  resolution: z.string().optional(),
  connectivity_protocol: z.string().optional(),
  power_source: z.string().optional(),
  weatherproof_rating: z.string().optional(),
  unlock_method: z.string().optional(),
  storage_support: z.string().optional(),
});

// 13. Sports, Fitness & Outdoor Schema
export const SportsFitnessSchema = z.object({
  equipment_type: z.string().optional(),
  weight_capacity: z.string().optional(),
  resistance_levels: z.string().optional(),
  frame_material: z.string().optional(),
  user_level: z.string().optional(),
});

// 14. Baby, Kids & Toys Schema
export const BabyKidsToysSchema = z.object({
  age_group: z.string().optional(),
  safety_standard: z.string().optional(),
  material: z.string().optional(),
  weight_limit: z.string().optional(),
  battery_required: z.string().optional(),
});

// 15. Office, Music & Creative Schema
export const OfficeCreativeSchema = z.object({
  gear_type: z.string().optional(),
  connectivity: z.string().optional(),
  output_ports: z.string().optional(),
  medium_material: z.string().optional(),
});

// Backward compatibility alias exports
export const ElectronicsSchema = PhonesTabletsSchema;
export const FashionSchema = FashionClothingSchema;
export const ApparelSchema = FashionClothingSchema;

// ==============================================================================
// 2. SCHEMA REGISTRY (Mapping all category slugs & aliases)
// ==============================================================================
export const CATEGORY_SCHEMA_REGISTRY: Record<string, z.ZodSchema> = {
  // Phones, Tablets & Accessories
  "phones-tablets": PhonesTabletsSchema,
  "smartphones-devices": PhonesTabletsSchema,
  "mobile-accessories": PhonesTabletsSchema,
  "smart-wearables": PhonesTabletsSchema,
  "parts-tools": PhonesTabletsSchema,
  phones: PhonesTabletsSchema,
  tablets: PhonesTabletsSchema,

  // Computers & Gaming
  "computers-gaming": ComputersGamingSchema,
  "laptops-computers": ComputersGamingSchema,
  "components-hardware": ComputersGamingSchema,
  "peripherals-storage": ComputersGamingSchema,
  "gaming-consoles": ComputersGamingSchema,
  "networking-office-tech": ComputersGamingSchema,
  computers: ComputersGamingSchema,
  gaming: ComputersGamingSchema,
  laptops: ComputersGamingSchema,
  electronics: PhonesTabletsSchema,

  // TVs, Audio & Entertainment
  "tvs-audio": TvsAudioSchema,
  televisions: TvsAudioSchema,
  "audio-headphones": TvsAudioSchema,
  "sound-systems-hi-fi": TvsAudioSchema,
  "projectors-tv-accessories": TvsAudioSchema,
  audio: TvsAudioSchema,
  tv: TvsAudioSchema,

  // Home & Kitchen Appliances
  "home-appliances": AppliancesSchema,
  "small-kitchen-appliances": AppliancesSchema,
  "cooling-refrigeration": AppliancesSchema,
  "cooking-heavy-appliances": AppliancesSchema,
  "laundry-garment-care": AppliancesSchema,
  "climate-control-air-care": AppliancesSchema,
  appliances: AppliancesSchema,

  // Solar & Energy
  "solar-power": SolarPowerSchema,
  "solar-power-backup": SolarPowerSchema,
  "solar-systems": SolarPowerSchema,
  "inverters-storage-batteries": SolarPowerSchema,
  "backup-generators-protection": SolarPowerSchema,
  solar: SolarPowerSchema,

  // Fashion & Apparel
  fashion: FashionClothingSchema,
  "mens-clothing": FashionClothingSchema,
  "womens-apparel": FashionClothingSchema,
  "underwear-loungewear": FashionClothingSchema,
  "mens-accessories": FashionClothingSchema,
  "handbags-wallets": FashionClothingSchema,
  "lingerie-shapewear": FashionClothingSchema,
  apparel: FashionClothingSchema,

  // Footwear
  "mens-footwear": FootwearSchema,
  "womens-shoes": FootwearSchema,
  shoes: FootwearSchema,
  footwear: FootwearSchema,

  // Watches, Jewelry & Optics
  watches: WatchesJewelrySchema,
  "fine-fashion-jewelry": WatchesJewelrySchema,
  "eyewear-optics": WatchesJewelrySchema,
  "luggage-travel-bags": WatchesJewelrySchema,

  // Furniture & Home Living
  furniture: FurnitureHomeSchema,
  "cookware-dining": FurnitureHomeSchema,
  "home-decor-lighting": FurnitureHomeSchema,
  "bedding-bath": FurnitureHomeSchema,
  "storage-home-organization": FurnitureHomeSchema,

  // Beauty & Personal Care
  "hair-care-styling-tools": HealthBeautySchema,
  "skincare-wellness-devices": HealthBeautySchema,
  "oral-care-shaving": HealthBeautySchema,
  "makeup-accessories-scent": HealthBeautySchema,

  // Automotive & Hardware
  "car-electronics-safety": AutomotiveHardwareSchema,
  "interior-exterior-accessories": AutomotiveHardwareSchema,
  "motorcycle-gear": AutomotiveHardwareSchema,
  "power-tools-workshop": AutomotiveHardwareSchema,
  "hand-tools-hardware": AutomotiveHardwareSchema,

  // Smart Home & Security
  "cctv-security-surveillance": SmartHomeSecuritySchema,
  "smart-locks-access": SmartHomeSecuritySchema,
  "smart-home-automation": SmartHomeSecuritySchema,

  // Sports & Outdoors
  "strength-gym-equipment": SportsFitnessSchema,
  "cardio-machines": SportsFitnessSchema,
  "outdoor-camping-gear": SportsFitnessSchema,
  "cycling-bicycles": SportsFitnessSchema,
  "team-ball-sports": SportsFitnessSchema,

  // Baby, Kids & Toys
  "baby-mobility-safety": BabyKidsToysSchema,
  "nursery-furniture": BabyKidsToysSchema,
  "baby-kids-fashion": BabyKidsToysSchema,
  "toys-stem-hobbies": BabyKidsToysSchema,

  // Office & Creative
  "office-equipment-tech": OfficeCreativeSchema,
  "musical-instruments-pro-audio": OfficeCreativeSchema,
  "art-craft-drawing": OfficeCreativeSchema,
};

// ==============================================================================
// 3. ENTERPRISE PIM DOMAIN CATEGORIES & SUBCATEGORIES METADATA
// ==============================================================================

export interface PIMCategoryMetadata {
  id: string;
  name: string;
  slug: string;
  icon: string;
  domain: string;
  description: string;
  subcategories: string[];
  fields: AttributeFieldMeta[];
  subcategoryFields?: Record<string, AttributeFieldMeta[]>;
}

export const PIM_CATEGORIES_METADATA: PIMCategoryMetadata[] = [
  // 1. Phones & Tablets
  {
    id: "cat_phones",
    name: "Phones & Tablets",
    slug: "phones-tablets",
    icon: "📱",
    domain: "Mobile Tech & Connectivity",
    description: "Smartphones, iPads, Android tablets, smartwatches & mobile accessories",
    subcategories: ["Smartphones & Devices", "Mobile Accessories", "Smart Wearables", "Parts & Tools"],
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
    subcategoryFields: {
      "Mobile Accessories": [
        { key: "accessory_type", label: "Accessory Type", type: "select", required: true, options: ["Fast Charger / Adapter", "Magsafe / Wireless Charger", "Braided Cable (Type-C / Lightning)", "Shockproof Case", "Tempered Glass Protector", "Power Bank (20,000mAh+)"] },
        { key: "brand_compatibility", label: "Device Compatibility", type: "select", required: true, options: ["Universal Type-C", "Apple iPhone / iPad", "Samsung Galaxy", "Xiaomi / Android"] },
        { key: "wattage", label: "Power Output / Wattage", type: "chips", required: false, options: ["20W PD", "30W", "45W Fast", "65W GaN", "100W", "120W HyperCharge"] },
        { key: "cable_length", label: "Length / Cable Spec", type: "select", required: false, options: ["1.0m (Standard)", "1.5m", "2.0m (Long)", "0.3m (Short)"] },
      ],
      "Smart Wearables": [
        { key: "brand", label: "Brand", type: "select", required: true, options: ["Apple Watch", "Samsung Galaxy Watch", "Garmin", "Huawei", "Amazfit", "Generic Fitness"] },
        { key: "display_size", label: "Case / Display Size", type: "chips", required: true, options: ["40mm", "41mm", "44mm", "45mm", "47mm", "49mm Ultra"] },
        { key: "connectivity", label: "Connectivity", type: "select", required: true, options: ["GPS + Cellular (LTE)", "GPS Only", "Bluetooth Calling"] },
        { key: "health_sensors", label: "Sensors & Health", type: "text", required: false, placeholder: "e.g. ECG, Heart Rate, SpO2, Sleep Tracking, Temp" },
        { key: "battery_days", label: "Battery Life", type: "select", required: false, options: ["1-2 Days (High Power)", "3-7 Days", "14 Days Long-Life", "Solar Unlimited"] },
      ],
      "Parts & Tools": [
        { key: "part_type", label: "Replacement Part Type", type: "select", required: true, options: ["OLED / AMOLED Display Panel", "OEM Replacement Battery", "Back Glass Housing", "Charging Port Flex", "Camera Lens Module", "Toolkit Screwdriver Set"] },
        { key: "model_compatibility", label: "Exact Device Model", type: "text", required: true, placeholder: "e.g. iPhone 13 Pro Max / Samsung S22 Ultra" },
        { key: "grade_quality", label: "Grade Quality", type: "select", required: true, options: ["OEM Original Service Pack", "Premium AAA Grade", "In-Cell Replacement"] },
      ],
    },
  },

  // 2. Computers & Gaming
  {
    id: "cat_computers",
    name: "Computers & Gaming",
    slug: "computers-gaming",
    icon: "💻",
    domain: "Computing, Gaming & Enterprise Hardware",
    description: "Laptops, MacBooks, gaming consoles, desktop PCs & high-performance GPUs",
    subcategories: ["Laptops & Computers", "Components & Hardware", "Peripherals & Storage", "Gaming & Consoles", "Networking & Office Tech"],
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
    subcategoryFields: {
      "Gaming & Consoles": [
        { key: "console_platform", label: "Gaming Platform", type: "select", required: true, options: ["PlayStation 5 Slim (Disc)", "PlayStation 5 Digital", "PS5 Pro", "Xbox Series X", "Xbox Series S", "Nintendo Switch OLED", "Steam Deck OLED"] },
        { key: "storage_capacity", label: "Internal Storage", type: "chips", required: true, options: ["512GB", "1TB SSD", "2TB SSD"] },
        { key: "included_accessories", label: "Bundle Items", type: "select", required: false, options: ["1x Wireless Controller", "2x Wireless Controllers", "Console + 2 Disc Games Bundle", "Headset Included"] },
        { key: "resolution_output", label: "Max Display Output", type: "select", required: false, options: ["4K UHD 120fps (HDR)", "8K HDR Ready", "1080p 60fps Handheld"] },
      ],
      "Components & Hardware": [
        { key: "component_category", label: "Hardware Category", type: "select", required: true, options: ["Graphics Card (GPU)", "Desktop CPU Processor", "Motherboard", "DDR5 / DDR4 RAM Kit", "Internal NVMe M.2 SSD", "Power Supply Unit (PSU)", "PC Case & Fans"] },
        { key: "chipset_spec", label: "Chipset / Specification", type: "text", required: true, placeholder: "e.g. RTX 4080 Super 16GB / B650 AM5 / 850W Gold" },
        { key: "interface_form", label: "Form Factor / Slot", type: "select", required: false, options: ["PCIe 4.0 x16", "ATX Standard", "Micro-ATX", "M.2 2280 NVMe", "SFX Modular"] },
      ],
      "Networking & Office Tech": [
        { key: "network_device", label: "Networking Device", type: "select", required: true, options: ["Wi-Fi 6 / 6E Mesh Router", "Wi-Fi 7 Enterprise AP", "Gigabit Managed Switch", "4G/5G SIM WiFi Router", "Network Patch Cable"] },
        { key: "speed_rating", label: "Speed Rating", type: "chips", required: false, options: ["AX3000", "AX6000", "BE9300 (Wi-Fi 7)", "Gigabit 1000Mbps", "10GbE SFP+"] },
        { key: "coverage_area", label: "Coverage / Antennas", type: "text", required: false, placeholder: "e.g. Up to 4,500 sq ft (Mesh 3-Pack)" },
      ],
    },
  },

  // 3. TVs & Audio
  {
    id: "cat_tvs",
    name: "TVs & Audio Systems",
    slug: "tvs-audio",
    icon: "📺",
    domain: "Home Cinema, Hi-Fi & Sound Engineering",
    description: "4K Smart TVs, home theatres, soundbars, studio headphones & wireless buds",
    subcategories: ["Televisions", "Audio & Headphones", "Sound Systems & Hi-Fi", "Projectors & TV Accessories"],
    fields: [
      { key: "screen_size", label: "Display Size", type: "select", required: false, options: ["32 inches", "43 inches", "50 inches", "55 inches", "65 inches", "75 inches", "85 inches"] },
      { key: "display_tech", label: "Display Panel Technology", type: "select", required: false, options: ["OLED (Self-Lit Pixels)", "QLED Quantum Dot", "4K Ultra HD LED", "Mini-LED", "Full HD"] },
      { key: "audio_output", label: "RMS Power Output", type: "text", required: false, placeholder: "e.g. 600W RMS / 100W Soundbar" },
      { key: "sound_tech", label: "Surround Sound Format", type: "select", required: false, options: ["Dolby Atmos 5.1.2ch", "DTS:X Spatial Audio", "Dolby Digital Plus", "Stereo 2.1"] },
      { key: "smart_os", label: "Smart TV Platform", type: "select", required: false, options: ["Google TV (Android 14)", "Samsung Tizen OS", "LG webOS 24", "Apple AirPlay 2", "None"] },
      { key: "connectivity", label: "Key Ports & Connectivity", type: "text", required: false, placeholder: "e.g. 4x HDMI 2.1 (eARC), Bluetooth 5.3, Wi-Fi 6" },
    ],
    subcategoryFields: {
      "Audio & Headphones": [
        { key: "headphone_type", label: "Headphone Classification", type: "select", required: true, options: ["Active Noise Cancelling (Over-Ear)", "True Wireless Earbuds (ANC)", "Studio Monitor Cabled", "Sports Waterproof Earphones"] },
        { key: "anc_support", label: "Noise Cancellation", type: "select", required: true, options: ["Hybrid ANC + Transparency Mode", "Active Noise Cancelling", "Passive Noise Isolation"] },
        { key: "battery_hours", label: "Battery Playtime", type: "chips", required: false, options: ["6 Hours (30h Case)", "24 Hours", "40 Hours ANC", "60 Hours Marathon"] },
        { key: "driver_size", label: "Acoustic Driver Size", type: "text", required: false, placeholder: "e.g. 40mm Custom Titanium Drivers" },
      ],
      "Sound Systems & Hi-Fi": [
        { key: "system_type", label: "Audio System Type", type: "select", required: true, options: ["Soundbar + Wireless Subwoofer", "5.1 Channel Home Theatre", "High-Power Party Speaker", "Hi-Fi Stereo Amplifier", "PA DJ Speaker System"] },
        { key: "total_rms_power", label: "Total RMS Power", type: "chips", required: true, options: ["300W RMS", "500W RMS", "800W RMS", "1000W+ High Power"] },
        { key: "subwoofer_type", label: "Subwoofer Configuration", type: "select", required: false, options: ["Dedicated Wireless Subwoofer", "Built-in Dual Subwoofers", "Wired Down-Firing Subwoofer"] },
      ],
    },
  },

  // 4. Home Appliances
  {
    id: "cat_appliances",
    name: "Home Appliances",
    slug: "home-appliances",
    icon: "🍳",
    domain: "Living Tech, Kitchen & Domestic Heavy Machinery",
    description: "Refrigerators, microwaves, air fryers, washing machines & kitchen tech",
    subcategories: ["Small Kitchen Appliances", "Cooling & Refrigeration", "Cooking & Heavy Appliances", "Laundry & Garment Care", "Climate Control & Air Care"],
    fields: [
      { key: "appliance_type", label: "Appliance Category", type: "select", required: true, options: ["Double Door Refrigerator", "Digital Air Fryer XXL", "Inverter Microwave", "Front Load Washer", "Commercial Blender", "Smart Electric Cooker"] },
      { key: "capacity", label: "Volume / Capacity", type: "text", required: false, placeholder: "e.g. 260 Litres / 8 Litres / 9 Kg Wash" },
      { key: "power_rating", label: "Power Consumption", type: "text", required: false, placeholder: "e.g. 1800 Watts (Energy Star A+++)" },
      { key: "warranty_months", label: "Official Warranty", type: "select", required: false, options: ["24 Months (2 Years)", "12 Months (1 Year)", "10 Years on Inverter Motor", "6 Months"] },
      { key: "dimensions", label: "Physical Dimensions", type: "text", required: false, placeholder: "e.g. 550 x 600 x 1670 mm" },
    ],
    subcategoryFields: {
      "Cooling & Refrigeration": [
        { key: "refrigerator_type", label: "Fridge Configuration", type: "select", required: true, options: ["Double Door Top Freezer", "Bottom Mount Refrigerator", "Side-by-Side (French Door)", "Chest Deep Freezer", "Single Door Compact"] },
        { key: "capacity_litres", label: "Gross Capacity", type: "chips", required: true, options: ["180L", "230L", "300L", "450L", "550L+ French Door"] },
        { key: "defrost_system", label: "Cooling / Defrost Tech", type: "select", required: true, options: ["Total No-Frost (Frost Free)", "Direct Cool", "Multi Air Flow Dual Inverter"] },
        { key: "compressor_type", label: "Compressor", type: "select", required: false, options: ["Smart Digital Inverter (10-Yr Warranty)", "Standard Reciprocating"] },
      ],
      "Laundry & Garment Care": [
        { key: "washer_type", label: "Washing Machine Type", type: "select", required: true, options: ["Front Load Inverter", "Top Load Automated", "Twin Tub Semi-Automatic", "Washer & Dryer Combo 2-in-1"] },
        { key: "wash_capacity_kg", label: "Washing Capacity", type: "chips", required: true, options: ["7 Kg", "8 Kg", "9 Kg", "10.5 Kg", "12 Kg+ Family"] },
        { key: "spin_speed", label: "Max Spin Speed", type: "select", required: false, options: ["1400 RPM", "1200 RPM", "1000 RPM", "800 RPM"] },
        { key: "steam_wash", label: "Steam Allergy Care", type: "select", required: false, options: ["Yes (Steam Hygiene 99.9%)", "No (Standard Wash)"] },
      ],
      "Climate Control & Air Care": [
        { key: "climate_device", label: "Climate Appliance", type: "select", required: true, options: ["Inverter Split Air Conditioner", "Portable Mobile AC", "Air Purifier HEPA H13", "Misting Industrial Fan", "Dehumidifier"] },
        { key: "btu_capacity", label: "Cooling Capacity (BTU)", type: "chips", required: false, options: ["9,000 BTU (1 HP)", "12,000 BTU (1.5 HP)", "18,000 BTU (2 HP)", "24,000 BTU (2.5 HP)"] },
        { key: "inverter_energy", label: "Inverter Tech", type: "select", required: false, options: ["Dual Inverter (Up to 70% Energy Saving)", "Non-Inverter Standard"] },
      ],
    },
  },

  // 5. Solar & Power Backup
  {
    id: "cat_solar",
    name: "Solar & Power Backup",
    slug: "solar-power",
    icon: "⚡",
    domain: "Clean Renewable Energy & Off-Grid Backup",
    description: "Solar panels, lithium batteries, pure sine wave inverters & portable stations",
    subcategories: ["Solar Systems", "Inverters & Storage Batteries", "Backup Generators & Protection"],
    fields: [
      { key: "battery_type", label: "Battery Chemistry", type: "select", required: true, options: ["Lithium LiFePO4 (6,000+ Cycles)", "Deep Cycle Gel", "Tubular Lead Acid", "AGM Sealed", "Integrated Powerstation"] },
      { key: "capacity", label: "Energy Capacity", type: "text", required: true, placeholder: "e.g. 5.12 kWh / 100Ah 48V / 2400Wh" },
      { key: "inverter_rating", label: "Continuous Inverter Output", type: "select", required: false, options: ["1,000W Pure Sine", "3,000W (3kVA)", "5,000W (5kVA)", "8,000W (8kVA)", "10,000W (10kVA)"] },
      { key: "voltage", label: "System DC Voltage", type: "select", required: false, options: ["48V DC (Standard Home)", "24V DC", "12V DC", "High Voltage 400V"] },
      { key: "warranty_years", label: "Manufacturer Warranty", type: "select", required: false, options: ["10 Years (Tier 1 LiFePO4)", "5 Years", "2 Years", "1 Year"] },
    ],
    subcategoryFields: {
      "Solar Systems": [
        { key: "panel_wattage", label: "Panel Wattage Output", type: "chips", required: true, options: ["350W Mono", "450W Mono", "550W Tier 1", "600W+ Bifacial High Efficiency"] },
        { key: "cell_type", label: "Cell Structure", type: "select", required: true, options: ["Monocrystalline N-Type TOPCon", "Monocrystalline PERC", "Bifacial Dual-Glass", "Polycrystalline"] },
        { key: "efficiency_rating", label: "Module Efficiency", type: "text", required: false, placeholder: "e.g. 22.8% Conversion Efficiency" },
      ],
      "Inverters & Storage Batteries": [
        { key: "chemistry", label: "Storage Chemistry", type: "select", required: true, options: ["Lithium LiFePO4 (Wall Mounted / Rack)", "High-Capacity Powerwall (5.12kWh)", "Gel Deep Cycle Maintenance Free", "High Voltage Industrial Battery"] },
        { key: "usable_capacity", label: "Usable Capacity", type: "chips", required: true, options: ["100Ah 12V (1.2kWh)", "200Ah 12V (2.4kWh)", "100Ah 48V (5.12kWh)", "200Ah 48V (10.24kWh)"] },
        { key: "cycle_life_80dod", label: "Cycle Life (@80% DoD)", type: "select", required: false, options: ["6,000+ Cycles (15+ Years)", "4,000 Cycles", "1,500 Cycles (Gel)", "800 Cycles"] },
      ],
    },
  },

  // 6. Fashion & Apparel
  {
    id: "cat_fashion",
    name: "Fashion & Apparel",
    slug: "fashion",
    icon: "👔",
    domain: "Garments, Streetwear & Textile Apparel",
    description: "Official suits, streetwear hoodies, jeans, t-shirts, dresses & daily fashion",
    subcategories: ["Men's Clothing", "Women's Apparel", "Underwear & Loungewear", "Men's Accessories", "Handbags & Wallets", "Lingerie & Shapewear"],
    fields: [
      { key: "apparel_type", label: "Garment Classification", type: "select", required: true, options: ["Bespoke Suit / Blazer", "T-Shirt / Graphic Tee", "Hoodie / Sweatshirt", "Denim Jeans", "Chino Trousers", "Official Shirt", "Dress / Gown", "Tracksuit Set"] },
      { key: "size", label: "Garment Size", type: "chips", required: true, options: ["XS", "S", "M", "L", "XL", "XXL", "3XL", "38R", "40R", "42R", "44R"] },
      { key: "color", label: "Primary Color", type: "chips", required: true, options: ["Midnight Black", "Pure White", "Navy Blue", "Charcoal Grey", "Olive Green", "Beige / Tan", "Burgundy Red"] },
      { key: "gender", label: "Target Gender", type: "select", required: false, options: ["Men", "Women", "Unisex"] },
      { key: "material", label: "Fabric & Composition", type: "text", required: false, placeholder: "e.g. 100% Combed Heavyweight Cotton / Italian Merino Wool" },
      { key: "fit", label: "Cut & Fit", type: "select", required: false, options: ["Regular Fit", "Slim Fit", "Oversized Streetwear", "Athletic Fit", "Tailored Fit"] },
      { key: "occasion", label: "Occasion", type: "select", required: false, options: ["Casual & Daily", "Formal & Business", "Smart Casual", "Evening / Cocktail", "Gym & Workout"] },
    ],
  },

  // 7. Footwear & Shoes
  {
    id: "cat_footwear",
    name: "Footwear & Shoes",
    slug: "footwear",
    icon: "👟",
    domain: "Footwear, Sneakers & Luxury Leather Soles",
    description: "Original sneakers, sports running shoes, official Italian leather loafers & heels",
    subcategories: ["Men's Footwear", "Women's Shoes"],
    fields: [
      { key: "shoe_type", label: "Footwear Type", type: "select", required: true, options: ["Sneakers / Running Shoes", "Official Oxford / Derby", "Penny Loafers", "Ankle Chelsea Boots", "High Heels / Stilettos", "Sandals / Slides", "Casual Canvas"] },
      { key: "shoe_size", label: "Shoe Size (EU/UK)", type: "chips", required: true, options: ["EU 38 (UK 5)", "EU 39 (UK 6)", "EU 40 (UK 6.5)", "EU 41 (UK 7)", "EU 42 (UK 8)", "EU 43 (UK 9)", "EU 44 (UK 10)", "EU 45 (UK 11)", "EU 46 (UK 12)"] },
      { key: "color", label: "Primary Color", type: "chips", required: true, options: ["Triple Black", "All White", "Navy Blue", "Cognac Brown", "Dark Tan", "Grey / Wolf", "Red / Accent"] },
      { key: "upper_material", label: "Upper Material", type: "select", required: true, options: ["Full-Grain Genuine Leather", "Suede Leather", "Breathable Engineered Mesh", "Canvas Cotton", "Patent Leather", "Synthetic Leather"] },
      { key: "sole_material", label: "Outsole Material", type: "select", required: false, options: ["Non-Slip Rubber", "Cushioned EVA Foam", "Traditional Leather Sole", "Crepe Sole", "Vibram High-Traction"] },
      { key: "closure_type", label: "Closure Mechanism", type: "select", required: false, options: ["Lace-Up", "Slip-On / Loafer", "Side Zipper", "Buckle Monk Strap", "Velcro Strap"] },
      { key: "gender", label: "Target Gender", type: "select", required: false, options: ["Men", "Women", "Unisex"] },
    ],
  },

  // 8. Watches, Jewelry & Luxury
  {
    id: "cat_jewelry",
    name: "Watches & Fine Jewelry",
    slug: "watches-jewelry",
    icon: "⌚",
    domain: "Luxury Timepieces, Precious Metals & Eyewear",
    description: "Automatic watches, gold & sterling jewelry, sunglasses & designer luggage",
    subcategories: ["Watches", "Fine & Fashion Jewelry", "Eyewear & Optics", "Luggage & Travel Bags"],
    fields: [
      { key: "movement_type", label: "Watch Movement", type: "select", required: false, options: ["Automatic Self-Winding", "Swiss Quartz", "Solar Powered", "Chronograph Mechanical"] },
      { key: "case_material", label: "Case / Metal Material", type: "select", required: true, options: ["316L Stainless Steel", "18K Gold Plated", "925 Sterling Silver", "Ceramic", "Aerospace Titanium"] },
      { key: "water_resistance", label: "Water Resistance", type: "chips", required: false, options: ["30m (Splashproof)", "50m", "100m (Swimming)", "200m (Diver Certified)"] },
      { key: "strap_type", label: "Band / Strap Type", type: "select", required: false, options: ["Solid Steel Jubilee/Oyster", "Italian Leather", "Silicone Rubber", "Mesh Milanese"] },
      { key: "lens_optics", label: "Glass / Lens Feature", type: "select", required: false, options: ["Scratch-Resistant Sapphire Crystal", "Polarized UV400", "Mineral Glass", "Anti-Blue Light"] },
    ],
  },

  // 9. Furniture & Home Living
  {
    id: "cat_furniture",
    name: "Furniture & Home Living",
    slug: "furniture",
    icon: "🛋️",
    domain: "Interior Aesthetics, Furnishings & Dining",
    description: "Office ergonomics, living room sofas, dining sets, bedding & home organization",
    subcategories: ["Furniture", "Cookware & Dining", "Home Decor & Lighting", "Bedding & Bath", "Storage & Home Organization"],
    fields: [
      { key: "product_type", label: "Item Category", type: "select", required: true, options: ["Ergonomic Executive Office Chair", "L-Shape Sectional Sofa", "Solid Wood Dining Table", "Queen Size Bedframe", "Non-Stick Cookware Set (10pc)", "Blackout Luxury Curtains"] },
      { key: "primary_material", label: "Material Composition", type: "text", required: false, placeholder: "e.g. Solid Mahogany Wood / High-Density Foam / Granite Coating" },
      { key: "dimensions", label: "Dimensions (L x W x H)", type: "text", required: false, placeholder: "e.g. 180 x 90 x 75 cm" },
      { key: "assembly_required", label: "Assembly", type: "select", required: false, options: ["Ready Assembled (No Tool Needed)", "Easy Self-Assembly (Tools Included)", "Professional Installation Available"] },
    ],
  },

  // 10. Beauty, Health & Personal Care
  {
    id: "cat_beauty",
    name: "Beauty & Personal Care",
    slug: "beauty-health",
    icon: "💄",
    domain: "Personal Grooming, Skincare Tech & Scents",
    description: "Hair styling clippers, skincare tools, electric shavers, colognes & fragrances",
    subcategories: ["Hair Care & Styling Tools", "Skincare & Wellness Devices", "Oral Care & Shaving", "Makeup Accessories & Scent"],
    fields: [
      { key: "device_type", label: "Grooming / Beauty Device", type: "select", required: true, options: ["Professional Cordless Hair Clipper", "Ceramic Hair Straightener / Styler", "Ionic High-Speed Hair Dryer", "Rotary Waterproof Shaver", "Facial Cleansing Sonic Brush", "Designer Eau de Parfum"] },
      { key: "power_source", label: "Power Source", type: "select", required: false, options: ["Rechargeable USB-C Lithium", "Direct AC Corded", "Battery Operated"] },
      { key: "heat_speed_levels", label: "Speed / Heat Settings", type: "chips", required: false, options: ["2 Settings", "3 Temperature Levels", "5 Speeds", "Variable Digital Control"] },
      { key: "waterproof_rating", label: "Waterproofing", type: "select", required: false, options: ["IPX7 Fully Waterproof (Wet/Dry)", "Rinseable Head Only", "Non-Waterproof"] },
    ],
  },

  // 11. Automotive & Hardware
  {
    id: "cat_automotive",
    name: "Automotive & Hardware",
    slug: "automotive",
    icon: "🚗",
    domain: "Automotive Engineering, Power Tools & Gear",
    description: "Car dashcams, sound upgrades, motorcycle helmets, cordless drills & workshop sets",
    subcategories: ["Car Electronics & Safety", "Interior & Exterior Accessories", "Motorcycle Gear", "Power Tools & Workshop", "Hand Tools & Hardware"],
    fields: [
      { key: "equipment_type", label: "Equipment Category", type: "select", required: true, options: ["4K Dual Dash Camera (GPS)", "Android Touch Car Stereo", "Cordless Brushless Impact Drill", "108-Piece Mechanics Tool Kit", "ECE Certified Motorcycle Helmet", "Car Battery Jump Starter (2000A)"] },
      { key: "voltage_power", label: "Voltage / Output Rating", type: "chips", required: false, options: ["12V DC Vehicle", "18V / 20V Max Lithium", "24V Heavy Duty", "220V Workshop"] },
      { key: "material_grade", label: "Material / Build Grade", type: "text", required: false, placeholder: "e.g. Chrome Vanadium Steel / Polycarbonate Shell" },
    ],
  },

  // 12. Smart Home & Security
  {
    id: "cat_security",
    name: "Smart Home & Security",
    slug: "smart-home-security",
    icon: "🔒",
    domain: "IoT Automation, Surveillance & Digital Access",
    description: "CCTV 4K cameras, biometric smart door locks, solar floodlights & smart switches",
    subcategories: ["CCTV & Security Surveillance", "Smart Locks & Access", "Smart Home Automation"],
    fields: [
      { key: "resolution", label: "Camera Sensor Resolution", type: "chips", required: false, options: ["1080p Full HD", "2K 3MP", "4K 8MP Ultra HD", "Color Night Vision"] },
      { key: "connectivity_protocol", label: "Wireless Protocol", type: "select", required: true, options: ["Wi-Fi 2.4GHz / 5GHz", "4G LTE Solar (SIM Card)", "Zigbee 3.0", "Matter / Thread"] },
      { key: "unlock_method", label: "Access / Unlock Method", type: "select", required: false, options: ["Fingerprint + Passcode + RFID + App + Key", "Biometric Facial Recognition", "App Remote Unlock", "Keyless Pad"] },
      { key: "weatherproof_rating", label: "Outdoor Weatherproof", type: "select", required: false, options: ["IP66 Weatherproof / Dustproof", "IP65 Outdoor", "Indoor Only"] },
    ],
  },

  // 13. Sports, Fitness & Outdoor
  {
    id: "cat_sports",
    name: "Sports & Fitness",
    slug: "sports-fitness",
    icon: "🏋️",
    domain: "Athletic Conditioning, Gym Tech & Outdoor Gear",
    description: "Treadmills, adjustable dumbbells, mountain bikes, camping tents & football gear",
    subcategories: ["Strength & Gym Equipment", "Cardio Machines", "Outdoor & Camping Gear", "Cycling & Bicycles", "Team & Ball Sports"],
    fields: [
      { key: "equipment_type", label: "Equipment Classification", type: "select", required: true, options: ["Foldable Motorized Treadmill", "Adjustable Dumbbell Pair (40kg)", "21-Speed Mountain Bike 29\"", "Spinning Exercise Bike", "Waterproof 4-Person Camping Tent", "Match Grade Football (Size 5)"] },
      { key: "weight_capacity", label: "Max User / Weight Capacity", type: "chips", required: false, options: ["120 Kg", "150 Kg Heavy Duty", "200 Kg Commercial", "50 Kg Dumbbells"] },
      { key: "resistance_levels", label: "Resistance / Gears", type: "text", required: false, placeholder: "e.g. 16 Magnetic Levels / Shimano 21-Speed" },
    ],
  },

  // 14. Baby, Kids & Toys
  {
    id: "cat_baby",
    name: "Baby, Kids & Toys",
    slug: "baby-kids",
    icon: "🧸",
    domain: "Infant Care, Strollers, Educational Toys & Nursery",
    description: "Foldable strollers, car seats, wooden cribs, organic baby clothing & STEM robotics",
    subcategories: ["Baby Mobility & Safety", "Nursery & Furniture", "Baby & Kids Fashion", "Toys, STEM & Hobbies"],
    fields: [
      { key: "age_group", label: "Target Age Range", type: "chips", required: true, options: ["Newborn (0-6 Months)", "Infant (6-18 Months)", "Toddler (2-4 Years)", "Kids (5-8 Years)", "STEM (8-14 Years)"] },
      { key: "safety_standard", label: "Safety Certifications", type: "select", required: false, options: ["ECE R44/04 Car Seat Certified", "EN71 Non-Toxic Toy Tested", "BPA-Free Food Grade", "CPSC Compliant"] },
      { key: "weight_limit", label: "Weight Support Limit", type: "text", required: false, placeholder: "e.g. Up to 22 Kg (Stroller)" },
    ],
  },

  // 15. Office, Music & Creative Tech
  {
    id: "cat_office_creative",
    name: "Office, Music & Creative Tech",
    slug: "office-creative",
    icon: "🎨",
    domain: "Professional Audio, Printing Tech & Fine Arts",
    description: "Ink tank printers, paper shredders, digital keyboards, studio mics & art supplies",
    subcategories: ["Office Equipment & Tech", "Musical Instruments & Pro Audio", "Art, Craft & Drawing"],
    fields: [
      { key: "gear_type", label: "Item Category", type: "select", required: true, options: ["All-in-One Ink Tank Printer (Wi-Fi)", "High-Security Cross-Cut Shredder", "88-Key Weighted Digital Piano", "Studio Condenser XLR Microphone", "Audio Interface (2-in/2-out 24bit)"] },
      { key: "connectivity", label: "Connectivity", type: "select", required: false, options: ["Wi-Fi Direct + USB + Apple AirPrint", "XLR Balanced Audio", "USB-C Plug & Play", "MIDI USB Controller"] },
    ],
  },
];

// ==============================================================================
// 4. HELPER RESOLVER FUNCTIONS FOR PLATFORM CATALOG
// ==============================================================================

/**
 * Normalizes text to slug for lookup
 */
function toSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Case-insensitive lookup of a category metadata by slug, name, or alias
 */
export function getCategoryBySlugOrName(identifier: string): PIMCategoryMetadata | undefined {
  if (!identifier) return undefined;
  const slug = toSlug(identifier);

  // Exact match on slug
  let found = PIM_CATEGORIES_METADATA.find(
    (c) => c.slug === slug || toSlug(c.name) === slug || c.id === identifier
  );
  if (found) return found;

  // Fuzzy check on subcategories
  for (const cat of PIM_CATEGORIES_METADATA) {
    if (cat.subcategories.some((sub) => toSlug(sub) === slug || sub.toLowerCase() === identifier.toLowerCase())) {
      return cat;
    }
  }

  // Domain keywords fallback
  if (slug.includes("phone") || slug.includes("tablet") || slug.includes("wearable")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "phones-tablets");
  }
  if (slug.includes("computer") || slug.includes("laptop") || slug.includes("game") || slug.includes("console")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "computers-gaming");
  }
  if (slug.includes("tv") || slug.includes("audio") || slug.includes("sound") || slug.includes("headphone")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "tvs-audio");
  }
  if (slug.includes("shoe") || slug.includes("footwear") || slug.includes("sneaker")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "footwear");
  }
  if (slug.includes("fashion") || slug.includes("cloth") || slug.includes("apparel") || slug.includes("suit")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "fashion");
  }
  if (slug.includes("solar") || slug.includes("power") || slug.includes("inverter") || slug.includes("battery")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "solar-power");
  }
  if (slug.includes("appliance") || slug.includes("fridge") || slug.includes("cook") || slug.includes("wash")) {
    return PIM_CATEGORIES_METADATA.find((c) => c.slug === "home-appliances");
  }

  return PIM_CATEGORIES_METADATA[0];
}

/**
 * Resolves the matching PIM Category and Subcategory for ANY product in the catalog
 */
export function resolveCategoryForProduct(
  categoryName?: string,
  subcategoryName?: string
): { category: PIMCategoryMetadata; subcategory: string } {
  // Try subcategory first if provided
  if (subcategoryName) {
    for (const cat of PIM_CATEGORIES_METADATA) {
      const match = cat.subcategories.find(
        (sub) => sub.toLowerCase() === subcategoryName.toLowerCase() || toSlug(sub) === toSlug(subcategoryName)
      );
      if (match) {
        return { category: cat, subcategory: match };
      }
    }
  }

  // Try categoryName
  if (categoryName) {
    const cat = getCategoryBySlugOrName(categoryName);
    if (cat) {
      const sub =
        cat.subcategories.find(
          (s) => s.toLowerCase() === (subcategoryName || "").toLowerCase()
        ) || cat.subcategories[0] || "General";
      return { category: cat, subcategory: sub };
    }
  }

  return {
    category: PIM_CATEGORIES_METADATA[0],
    subcategory: PIM_CATEGORIES_METADATA[0].subcategories[0],
  };
}

/**
 * Returns dynamic attribute fields specific to a Category AND its Subcategory
 */
export function getFieldsForCategoryAndSubcategory(
  categorySlugOrName: string,
  subcategoryName?: string
): AttributeFieldMeta[] {
  const cat = getCategoryBySlugOrName(categorySlugOrName);
  if (!cat) return [];

  if (subcategoryName && cat.subcategoryFields && cat.subcategoryFields[subcategoryName]) {
    return cat.subcategoryFields[subcategoryName];
  }

  return cat.fields;
}

/**
 * Validate category-specific polymorphic JSONB attributes before DB write or API submit
 */
export function validateCategoryAttributes(
  categorySlug: string,
  attributes: unknown,
  subcategory?: string
) {
  const key = subcategory ? toSlug(subcategory) : toSlug(categorySlug);
  const schema = CATEGORY_SCHEMA_REGISTRY[key] || CATEGORY_SCHEMA_REGISTRY[toSlug(categorySlug)];

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
