import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES_DATA = [
  {
    name: "Electronics",
    subcategories: [
      {
        title: "Phones & Audio",
        items: ["Wireless Earbuds", "Smartphones", "Bluetooth Speakers", "Power Banks"],
      },
      {
        title: "Computers",
        items: ["MacBooks", "Laptops", "Monitors & Screens", "Storage & SSDs"],
      },
    ],
    featured: {
      title: "Noise-Canceling Earbuds",
      subtitle: "From KSh 4,500 with Express Delivery",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80",
    },
  },
  {
    name: "Fashion",
    subcategories: [
      {
        title: "Men's Wear",
        items: ["Heavyweight Hoodies", "Urban T-Shirts", "Denim Jackets", "Sneakers"],
      },
      {
        title: "Accessories",
        items: ["Leather Wallets", "Sunglasses", "Watches", "Backpacks"],
      },
    ],
    featured: {
      title: "Urban Cotton Hoodies",
      subtitle: "Special Sale - KSh 2,200",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=300&q=80",
    },
  },
  {
    name: "Home & Appliances",
    subcategories: [
      {
        title: "Kitchen Essentials",
        items: ["Blenders & Mixers", "Air Fryers", "Microwaves", "Electric Kettles"],
      },
      {
        title: "Living & Comfort",
        items: ["Smart TVs", "Standing Fans", "Heaters", "Coffee Makers"],
      },
    ],
    featured: {
      title: "Digital Air Fryer 5L",
      subtitle: "Ready for 45-Min Boda Dispatch",
      image: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=300&q=80",
    },
  },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding category hierarchy...");

  // Wipe previous data
  await prisma.categoryFeaturedPromotion.deleteMany();
  await prisma.categoryItem.deleteMany();
  await prisma.category.deleteMany();

  for (let groupIndex = 0; groupIndex < CATEGORIES_DATA.length; groupIndex++) {
    const group = CATEGORIES_DATA[groupIndex];

    await prisma.category.create({
      data: {
        name: group.name,
        slug: slugify(group.name),
        displayOrder: groupIndex,
        // Insert featured banner
        featured: {
          create: {
            title: group.featured.title,
            subtitle: group.featured.subtitle,
            imageUrl: group.featured.image,
            targetUrl: `/shop/${slugify(group.name)}/deals`,
          },
        },
        // Insert subcategories (as child categories) + their items
        children: {
          create: group.subcategories.map((sub, subIndex) => ({
            name: sub.title,
            slug: `${slugify(group.name)}-${slugify(sub.title)}`,
            displayOrder: subIndex,
            items: {
              create: sub.items.map((item, itemIndex) => ({
                title: item,
                slug: slugify(item),
                displayOrder: itemIndex,
              })),
            },
          })),
        },
      },
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
