import { CategoryGroup } from "@webstore/types";

export interface TaxonomyDepartment {
  name: string;
  slug: string;
  subcategories: Array<{
    title: string;
    slug: string;
    items: string[];
  }>;
  featured: {
    title: string;
    subtitle: string;
    image: string;
    targetUrl: string;
  };
}

/**
 * Industry-Standard E-Commerce Non-Perishable Category Taxonomy
 * Modeled after AliExpress, Kenyatronics, Jumia, eBay, Walmart, Temu, and Kilimall.
 * Strictly excludes any perishable or expirable items (no groceries, food, or fresh produce).
 */
export const NON_PERISHABLE_TAXONOMY: TaxonomyDepartment[] = [
  {
    name: "Phones & Tablets",
    slug: "phones-tablets",
    featured: {
      title: "Flagship Smartphones & 5G",
      subtitle: "Official warranties with express dispatch",
      image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&q=85",
      targetUrl: "/shop/phones-tablets",
    },
    subcategories: [
      {
        title: "Smartphones & Devices",
        slug: "smartphones-devices",
        items: [
          "5G Flagship Smartphones",
          "Budget & Mid-Range Phones",
          "Refurbished Certified Phones",
          "Rugged & Feature Phones",
          "Android & iPad Tablets",
          "Kids Learning Tablets",
          "E-Readers & Paper Tablets",
        ],
      },
      {
        title: "Mobile Accessories",
        slug: "mobile-accessories",
        items: [
          "Fast Wall Chargers & GaN Plugs",
          "Wireless & MagSafe Chargers",
          "High-Capacity Power Banks",
          "Shockproof Cases & Covers",
          "Tempered Glass Screen Protectors",
          "Heavy-Duty Braided Cables",
          "Magnetic Car Phone Mounts",
          "Selfie Sticks & Mobile Gimbals",
        ],
      },
      {
        title: "Smart Wearables",
        slug: "smart-wearables",
        items: [
          "Smartwatches (iOS & Android)",
          "Fitness Trackers & Bands",
          "Smart Audio Glasses",
          "Replacement Silicone & Leather Straps",
          "Smartwatch Magnetic Docks",
        ],
      },
      {
        title: "Parts & Tools",
        slug: "phone-parts-tools",
        items: [
          "Replacement LCD & OLED Screens",
          "Internal Phone Batteries",
          "Precision Phone Repair Screwdrivers",
          "SIM Card Adapters & Trays",
          "Two-Way Long Range Walkie Talkies",
        ],
      },
    ],
  },
  {
    name: "Computers & Gaming",
    slug: "computers-gaming",
    featured: {
      title: "Pro Computing & Esports Gear",
      subtitle: "High-performance laptops, PCs & peripherals",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=85",
      targetUrl: "/shop/computers-gaming",
    },
    subcategories: [
      {
        title: "Laptops & Computers",
        slug: "laptops-computers",
        items: [
          "Apple MacBooks & Ultrabooks",
          "High-Refresh Gaming Laptops",
          "Business & Student Notebooks",
          "Desktop Tower PCs",
          "All-in-One Space-Saving PCs",
          "Mini PCs & Workstations",
        ],
      },
      {
        title: "Components & Hardware",
        slug: "computer-components",
        items: [
          "Desktop Processors (CPUs)",
          "Dedicated Graphics Cards (GPUs)",
          "Motherboards (Intel & AMD)",
          "DDR4 & DDR5 RAM Memory",
          "M.2 NVMe SSDs & Internal Drives",
          "Modular Power Supplies (PSU)",
          "PC Gaming Cases & RGB Fans",
          "AIO Liquid CPU Coolers",
        ],
      },
      {
        title: "Peripherals & Storage",
        slug: "peripherals-storage",
        items: [
          "4K & Curved Gaming Monitors",
          "Mechanical RGB Keyboards",
          "Ergonomic Wireless Mice",
          "External Portable SSDs & HDDs",
          "High-Speed USB 3.2 Flash Drives",
          "Multi-Port USB-C Docks & Hubs",
          "1080p / 4K Streaming Webcams",
          "Podcasting USB Microphones",
        ],
      },
      {
        title: "Gaming & Consoles",
        slug: "gaming-consoles",
        items: [
          "PlayStation 5 Consoles & Games",
          "Xbox Series X/S Consoles",
          "Nintendo Switch OLED",
          "Wireless Gamepads & Controllers",
          "Surround Sound Gaming Headsets",
          "Ergonomic Racing Gaming Chairs",
          "Racing Wheels & Flight Sticks",
          "VR Virtual Reality Headsets",
        ],
      },
      {
        title: "Networking & Office Tech",
        slug: "networking-office",
        items: [
          "Wi-Fi 6 / 6E Gigabit Routers",
          "Whole-Home Mesh WiFi Systems",
          "Gigabit Network Switches",
          "4G / 5G SIM Card Mobile Routers",
          "Color EcoTank & Laser Printers",
          "Barcode Scanners & Thermal Printers",
          "Cross-Cut Paper Shredders",
        ],
      },
    ],
  },
  {
    name: "TVs, Audio & Vision",
    slug: "tvs-audio-vision",
    featured: {
      title: "Cinematic 4K Home Theaters",
      subtitle: "Smart OLED TVs & Hi-Fi sound systems",
      image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=85",
      targetUrl: "/shop/tvs-audio-vision",
    },
    subcategories: [
      {
        title: "Televisions",
        slug: "televisions",
        items: [
          "4K Ultra HD Smart TVs",
          "OLED, QLED & Mini-LED TVs",
          "Google & Android Smart TVs",
          "Compact 32\" & 43\" Bedroom TVs",
          "Commercial Display Panels",
        ],
      },
      {
        title: "Audio & Headphones",
        slug: "audio-headphones",
        items: [
          "True Wireless Earbuds (TWS)",
          "Active Noise-Cancelling Headphones",
          "Over-Ear Wired Studio Monitors",
          "Sweat-Proof Sports Earphones",
          "Hands-Free Bluetooth Headsets",
        ],
      },
      {
        title: "Sound Systems & Hi-Fi",
        slug: "sound-systems",
        items: [
          "Dolby Atmos Soundbars & Subwoofers",
          "5.1 Home Theater Surround Systems",
          "High-Power Party & PA Speakers",
          "Waterproof Portable Bluetooth Speakers",
          "Stereo Bookshelf Hi-Fi Speakers",
          "Stereo Amplifiers & Receivers",
        ],
      },
      {
        title: "Projectors & TV Accessories",
        slug: "projectors-tv-accessories",
        items: [
          "Full HD & 4K Home Cinema Projectors",
          "Motorized & Portable Projector Screens",
          "Heavy-Duty TV Wall Mounts & Brackets",
          "Android TV Sticks & Streaming Boxes",
          "High-Speed 8K HDMI Cables",
          "Universal Remote Controls",
        ],
      },
    ],
  },
  {
    name: "Home Appliances",
    slug: "home-appliances",
    featured: {
      title: "Smart Kitchen & Living Tech",
      subtitle: "Air fryers, washing machines & cooling",
      image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&q=85",
      targetUrl: "/shop/home-appliances",
    },
    subcategories: [
      {
        title: "Small Kitchen Appliances",
        slug: "small-kitchen-appliances",
        items: [
          "Digital Air Fryers & Multi-Cookers",
          "High-Torque Blenders & Smoothie Makers",
          "Microwave Ovens & Toaster Grills",
          "Cordless Electric Kettles & Urns",
          "Espresso & Drip Coffee Makers",
          "Food Processors & Stand Mixers",
          "Sandwich Toasters & Waffle Makers",
          "Electric Pressure Cookers",
        ],
      },
      {
        title: "Cooling & Refrigeration",
        slug: "cooling-refrigeration",
        items: [
          "Double-Door Frost-Free Refrigerators",
          "Side-by-Side Inverter Fridges",
          "Deep Chest Freezers",
          "Compact Beverage Mini-Fridges",
          "Hot & Cold Water Dispensers",
        ],
      },
      {
        title: "Cooking & Heavy Appliances",
        slug: "heavy-cooking-appliances",
        items: [
          "Gas & Electric Free-Standing Cookers",
          "Built-In Induction & Gas Hobs",
          "Range Hoods & Chimney Extractors",
          "Built-In Convection Ovens",
          "Automatic Kitchen Dishwashers",
        ],
      },
      {
        title: "Laundry & Garment Care",
        slug: "laundry-garment-care",
        items: [
          "Front-Load Inverter Washing Machines",
          "Top-Load Automatic Washers",
          "Twin-Tub Washers & Spinners",
          "Condenser Clothes Dryers",
          "Non-Stick Dry & Steam Irons",
          "Handheld Garment Steamers",
        ],
      },
      {
        title: "Climate Control & Air Care",
        slug: "climate-control",
        items: [
          "Standing & Tower Oscillating Fans",
          "Ceiling Fans with Remote Control",
          "Split Inverter Air Conditioners",
          "Portable Rolling Air Conditioners",
          "HEPA Air Purifiers & Ionizers",
          "Dehumidifiers & Ceramic Heaters",
        ],
      },
    ],
  },
  {
    name: "Solar & Power Backup",
    slug: "solar-power-backup",
    featured: {
      title: "Clean Solar Energy & UPS",
      subtitle: "Zero power blackouts with inverters & lithium batteries",
      image: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&q=85",
      targetUrl: "/shop/solar-power-backup",
    },
    subcategories: [
      {
        title: "Solar Systems",
        slug: "solar-systems",
        items: [
          "Monocrystalline Solar Panels",
          "MPPT & PWM Solar Charge Controllers",
          "Solar Home Lighting Kits",
          "Outdoor Solar Street & Floodlights",
          "Solar Submersible Water Pumps",
          "Solar DC Cable Connectors (MC4)",
        ],
      },
      {
        title: "Inverters & Storage Batteries",
        slug: "inverters-batteries",
        items: [
          "Pure Sine Wave Hybrid Inverters",
          "Lithium LiFePO4 Battery Banks",
          "Deep Cycle Gel & AGM Solar Batteries",
          "Portable Lithium Power Stations",
          "Uninterruptible Power Supplies (UPS)",
        ],
      },
      {
        title: "Backup Generators & Protection",
        slug: "generators-power-protection",
        items: [
          "Silent Inverter Petrol Generators",
          "Heavy Duty Diesel Generators",
          "Automatic Voltage Regulators (AVR)",
          "Surge Protectors & Power Strips",
          "Automatic Transfer Switches (ATS)",
        ],
      },
    ],
  },
  {
    name: "Men's Fashion & Shoes",
    slug: "mens-fashion-shoes",
    featured: {
      title: "Streetwear & Formal Men's Apparel",
      subtitle: "Premium cotton hoodies, denim & sneakers",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=85",
      targetUrl: "/shop/mens-fashion-shoes",
    },
    subcategories: [
      {
        title: "Men's Clothing",
        slug: "mens-clothing",
        items: [
          "Heavyweight Cotton Hoodies",
          "Casual T-Shirts & Graphic Tees",
          "Polo Shirts & Button-Downs",
          "Slim & Straight Leg Denim Jeans",
          "Casual Chinos & Cargo Pants",
          "Athletic Joggers & Sweatpants",
          "Blazers & Formal Suit Sets",
          "Windbreakers & Leather Jackets",
        ],
      },
      {
        title: "Men's Footwear",
        slug: "mens-footwear",
        items: [
          "Retro & Casual Sneakers",
          "Performance Running Shoes",
          "Formal Leather Oxford & Derby Shoes",
          "Penny Loafers & Slip-Ons",
          "Chelsea & Combat Boots",
          "Leather Slides & Outdoor Sandals",
        ],
      },
      {
        title: "Underwear & Loungewear",
        slug: "mens-underwear-loungewear",
        items: [
          "Cotton Boxer Briefs & Trunks",
          "Undershirts & Ribbed Vests",
          "Cotton Pajama Sets & Loungewear",
          "Cushioned Athletic Socks",
          "Thermal Winter Base Layers",
        ],
      },
      {
        title: "Men's Accessories",
        slug: "mens-accessories",
        items: [
          "Genuine Leather Belts",
          "Bifold Wallets & Cardholders",
          "Silk Ties, Bowties & Cufflinks",
          "Baseball Caps, Snapbacks & Fedoras",
          "Polarized Aviator Sunglasses",
        ],
      },
    ],
  },
  {
    name: "Women's Fashion & Bags",
    slug: "womens-fashion-bags",
    featured: {
      title: "Contemporary Women's Style",
      subtitle: "Designer dresses, footwear & handbags",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&q=85",
      targetUrl: "/shop/womens-fashion-bags",
    },
    subcategories: [
      {
        title: "Women's Apparel",
        slug: "womens-apparel",
        items: [
          "Casual & Evening Cocktail Dresses",
          "Fashion Tops, Blouses & Camisoles",
          "High-Waist Jeans & Jeggings",
          "Tailored Trousers & Wide-Leg Pants",
          "Midi, Maxi & Pleated Skirts",
          "Knit Sweaters & Cardigans",
          "Denim Jackets & Trench Coats",
          "Jumpsuits, Rompers & Co-ords",
        ],
      },
      {
        title: "Women's Shoes",
        slug: "womens-shoes",
        items: [
          "Fashion Chunky Sneakers",
          "Stiletto Heels & Classic Pumps",
          "Comfortable Ballet Flats & Loafers",
          "Ankle & Over-The-Knee Boots",
          "Wedges & Platform Espadrilles",
          "Strappy Heeled Sandals & Slides",
        ],
      },
      {
        title: "Handbags & Wallets",
        slug: "womens-handbags",
        items: [
          "Structured Crossbody Bags",
          "Spacious Leather Tote Bags",
          "Shoulder Satchels & Hobo Bags",
          "Evening Clutches & Wristlets",
          "Compact Zip Wallets & Purses",
        ],
      },
      {
        title: "Lingerie & Shapewear",
        slug: "lingerie-shapewear",
        items: [
          "Underwire & Wireless Bras",
          "Seamless Panties & Thongs",
          "High-Compression Waist Trainers",
          "Full-Body Shapewear Bodysuits",
          "Silk Nightgowns & Robe Sets",
        ],
      },
    ],
  },
  {
    name: "Watches, Jewelry & Optics",
    slug: "watches-jewelry-optics",
    featured: {
      title: "Fine Timepieces & Accessories",
      subtitle: "Automatic watches, jewelry & polarized shades",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=85",
      targetUrl: "/shop/watches-jewelry-optics",
    },
    subcategories: [
      {
        title: "Watches",
        slug: "watches",
        items: [
          "Automatic Mechanical Watches",
          "Quartz Analog Dress Watches",
          "Chronograph Sports Watches",
          "Digital Shock-Resistant Watches",
          "Luxury Watch Winders & Display Cases",
        ],
      },
      {
        title: "Fine & Fashion Jewelry",
        slug: "jewelry",
        items: [
          "Gold & Silver Plated Necklaces",
          "Drop, Hoop & Stud Earrings",
          "Stainless Steel Chain Bracelets",
          "Wedding Bands & Statement Rings",
          "Brooches, Pins & Lapel Accessories",
          "Velvet Jewelry Storage Boxes",
        ],
      },
      {
        title: "Eyewear & Optics",
        slug: "eyewear-optics",
        items: [
          "Polarized UV400 Sunglasses",
          "Anti-Blue Light Computer Glasses",
          "Retro & Modern Eyeglass Frames",
          "Magnifying Reading Glasses",
          "Leather Sunglasses Cases & Cords",
        ],
      },
    ],
  },
  {
    name: "Home, Furniture & Living",
    slug: "home-furniture-living",
    featured: {
      title: "Modern Furniture & Interior Decor",
      subtitle: "Ergonomic living, cookware & luxury bedding",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=85",
      targetUrl: "/shop/home-furniture-living",
    },
    subcategories: [
      {
        title: "Furniture",
        slug: "furniture",
        items: [
          "Sectional Sofas & L-Couches",
          "Modern Coffee & Side Tables",
          "TV Stands & Media Consoles",
          "Hardwood Bed Frames & Headboards",
          "Orthopedic Spring Mattresses",
          "Ergonomic High-Back Office Chairs",
          "Adjustable Height Standing Desks",
          "6-Seater Wooden Dining Sets",
        ],
      },
      {
        title: "Cookware & Dining",
        slug: "cookware-dining",
        items: [
          "Granite Non-Stick Pot & Pan Sets",
          "Heavy Cast Iron Skillets & Dutch Ovens",
          "High-Carbon Chef Knife Sets & Blocks",
          "Stainless Steel Cutlery & Utensils",
          "Ceramic Dinnerware & Plate Sets",
          "Tempered Glassware & Drink Tumblers",
          "Wooden & Plastic Cutting Boards",
        ],
      },
      {
        title: "Home Decor & Lighting",
        slug: "home-decor-lighting",
        items: [
          "Modern Wall Clocks & Framed Mirrors",
          "Abstract Canvas Wall Art",
          "Ambient Floor & Bedside Lamps",
          "RGB Smart LED Light Strips",
          "Plush Living Room Area Rugs",
          "Blackout Curtains & Drapery Rods",
          "Decorative Ceramic Vases & Planters",
        ],
      },
      {
        title: "Bedding & Bath",
        slug: "bedding-bath",
        items: [
          "100% Egyptian Cotton Bed Sheets",
          "Hypoallergenic Microfiber Duvets",
          "Orthopedic Memory Foam Pillows",
          "Quilted Bedspreads & Throw Blankets",
          "Ultra-Absorbent Cotton Bath Towels",
          "Non-Slip Memory Foam Bath Mats",
        ],
      },
      {
        title: "Storage & Home Organization",
        slug: "storage-organization",
        items: [
          "Multi-Tier Metal Shoe Racks",
          "Fabric Wardrobe Storage Bins",
          "Foldable Clothes Drying Racks",
          "Airtight Kitchen Container Sets",
          "Space-Saving Vacuum Storage Bags",
        ],
      },
    ],
  },
  {
    name: "Beauty Tools & Personal Care",
    slug: "beauty-personal-care",
    featured: {
      title: "Professional Grooming & Styling",
      subtitle: "Hair tools, clippers, oral care & skincare devices",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=85",
      targetUrl: "/shop/beauty-personal-care",
    },
    subcategories: [
      {
        title: "Hair Care & Styling Tools",
        slug: "hair-tools-styling",
        items: [
          "Human Hair Lace Front Wigs",
          "Synthetic Braids & Hair Extensions",
          "Ionic Ceramic Hair Blow Dryers",
          "Titanium Flat Iron Straighteners",
          "Automatic Rotating Curling Wands",
          "Cordless Barber Hair Clippers",
          "Beard & Mustache Trimming Kits",
        ],
      },
      {
        title: "Skincare & Wellness Devices",
        slug: "skincare-wellness-devices",
        items: [
          "Sonic Facial Cleansing Brushes",
          "Micro-Current Face Lift Devices",
          "High-Frequency Deep Tissue Massage Guns",
          "LED Photon Light Therapy Masks",
          "Gua Sha Stones & Jade Facial Rollers",
          "Electric Foot Callus Removers",
        ],
      },
      {
        title: "Oral Care & Shaving",
        slug: "oral-care-shaving",
        items: [
          "Sonic Electric Rechargeable Toothbrushes",
          "Cordless Water Dental Flossers",
          "Rotary Wet/Dry Electric Shavers",
          "Permanent IPL Laser Hair Removers",
        ],
      },
      {
        title: "Makeup Accessories & Scent",
        slug: "makeup-accessories-scent",
        items: [
          "Professional Makeup Brush Sets",
          "Illuminated LED Vanity Mirrors",
          "Multi-Layer Makeup Organizer Cases",
          "Men's Long-Lasting Eau de Parfum",
          "Women's Luxury Designer Fragrances",
          "Ultrasonic Aroma Oil Diffusers",
        ],
      },
    ],
  },
  {
    name: "Sports, Fitness & Outdoors",
    slug: "sports-fitness-outdoors",
    featured: {
      title: "Gym Equipment & Adventure Gear",
      subtitle: "Dumbbells, treadmills, camping tents & bikes",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&q=85",
      targetUrl: "/shop/sports-fitness-outdoors",
    },
    subcategories: [
      {
        title: "Strength & Gym Equipment",
        slug: "strength-gym",
        items: [
          "Adjustable Dumbbell & Barbell Sets",
          "Heavy Duty Resistance Exercise Bands",
          "Cast Iron Kettlebells",
          "Multi-Position Weight Benches",
          "Doorway Chin-Up & Pull-Up Bars",
          "Non-Slip High-Density Yoga Mats",
        ],
      },
      {
        title: "Cardio Machines",
        slug: "cardio-machines",
        items: [
          "Foldable Electric Motorized Treadmills",
          "Magnetic Indoor Cycling Exercise Bikes",
          "Elliptical Cross Trainers",
          "Air & Water Rowing Machines",
          "High-Speed Weighted Jump Ropes",
        ],
      },
      {
        title: "Outdoor & Camping Gear",
        slug: "outdoor-camping",
        items: [
          "Waterproof Family Camping Tents",
          "All-Season Sleeping Bags",
          "Heavy-Duty Tactical Backpacks",
          "High-Lumen LED Torches & Lanterns",
          "Foldable Camping Chairs & Tables",
          "Stainless Steel Multi-Tools & Knives",
        ],
      },
      {
        title: "Cycling & Bicycles",
        slug: "cycling-bicycles",
        items: [
          "Aluminum Mountain Bikes (MTB)",
          "Urban Commuter Road Bicycles",
          "Aerodynamic Bike Helmets",
          "High-Decibel Bike Horns & LED Lights",
          "Heavy-Duty Steel Bicycle Locks",
          "Portable Bike Tire Pumps & Tool Kits",
        ],
      },
      {
        title: "Team & Ball Sports",
        slug: "team-ball-sports",
        items: [
          "Official Match Footballs & Shin Guards",
          "Indoor / Outdoor Leather Basketballs",
          "Graphite Tennis & Badminton Rackets",
          "Table Tennis Bats & Net Sets",
          "Boxing Gloves & Heavy Punching Bags",
        ],
      },
    ],
  },
  {
    name: "Automotive & Tools",
    slug: "automotive-tools",
    featured: {
      title: "Auto Electronics, Tools & Gear",
      subtitle: "Dash cams, power drills & mechanic kits",
      image: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=85",
      targetUrl: "/shop/automotive-tools",
    },
    subcategories: [
      {
        title: "Car Electronics & Safety",
        slug: "car-electronics-safety",
        items: [
          "Android Touchscreen Car Head Units",
          "Dual Lens 4K Dash Cams & Reverse Cameras",
          "Car Subwoofers & Component Speakers",
          "Bluetooth FM Transmitters & Chargers",
          "Portable Emergency Car Jump Starters",
          "Digital 12V Electric Tire Inflators",
          "OBD2 Bluetooth Engine Diagnostic Scanners",
        ],
      },
      {
        title: "Interior & Exterior Accessories",
        slug: "auto-accessories",
        items: [
          "Universal Leather Car Seat Covers",
          "Heavy Duty All-Weather Rubber Floor Mats",
          "Microfiber Car Detailing Wash Kits",
          "High-Pressure Portable Car Washers",
          "Handheld Wet/Dry Car Vacuum Cleaners",
          "All-Weather UV Reflective Car Covers",
        ],
      },
      {
        title: "Motorcycle Gear",
        slug: "motorcycle-gear",
        items: [
          "DOT Certified Full Face Helmets",
          "Armored Motorcycle Riding Jackets",
          "Touchscreen Reinforced Riding Gloves",
          "Waterproof Motorcycle Tail Bags",
          "Motorcycle Handlebar Phone Mounts",
        ],
      },
      {
        title: "Power Tools & Workshop",
        slug: "power-tools-workshop",
        items: [
          "Cordless Brushless Impact Drills",
          "Heavy Duty Angle Grinders",
          "Circular Saws & Jigsaws",
          "Rotary Demolition Hammer Drills",
          "Inverter Arc Welding Machines",
          "Auto-Darkening Welding Helmets",
        ],
      },
      {
        title: "Hand Tools & Hardware",
        slug: "hand-tools-hardware",
        items: [
          "Complete Mechanics Socket Wrench Sets",
          "Magnetic Screwdriver Tool Sets",
          "Laser Measuring Tapes & Spirit Levels",
          "Heavy-Duty Pliers & Wire Cutters",
          "Steel-Toe Safety Work Boots",
          "Heavy Duty Toolboxes & Rolling Chests",
        ],
      },
    ],
  },
  {
    name: "Baby Gear, Nursery & Toys",
    slug: "baby-gear-toys",
    featured: {
      title: "Safe Baby Mobility & STEM Toys",
      subtitle: "Strollers, car seats, nursery & remote control toys",
      image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&q=85",
      targetUrl: "/shop/baby-gear-toys",
    },
    subcategories: [
      {
        title: "Baby Mobility & Safety",
        slug: "baby-mobility-safety",
        items: [
          "Lightweight Foldable Baby Strollers",
          "Convertible Infant Car Seats",
          "Ergonomic 4-in-1 Baby Carriers",
          "Adjustable Baby High Chairs",
          "Activity Baby Walkers & Bouncers",
          "Wireless 1080p Video Baby Monitors",
        ],
      },
      {
        title: "Nursery & Furniture",
        slug: "nursery-furniture",
        items: [
          "Wooden Baby Cribs & Cots",
          "Bedside Co-Sleepers & Bassinets",
          "Portable Folding Baby Playpens",
          "Waterproof Diaper Changing Tables",
          "Cotton Baby Swaddles & Crib Sheets",
        ],
      },
      {
        title: "Baby & Kids Fashion",
        slug: "baby-kids-fashion",
        items: [
          "100% Organic Cotton Baby Bodysuits",
          "Boys Casual Sets & Denim Trousers",
          "Girls Party Dresses & Outfits",
          "Kids School & Casual Sneakers",
          "Warm Hooded Rompers & Sleepsuits",
        ],
      },
      {
        title: "Toys, STEM & Hobbies",
        slug: "toys-stem-hobbies",
        items: [
          "Building Blocks & Brick Construction Sets",
          "High-Speed Remote Control (RC) Cars",
          "Foldable Camera Drones for Beginners",
          "STEM Robotics & Science Kits",
          "Wooden Educational Learning Puzzles",
          "Classic Family Board Games",
        ],
      },
    ],
  },
  {
    name: "Security, Smart Home & Travel",
    slug: "security-smart-home-travel",
    featured: {
      title: "Surveillance, Smart Locks & Luggage",
      subtitle: "Solar 4G CCTV cameras, smart locks & suitcases",
      image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=85",
      targetUrl: "/shop/security-smart-home-travel",
    },
    subcategories: [
      {
        title: "CCTV & Security Surveillance",
        slug: "cctv-surveillance",
        items: [
          "Outdoor Solar Powered 4G CCTV Cameras",
          "360° WiFi PTZ Dome Security Cameras",
          "Wireless Multi-Camera Home NVR Kits",
          "Smart Video Doorbells with Chime",
          "PIR Motion Detection Floodlight Cameras",
        ],
      },
      {
        title: "Smart Locks & Access",
        slug: "smart-locks-access",
        items: [
          "Biometric Fingerprint Digital Smart Locks",
          "Tuya WiFi Keyless Door Deadbolts",
          "RFID Access Control Keypads & Cards",
          "Smart Waterproof Padlocks",
        ],
      },
      {
        title: "Smart Home Automation",
        slug: "smart-home-automation",
        items: [
          "WiFi Smart Wall Light Switches",
          "Smart Plug Sockets with Power Metering",
          "Zigbee & Tuya Smart Gateways",
          "Wireless Magnetic Door & Window Sensors",
          "Motorized Smart Curtain Openers",
        ],
      },
      {
        title: "Luggage & Travel Bags",
        slug: "luggage-travel-bags",
        items: [
          "Hard-Shell Spinner Suitcase Sets (3-Piece)",
          "Anti-Theft Laptop Travel Backpacks",
          "Foldable Travel Duffel & Gym Bags",
          "Travel Compression Packing Cubes",
          "Digital Luggage Hanging Scales",
        ],
      },
    ],
  },
  {
    name: "Office, Stationery & Music",
    slug: "office-stationery-music",
    featured: {
      title: "Workspace & Audio Creatives",
      subtitle: "Office tech, art supplies, guitars & pro audio",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=85",
      targetUrl: "/shop/office-stationery-music",
    },
    subcategories: [
      {
        title: "Office Equipment & Tech",
        slug: "office-equipment",
        items: [
          "Heavy Duty Document Laminating Machines",
          "High-Capacity Paper Binding Machines",
          "Magnetic Wall Whiteboards & Markers",
          "Leather Desk Blotters & Organizers",
          "Heavy Duty Staplers & Hole Punches",
        ],
      },
      {
        title: "Art, Craft & Drawing",
        slug: "art-craft-supplies",
        items: [
          "Alcohol-Based Dual Tip Art Markers",
          "Professional Colored Pencil Sets",
          "Heavyweight Sketchbooks & Pads",
          "Acrylic Paint Sets & Stretched Canvases",
          "Self-Healing Craft Cutting Mats",
        ],
      },
      {
        title: "Musical Instruments & Pro Audio",
        slug: "musical-instruments-audio",
        items: [
          "Acoustic & Electric Guitar Bundles",
          "61 & 88-Key Electronic Piano Keyboards",
          "Studio Condenser Recording Microphones",
          "USB Audio Interfaces (2-In / 2-Out)",
          "Multi-Channel Audio Mixer Consoles",
        ],
      },
    ],
  },
];
