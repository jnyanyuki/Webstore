export interface ProductColorOption {
  name: string;
  hex: string;
  image?: string;
  bgGradient?: string;
  border?: string;
}

// Normalized color dictionary for device finishes and materials
export const KNOWN_COLOR_MAP: Record<string, { hex: string; bgGradient?: string }> = {
  // Apple Titanium Finishes (iPhone 16 Pro & 15 Pro)
  "natural titanium": { hex: "#C2BCB2", bgGradient: "linear-gradient(135deg, #d3cdc4, #a8a299)" },
  "desert titanium": { hex: "#BFA48F", bgGradient: "linear-gradient(135deg, #d5bdab, #a78f7c)" },
  "black titanium": { hex: "#3C3C3D", bgGradient: "linear-gradient(135deg, #4a4a4c, #2b2b2c)" },
  "white titanium": { hex: "#F2F1ED", bgGradient: "linear-gradient(135deg, #ffffff, #deddd8)" },
  "blue titanium": { hex: "#2F4452", bgGradient: "linear-gradient(135deg, #3d5565, #1e2e38)" },

  // Samsung Galaxy S24 Ultra & Flagships
  "titanium gray": { hex: "#ACA49B", bgGradient: "linear-gradient(135deg, #c1b9b1, #968f86)" },
  "titanium black": { hex: "#62605F", bgGradient: "linear-gradient(135deg, #484646, #222222)" },
  "titanium violet": { hex: "#4D4E5F", bgGradient: "linear-gradient(135deg, #64657a, #383949)" },
  "titanium yellow": { hex: "#F0E1B9", bgGradient: "linear-gradient(135deg, #f7ebd0, #dfd0a4)" },
  "titanium blue": { hex: "#A7B5C8", bgGradient: "linear-gradient(135deg, #bcc8d8, #8f9fb4)" },
  "titanium green": { hex: "#C2CDBA", bgGradient: "linear-gradient(135deg, #d4ddce, #adbaa5)" },

  // Xiaomi & Redmi Colors
  "midnight black": { hex: "#18191B", bgGradient: "linear-gradient(135deg, #2a2c2f, #111213)" },
  "aurora purple": { hex: "#B6A5C9", bgGradient: "linear-gradient(135deg, #cbbddb, #9e8bb4)" },
  "ocean teal": { hex: "#295E6F", bgGradient: "linear-gradient(135deg, #38788c, #1d4653)" },
  "arctic white": { hex: "#EDF0F4", bgGradient: "linear-gradient(135deg, #ffffff, #d8dee6)" },

  // Samsung A-Series (A55, A35)
  "awesome navy": { hex: "#1A2233", bgGradient: "linear-gradient(135deg, #27344d, #111724)" },
  "awesome iceblue": { hex: "#C2D7E9", bgGradient: "linear-gradient(135deg, #d7e6f3, #a9c5dc)" },
  "awesome lilac": { hex: "#D4CAE0", bgGradient: "linear-gradient(135deg, #e4dcf0, #beafd0)" },
  "awesome lemon": { hex: "#F4EEC5", bgGradient: "linear-gradient(135deg, #faf6dc, #ede2a9)" },

  // Apple Standard / Refurb (iPhone 13, 14, 15)
  "midnight": { hex: "#1A2026", bgGradient: "linear-gradient(135deg, #262e36, #101419)" },
  "starlight": { hex: "#F7F4ED", bgGradient: "linear-gradient(135deg, #ffffff, #eae5d7)" },
  "space gray": { hex: "#4A4B4D", bgGradient: "linear-gradient(135deg, #5b5c5f, #363738)" },
  "space black": { hex: "#2E2C2B", bgGradient: "linear-gradient(135deg, #3d3b3a, #1b1a19)" },
  "silver": { hex: "#E3E4E6", bgGradient: "linear-gradient(135deg, #f5f6f7, #cfd1d4)" },
  "gold": { hex: "#F5E8C7", bgGradient: "linear-gradient(135deg, #fcf4de, #e8d7a9)" },
  "deep purple": { hex: "#4B3D60", bgGradient: "linear-gradient(135deg, #5e4e76, #372a49)" },
  "pink": { hex: "#FAE0D8", bgGradient: "linear-gradient(135deg, #fcece6, #f3ccc1)" },
  "green": { hex: "#3A4D42", bgGradient: "linear-gradient(135deg, #4a6154, #27342d)" },
  "blue": { hex: "#274862", bgGradient: "linear-gradient(135deg, #345c7b, #193144)" },

  // Fashion, Tailoring & Apparel (Suits, Blazers, Shoes)
  "royal navy": { hex: "#1A2B4C", bgGradient: "linear-gradient(135deg, #263c66, #101c33)" },
  "navy blue": { hex: "#1B2A4A", bgGradient: "linear-gradient(135deg, #253961, #121d33)" },
  "navy": { hex: "#1B2A4A", bgGradient: "linear-gradient(135deg, #253961, #121d33)" },
  "charcoal gray": { hex: "#374151", bgGradient: "linear-gradient(135deg, #4b5563, #28303b)" },
  "charcoal": { hex: "#374151", bgGradient: "linear-gradient(135deg, #4b5563, #28303b)" },
  "classic black": { hex: "#111827", bgGradient: "linear-gradient(135deg, #1f2937, #0a0e17)" },
  "black": { hex: "#111827", bgGradient: "linear-gradient(135deg, #1f2937, #0a0e17)" },
  "camel tan": { hex: "#B89065", bgGradient: "linear-gradient(135deg, #c9a57e, #a27a4d)" },
  "camel": { hex: "#B89065", bgGradient: "linear-gradient(135deg, #c9a57e, #a27a4d)" },
  "olive green": { hex: "#556B2F", bgGradient: "linear-gradient(135deg, #6b843d, #3f4f22)" },
  "burgundy": { hex: "#800020", bgGradient: "linear-gradient(135deg, #990f30, #610018)" },

  // New Generation iPhone 16 & Google Pixel Finishes
  "ultramarine": { hex: "#4B63A4", bgGradient: "linear-gradient(135deg, #5b75b8, #3b508f)" },
  "teal": { hex: "#88A9A7", bgGradient: "linear-gradient(135deg, #9bbbb9, #769795)" },
  "obsidian": { hex: "#2B2B2B", bgGradient: "linear-gradient(135deg, #3d3d3d, #1a1a1a)" },
  "porcelain": { hex: "#F0ECE1", bgGradient: "linear-gradient(135deg, #ffffff, #ded9cd)" },
  "hazel": { hex: "#807E73", bgGradient: "linear-gradient(135deg, #918f83, #6d6b61)" },
  "bay blue": { hex: "#9AB7D3", bgGradient: "linear-gradient(135deg, #adc6df, #829fc0)" },
  "mint": { hex: "#BCE3CE", bgGradient: "linear-gradient(135deg, #cff0df, #a5d2b9)" },
  "rose gold": { hex: "#B76E79", bgGradient: "linear-gradient(135deg, #c9808b, #9e5863)" },
  "onyx black": { hex: "#222222", bgGradient: "linear-gradient(135deg, #333333, #111111)" },
  "marble gray": { hex: "#D9D9D9", bgGradient: "linear-gradient(135deg, #e8e8e8, #c4c4c4)" },
  "cobalt violet": { hex: "#3E3F59", bgGradient: "linear-gradient(135deg, #505170, #2c2d42)" },
  "amber yellow": { hex: "#F3ECC8", bgGradient: "linear-gradient(135deg, #faf3d8, #e5ddb4)" },

  // Rugged & Outdoor Phone Finishes
  "tactical black": { hex: "#1C1D1F", bgGradient: "linear-gradient(135deg, #2b2d30, #131415)" },
  "army green": { hex: "#4A533E", bgGradient: "linear-gradient(135deg, #5b654e, #3a4230)" },
  "desert tan": { hex: "#9E876B", bgGradient: "linear-gradient(135deg, #b0997d, #897257)" },
  "safety orange": { hex: "#E85D04", bgGradient: "linear-gradient(135deg, #f47219, #d04f00)" },
};

