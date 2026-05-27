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
  const { slug } = await params;

  const category = await db.category.findUnique({
    where: { slug },
  });

  if (!category) return { title: "Category Not Found" };

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";

  return generateCategoryMetadata(category as any, locale);
}

export default async function CategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await db.category.findUnique({
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
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <CategoryDetailClient category={JSON.parse(JSON.stringify(category))} />
    </>
  );
}
