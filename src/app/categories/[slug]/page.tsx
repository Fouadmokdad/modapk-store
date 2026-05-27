// =============================================================================
// Category Detail Page — Server Component (Bilingual & SEO Hardened)
// =============================================================================
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { generateCategoryMetadata, generateBreadcrumbJsonLd } from "@/lib/seo";
import { cookies } from "next/headers";
import CategoryDetailClient from "./CategoryDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    const category = await db.category.findUnique({
      where: { slug },
    });

    if (!category) return { title: "Category Not Found" };

    const cookieStore = await cookies();
    const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";

    return generateCategoryMetadata(category as any, locale);
  } catch (error) {
    console.error("Database offline during metadata generation for category page:", error);
    return { title: "Category Listings" };
  }
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let category: any = null;
  let dbError = false;

  try {
    category = await db.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            apps: {
              where: { status: "PUBLISHED" },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Database offline during category detail query:", error);
    dbError = true;
  }

  if (dbError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: "#0a0b0e" }}>
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-4xl mb-6 animate-pulse">
          📡
        </div>
        <h1 className="text-3xl font-extrabold mb-4 tracking-tight" style={{ fontFamily: "Syne, sans-serif", color: "#00e5ff" }}>
          Service Temporarily Offline
        </h1>
        <p className="text-sm max-w-md mb-8 leading-relaxed text-neutral-400" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Our app servers are currently having trouble connecting to the database. Please try reloading this page in a few moments.
        </p>
        <a
          href=""
          className="px-6 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] text-white"
          style={{
            background: "linear-gradient(135deg, #00e5ff, #7c3aed)",
            boxShadow: "0 4px 20px rgba(0, 229, 255, 0.2)",
            textDecoration: "none",
          }}
        >
          🔄 Reload Page
        </a>
      </div>
    );
  }

  if (!category) notFound();

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";

  // Generate dynamic Breadcrumb List schema server-side
  const catName = (category.name as any)[locale] || (category.name as any).en;
  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: locale === "ar" ? "الرئيسية" : "Home", url: "/" },
    { name: locale === "ar" ? "التصنيفات" : "Categories", url: "/categories" },
    { name: catName, url: `/categories/${category.slug}` },
  ]);

  return (
    <>
      <script
        id="jsonld-category-breadcrumbs"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <CategoryDetailClient category={JSON.parse(JSON.stringify(category))} />
    </>
  );
}
