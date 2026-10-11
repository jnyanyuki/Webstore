import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { NON_PERISHABLE_TAXONOMY } from "../src/lib/data/categoriesData";

const prisma = new PrismaClient();

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

  for (let groupIndex = 0; groupIndex < NON_PERISHABLE_TAXONOMY.length; groupIndex++) {
    const group = NON_PERISHABLE_TAXONOMY[groupIndex];

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