export interface PresetColorPalette {
  name: string;
  categoryHint?: string;
  colors: ProductColorOption[];
}

export const PRESET_COLOR_PALETTES: PresetColorPalette[] = [
  {
    name: "Apple Titanium (iPhone 16/15 Pro)",
    categoryHint: "Phones & Tablets",
    colors: [
      { name: "Natural Titanium", hex: "#C2BCB2", bgGradient: "linear-gradient(135deg, #d3cdc4, #a8a299)" },
      { name: "Desert Titanium", hex: "#BFA48F", bgGradient: "linear-gradient(135deg, #d5bdab, #a78f7c)" },
      { name: "White Titanium", hex: "#F2F1ED", bgGradient: "linear-gradient(135deg, #ffffff, #deddd8)" },
      { name: "Black Titanium", hex: "#3C3C3D", bgGradient: "linear-gradient(135deg, #4a4a4c, #2b2b2c)" },
    ],
  },
  {
    name: "Samsung S24 Ultra Finishes",
    categoryHint: "Phones & Tablets",
    colors: [
      { name: "Titanium Gray", hex: "#ACA49B", bgGradient: "linear-gradient(135deg, #c1b9b1, #968f86)" },
      { name: "Titanium Black", hex: "#62605F", bgGradient: "linear-gradient(135deg, #484646, #222222)" },
      { name: "Titanium Violet", hex: "#4D4E5F", bgGradient: "linear-gradient(135deg, #64657a, #383949)" },
      { name: "Titanium Yellow", hex: "#F0E1B9", bgGradient: "linear-gradient(135deg, #f7ebd0, #dfd0a4)" },
    ],
  },
  {
    name: "Samsung Galaxy A-Series",
    categoryHint: "Phones & Tablets",
    colors: [
      { name: "Awesome Navy", hex: "#1A2233", bgGradient: "linear-gradient(135deg, #27344d, #111724)" },
      { name: "Awesome Iceblue", hex: "#C2D7E9", bgGradient: "linear-gradient(135deg, #d7e6f3, #a9c5dc)" },
      { name: "Awesome Lilac", hex: "#D4CAE0", bgGradient: "linear-gradient(135deg, #e4dcf0, #beafd0)" },
      { name: "Awesome Lemon", hex: "#F4EEC5", bgGradient: "linear-gradient(135deg, #faf6dc, #ede2a9)" },
    ],
  },
  {
    name: "Xiaomi & Redmi Flagship",
    categoryHint: "Phones & Tablets",
    colors: [
      { name: "Midnight Black", hex: "#18191B", bgGradient: "linear-gradient(135deg, #2a2c2f, #111213)" },
      { name: "Aurora Purple", hex: "#B6A5C9", bgGradient: "linear-gradient(135deg, #cbbddb, #9e8bb4)" },
      { name: "Ocean Teal", hex: "#295E6F", bgGradient: "linear-gradient(135deg, #38788c, #1d4653)" },
      { name: "Arctic White", hex: "#EDF0F4", bgGradient: "linear-gradient(135deg, #ffffff, #d8dee6)" },
    ],
  },
  {
    name: "Google Pixel Modern",
    categoryHint: "Phones & Tablets",
    colors: [
      { name: "Obsidian", hex: "#2B2B2B", bgGradient: "linear-gradient(135deg, #3d3d3d, #1a1a1a)" },
      { name: "Porcelain", hex: "#F0ECE1", bgGradient: "linear-gradient(135deg, #ffffff, #ded9cd)" },
      { name: "Hazel", hex: "#807E73", bgGradient: "linear-gradient(135deg, #918f83, #6d6b61)" },
      { name: "Bay Blue", hex: "#9AB7D3", bgGradient: "linear-gradient(135deg, #adc6df, #829fc0)" },
    ],
  },
  {
    name: "Formal Apparel & Suits",
    categoryHint: "Fashion",
    colors: [
      { name: "Royal Navy", hex: "#1A2B4C", bgGradient: "linear-gradient(135deg, #263c66, #101c33)" },
      { name: "Charcoal Gray", hex: "#374151", bgGradient: "linear-gradient(135deg, #4b5563, #28303b)" },
      { name: "Classic Black", hex: "#111827", bgGradient: "linear-gradient(135deg, #1f2937, #0a0e17)" },
      { name: "Camel Tan", hex: "#B89065", bgGradient: "linear-gradient(135deg, #c9a57e, #a27a4d)" },
    ],
  },
  {
    name: "Sneakers & Footwear",
    categoryHint: "Footwear",
    colors: [
      { name: "Triple White", hex: "#F9FAFB", bgGradient: "linear-gradient(135deg, #ffffff, #e5e7eb)" },
      { name: "Triple Black", hex: "#111827", bgGradient: "linear-gradient(135deg, #1f2937, #0a0e17)" },
      { name: "Wolf Grey", hex: "#9CA3AF", bgGradient: "linear-gradient(135deg, #d1d5db, #6b7280)" },
      { name: "University Red", hex: "#DC2626", bgGradient: "linear-gradient(135deg, #ef4444, #b91c1c)" },
    ],
  },
  {
    name: "Standard Classics",
    categoryHint: "Universal",
    colors: [
      { name: "Space Black", hex: "#2E2C2B", bgGradient: "linear-gradient(135deg, #3d3b3a, #1b1a19)" },
      { name: "Silver", hex: "#E3E4E6", bgGradient: "linear-gradient(135deg, #f5f6f7, #cfd1d4)" },
      { name: "Starlight", hex: "#F7F4ED", bgGradient: "linear-gradient(135deg, #ffffff, #eae5d7)" },
      { name: "Navy Blue", hex: "#1B2A4A", bgGradient: "linear-gradient(135deg, #253961, #121d33)" },
    ],
  },
];

