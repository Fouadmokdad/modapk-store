// =============================================================================
// Prisma Seed — Creates admin account + default categories
// =============================================================================
import { PrismaClient, AppType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...\n");

  // -------------------------------------------------------------------------
  // 1. Admin account
  // -------------------------------------------------------------------------
  const adminEmail = process.env.ADMIN_EMAIL || "admin@modapkstore.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {
      role: "SUPER_ADMIN",
    },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // -------------------------------------------------------------------------
  // 2. Default App Categories
  // -------------------------------------------------------------------------
  const appCategories = [
    { slug: "social", name: { en: "Social", ar: "تواصل اجتماعي" }, sortOrder: 1 },
    { slug: "communication", name: { en: "Communication", ar: "اتصالات" }, sortOrder: 2 },
    { slug: "productivity", name: { en: "Productivity", ar: "إنتاجية" }, sortOrder: 3 },
    { slug: "entertainment", name: { en: "Entertainment", ar: "ترفيه" }, sortOrder: 4 },
    { slug: "photography", name: { en: "Photography", ar: "تصوير" }, sortOrder: 5 },
    { slug: "music-audio", name: { en: "Music & Audio", ar: "موسيقى وصوتيات" }, sortOrder: 6 },
    { slug: "video-players", name: { en: "Video Players", ar: "مشغلات فيديو" }, sortOrder: 7 },
    { slug: "tools", name: { en: "Tools", ar: "أدوات" }, sortOrder: 8 },
    { slug: "education", name: { en: "Education", ar: "تعليم" }, sortOrder: 9 },
    { slug: "finance", name: { en: "Finance", ar: "مالية" }, sortOrder: 10 },
    { slug: "health-fitness", name: { en: "Health & Fitness", ar: "صحة ولياقة" }, sortOrder: 11 },
    { slug: "shopping", name: { en: "Shopping", ar: "تسوق" }, sortOrder: 12 },
    { slug: "travel", name: { en: "Travel & Local", ar: "سفر ومحلي" }, sortOrder: 13 },
    { slug: "news-magazines", name: { en: "News & Magazines", ar: "أخبار ومجلات" }, sortOrder: 14 },
    { slug: "personalization", name: { en: "Personalization", ar: "تخصيص" }, sortOrder: 15 },
  ];

  const gameCategories = [
    { slug: "action", name: { en: "Action", ar: "أكشن" }, sortOrder: 1 },
    { slug: "adventure", name: { en: "Adventure", ar: "مغامرة" }, sortOrder: 2 },
    { slug: "arcade", name: { en: "Arcade", ar: "آركيد" }, sortOrder: 3 },
    { slug: "racing", name: { en: "Racing", ar: "سباقات" }, sortOrder: 4 },
    { slug: "puzzle", name: { en: "Puzzle", ar: "ألغاز" }, sortOrder: 5 },
    { slug: "strategy", name: { en: "Strategy", ar: "استراتيجية" }, sortOrder: 6 },
    { slug: "simulation", name: { en: "Simulation", ar: "محاكاة" }, sortOrder: 7 },
    { slug: "sports", name: { en: "Sports", ar: "رياضة" }, sortOrder: 8 },
    { slug: "role-playing", name: { en: "Role Playing", ar: "تقمص أدوار" }, sortOrder: 9 },
    { slug: "casual", name: { en: "Casual", ar: "عادية" }, sortOrder: 10 },
  ];

  for (const cat of appCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, type: AppType.APP },
    });
  }
  console.log(`✅ ${appCategories.length} app categories created`);

  for (const cat of gameCategories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, type: AppType.GAME },
    });
  }
  console.log(`✅ ${gameCategories.length} game categories created`);

  // -------------------------------------------------------------------------
  // 3. Default Tags
  // -------------------------------------------------------------------------
  const tags = [
    { slug: "premium", name: { en: "Premium", ar: "مميز" } },
    { slug: "mod", name: { en: "MOD", ar: "معدّل" } },
    { slug: "unlocked", name: { en: "Unlocked", ar: "مفتوح" } },
    { slug: "ad-free", name: { en: "Ad-Free", ar: "بدون إعلانات" } },
    { slug: "unlimited-money", name: { en: "Unlimited Money", ar: "أموال غير محدودة" } },
    { slug: "latest", name: { en: "Latest", ar: "الأحدث" } },
    { slug: "popular", name: { en: "Popular", ar: "شائع" } },
    { slug: "editors-choice", name: { en: "Editor's Choice", ar: "اختيار المحرر" } },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    });
  }
  console.log(`✅ ${tags.length} tags created`);

  console.log("\n🎉 Seed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