export function isLightColor(hexColor: string): boolean {
  const hex = hexColor.replace("#", "");
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  if (hex.length >= 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }
  return false;
}

export function getColorHex(colorName: string): string {
  const clean = colorName.trim().toLowerCase();
  if (clean.startsWith("#")) return colorName;
  if (KNOWN_COLOR_MAP[clean]) return KNOWN_COLOR_MAP[clean].hex;

  for (const [key, val] of Object.entries(KNOWN_COLOR_MAP)) {
    if (clean.includes(key) || key.includes(clean)) {
      return val.hex;
    }
  }

  // Fallback hashing for consistent hues
  let hash = 0;
  for (let i = 0; i < colorName.length; i++) {
    hash = colorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}

/**
 * Returns comprehensive, authentic color options for any product,
 * whether it's an iPhone, Samsung Galaxy, Xiaomi, laptop, or fashion item.
 */
export function getProductColorOptions(product: {
  id?: string;
  name?: string;
  category?: string;
  subcategory?: string;
  itemType?: string;
  frontImage?: string;
  sideImage?: string;
  colors?: (string | ProductColorOption)[];
  colorOptions?: ProductColorOption[];
  variants?: { name: string; priceDelta?: number; color?: string; image?: string }[];
  attributes?: Record<string, any>;
}): ProductColorOption[] {
  // 1. Explicit colorOptions takes top priority
  if (product.colorOptions && product.colorOptions.length > 0) {
    return product.colorOptions;
  }

  // 2. Explicit colors array
  if (product.colors && product.colors.length > 0) {
    return product.colors.map((c, idx) => {
      if (typeof c === "object" && c !== null && "name" in c) {
        return c as ProductColorOption;
      }
      const str = String(c);
      if (str.startsWith("#")) {
        // Find matching name or use generic
        const entry = Object.entries(KNOWN_COLOR_MAP).find(
          ([_, val]) => val.hex.toLowerCase() === str.toLowerCase()
        );
        const name = entry
          ? entry[0].replace(/\b\w/g, (l) => l.toUpperCase())
          : `Color ${idx + 1}`;
        return {
          name,
          hex: str,
          bgGradient: entry ? entry[1].bgGradient : undefined,
        };
      }
      const hex = getColorHex(str);
      const entry = KNOWN_COLOR_MAP[str.toLowerCase()];
      return {
        name: str,
        hex,
        bgGradient: entry?.bgGradient,
      };
    });
  }

  const nameLower = (product.name || "").toLowerCase();
  const idLower = (product.id || "").toLowerCase();
  const catLower = (product.category || "").toLowerCase();
  const subcatLower = (product.subcategory || "").toLowerCase();

  // 3. Apple iPhone 16 Pro / Pro Max
  if (
    idLower.includes("iphone_16") ||
    nameLower.includes("iphone 16 pro") ||
    nameLower.includes("iphone 16 pro max")
  ) {
    return [
      {
        name: "Natural Titanium",
        hex: "#C2BCB2",
        bgGradient: "linear-gradient(135deg, #d3cdc4, #a8a299)",
        image: product.frontImage,
      },
      {
        name: "Desert Titanium",
        hex: "#BFA48F",
        bgGradient: "linear-gradient(135deg, #d5bdab, #a78f7c)",
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
      },
      {
        name: "Black Titanium",
        hex: "#3C3C3D",
        bgGradient: "linear-gradient(135deg, #4a4a4c, #2b2b2c)",
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80",
      },
      {
        name: "White Titanium",
        hex: "#F2F1ED",
        bgGradient: "linear-gradient(135deg, #ffffff, #deddd8)",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      },
    ];
  }

  // 4. Samsung Galaxy S24 Ultra
  if (
    idLower.includes("s24_ultra") ||
    nameLower.includes("s24 ultra") ||
    nameLower.includes("galaxy s24")
  ) {
    return [
      {
        name: "Titanium Gray",
        hex: "#ACA49B",
        bgGradient: "linear-gradient(135deg, #c1b9b1, #968f86)",
        image: product.frontImage,
      },
      {
        name: "Titanium Black",
        hex: "#62605F",
        bgGradient: "linear-gradient(135deg, #484646, #222222)",
        image: product.sideImage || "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80",
      },
      {
        name: "Titanium Violet",
        hex: "#4D4E5F",
        bgGradient: "linear-gradient(135deg, #64657a, #383949)",
        image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=80",
      },
      {
        name: "Titanium Yellow",
        hex: "#F0E1B9",
        bgGradient: "linear-gradient(135deg, #f7ebd0, #dfd0a4)",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      },
    ];
  }

  // 5. Apple iPhone 15 Pro / Pro Max
  if (
    idLower.includes("iphone_15") ||
    nameLower.includes("iphone 15 pro") ||
    nameLower.includes("iphone 15 pro max")
  ) {
    return [
      {
        name: "Natural Titanium",
        hex: "#837F7D",
        bgGradient: "linear-gradient(135deg, #a49f9d, #696563)",
        image: product.frontImage,
      },
      {
        name: "Blue Titanium",
        hex: "#2F4452",
        bgGradient: "linear-gradient(135deg, #3d5565, #1e2e38)",
        image: product.sideImage || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&q=80",
      },
      {
        name: "Black Titanium",
        hex: "#1B1B1B",
        bgGradient: "linear-gradient(135deg, #303030, #111111)",
        image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600&q=80",
      },
      {
        name: "White Titanium",
        hex: "#DDDDDD",
        bgGradient: "linear-gradient(135deg, #ffffff, #c7c7c7)",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      },
    ];
  }

  // 6. Xiaomi Redmi Note 13 Pro
  if (idLower.includes("redmi_note_13") || nameLower.includes("redmi note 13")) {
    return [
      {
        name: "Midnight Black",
        hex: "#18191B",
        bgGradient: "linear-gradient(135deg, #2a2c2f, #111213)",
        image: product.frontImage,
      },
      {
        name: "Aurora Purple",
        hex: "#B6A5C9",
        bgGradient: "linear-gradient(135deg, #cbbddb, #9e8bb4)",
        image: "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&q=80",
      },
      {
        name: "Ocean Teal",
        hex: "#295E6F",
        bgGradient: "linear-gradient(135deg, #38788c, #1d4653)",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&q=80",
      },
      {
        name: "Arctic White",
        hex: "#EDF0F4",
        bgGradient: "linear-gradient(135deg, #ffffff, #d8dee6)",
        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80",
      },
    ];
  }

  // 7. Samsung Galaxy A55
  if (idLower.includes("galaxy_a55") || nameLower.includes("galaxy a55")) {
    return [
      { name: "Awesome Navy", hex: "#1A2233", bgGradient: "linear-gradient(135deg, #27344d, #111724)", image: product.frontImage },
      { name: "Awesome Iceblue", hex: "#C2D7E9", bgGradient: "linear-gradient(135deg, #d7e6f3, #a9c5dc)" },
      { name: "Awesome Lilac", hex: "#D4CAE0", bgGradient: "linear-gradient(135deg, #e4dcf0, #beafd0)" },
      { name: "Awesome Lemon", hex: "#F4EEC5", bgGradient: "linear-gradient(135deg, #faf6dc, #ede2a9)" },
    ];
  }

  // 8. Apple iPhone 13
  if (idLower.includes("iphone_13") || nameLower.includes("iphone 13")) {
    return [
      { name: "Midnight", hex: "#181E24", bgGradient: "linear-gradient(135deg, #262e36, #101419)", image: product.frontImage },
      { name: "Starlight", hex: "#F7F4ED", bgGradient: "linear-gradient(135deg, #ffffff, #eae5d7)" },
      { name: "Blue", hex: "#274862", bgGradient: "linear-gradient(135deg, #345c7b, #193144)" },
      { name: "Pink", hex: "#FAE0D8", bgGradient: "linear-gradient(135deg, #fcece6, #f3ccc1)" },
      { name: "Green", hex: "#3A4D42", bgGradient: "linear-gradient(135deg, #4a6154, #27342d)" },
    ];
  }

  // 9. Google Pixel 8 & 9 Series
  if (idLower.includes("pixel") || nameLower.includes("pixel")) {
    return [
      { name: "Obsidian", hex: "#2B2B2B", bgGradient: "linear-gradient(135deg, #3d3d3d, #1a1a1a)", image: product.frontImage },
      { name: "Porcelain", hex: "#F0ECE1", bgGradient: "linear-gradient(135deg, #ffffff, #ded9cd)", image: product.sideImage },
      { name: "Bay Blue", hex: "#9AB7D3", bgGradient: "linear-gradient(135deg, #adc6df, #829fc0)" },
      { name: "Hazel", hex: "#807E73", bgGradient: "linear-gradient(135deg, #918f83, #6d6b61)" },
    ];
  }

  // 10. Heavy-Duty Rugged Smartphones (Blackview, CAT, Ulefone)
  if (
    idLower.includes("rugged") ||
    idLower.includes("blackview") ||
    nameLower.includes("rugged") ||
    nameLower.includes("blackview") ||
    nameLower.includes("bv9300")
  ) {
    return [
      { name: "Tactical Black", hex: "#1C1D1F", bgGradient: "linear-gradient(135deg, #2b2d30, #131415)", image: product.frontImage },
      { name: "Army Green", hex: "#4A533E", bgGradient: "linear-gradient(135deg, #5b654e, #3a4230)", image: product.sideImage },
      { name: "Safety Orange", hex: "#E85D04", bgGradient: "linear-gradient(135deg, #f47219, #d04f00)" },
    ];
  }

  // 11. iPads & Tablets
  if (
    idLower.includes("ipad") ||
    nameLower.includes("ipad") ||
    idLower.includes("tablet") ||
    nameLower.includes("galaxy tab")
  ) {
    return [
      { name: "Space Gray", hex: "#4A4B4D", bgGradient: "linear-gradient(135deg, #5b5c5f, #363738)", image: product.frontImage },
      { name: "Silver", hex: "#E3E4E6", bgGradient: "linear-gradient(135deg, #f5f6f7, #cfd1d4)", image: product.sideImage },
      { name: "Starlight", hex: "#F7F4ED", bgGradient: "linear-gradient(135deg, #ffffff, #eae5d7)" },
      { name: "Blue", hex: "#A7B5C8", bgGradient: "linear-gradient(135deg, #bcc8d8, #8f9fb4)" },
    ];
  }

  // 12. MacBooks & Laptops
  if (
    idLower.includes("macbook") ||
    nameLower.includes("macbook") ||
    catLower.includes("computer") ||
    subcatLower.includes("laptop")
  ) {
    return [
      { name: "Space Gray", hex: "#4A4B4D", bgGradient: "linear-gradient(135deg, #5b5c5f, #363738)", image: product.frontImage },
      { name: "Silver", hex: "#E3E4E6", bgGradient: "linear-gradient(135deg, #f5f6f7, #cfd1d4)", image: product.sideImage },
      { name: "Midnight", hex: "#1A2026", bgGradient: "linear-gradient(135deg, #262e36, #101419)" },
      { name: "Starlight", hex: "#F7F4ED", bgGradient: "linear-gradient(135deg, #ffffff, #eae5d7)" },
    ];
  }

  // 9. Italian Tailored Wool Blazer / Formal Fashion
  if (
    idLower.includes("blazer") ||
    nameLower.includes("blazer") ||
    nameLower.includes("suit") ||
    (catLower.includes("fashion") && nameLower.includes("wool"))
  ) {
    return [
      {
        name: "Royal Navy",
        hex: "#1A2B4C",
        bgGradient: "linear-gradient(135deg, #263c66, #101c33)",
        image: product.frontImage,
      },
      {
        name: "Charcoal Gray",
        hex: "#374151",
        bgGradient: "linear-gradient(135deg, #4b5563, #28303b)",
        image: product.sideImage || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80",
      },
      {
        name: "Classic Black",
        hex: "#111827",
        bgGradient: "linear-gradient(135deg, #1f2937, #0a0e17)",
        image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=600&q=80",
      },
      {
        name: "Camel Tan",
        hex: "#B89065",
        bgGradient: "linear-gradient(135deg, #c9a57e, #a27a4d)",
        image: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?w=600&q=80",
      },
    ];
  }

  // 10. Extract colors from product.variants if present
  if (product.variants && product.variants.length > 0) {
    const extractedColors: ProductColorOption[] = [];
    const seen = new Set<string>();

    for (const v of product.variants) {
      // e.g. "256GB Titanium Gray" -> extract "Titanium Gray"
      // or "512GB Blue Titanium (+KES 18,000)" -> extract "Blue Titanium"
      const cleaned = v.name
        .replace(/\(\+.*?\)/g, "")
        .replace(/\d+\s*(gb|tb|pc|pack|piece|pcs)\b/gi, "")
        .trim();

      if (cleaned.length > 1 && !seen.has(cleaned.toLowerCase())) {
        seen.add(cleaned.toLowerCase());
        const hex = getColorHex(cleaned);
        const mapEntry = KNOWN_COLOR_MAP[cleaned.toLowerCase()];
        extractedColors.push({
          name: cleaned,
          hex,
          bgGradient: mapEntry?.bgGradient,
          image: v.image,
        });
      }
    }

    if (extractedColors.length > 0) {
      return extractedColors;
    }
  }

  // 11. Generic fallback for Phones & Tablets, Smartwatches, and Apparel
  if (
    catLower.includes("phone") ||
    subcatLower.includes("phone") ||
    subcatLower.includes("smartphone") ||
    subcatLower.includes("tablet")
  ) {
    return [
      { name: "Space Black", hex: "#2E2C2B", bgGradient: "linear-gradient(135deg, #3d3b3a, #1b1a19)", image: product.frontImage },
      { name: "Silver", hex: "#E3E4E6", bgGradient: "linear-gradient(135deg, #f5f6f7, #cfd1d4)", image: product.sideImage },
      { name: "Midnight Blue", hex: "#1B2A4A", bgGradient: "linear-gradient(135deg, #253961, #121d33)" },
    ];
  }

  if (catLower.includes("fashion") || catLower.includes("apparel") || catLower.includes("men")) {
    return [
      { name: "Classic Black", hex: "#111827", bgGradient: "linear-gradient(135deg, #1f2937, #0a0e17)", image: product.frontImage },
      { name: "Royal Navy", hex: "#1A2B4C", bgGradient: "linear-gradient(135deg, #263c66, #101c33)", image: product.sideImage },
      { name: "Charcoal Gray", hex: "#374151", bgGradient: "linear-gradient(135deg, #4b5563, #28303b)" },
    ];
  }

  return [];
}
