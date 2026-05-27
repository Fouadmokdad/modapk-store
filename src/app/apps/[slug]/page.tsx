// =============================================================================
// Public App Detail Page — Server Component
// =============================================================================
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { generateAppMetadata, generateAppJsonLd, generateBreadcrumbJsonLd } from "@/lib/seo";
import { getRelatedApps } from "@/lib/discovery";
import { cookies } from "next/headers";
import AppDetailClient from "./AppDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const app = await db.app.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: { category: true },
  });

  if (!app) return { title: "App Not Found" };

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";

  return generateAppMetadata(app as Parameters<typeof generateAppMetadata>[0], locale);
}

export default async function AppDetailPage({ params }: PageProps) {
  const { slug } = await params;

  const app = await db.app.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      category: true,
      tags: { include: { tag: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        include: {
          downloadLinks: { orderBy: { sortOrder: "asc" } },
          downloadMirrors: { orderBy: { priority: "desc" } },
        },
      },
      screenshots: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!app) notFound();

  // Increment view count (fire-and-forget)
  db.app.update({
    where: { id: app.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  // Fetch dynamic, scored related apps with robust caching fallback queues
  const tagIds = app.tags.map((t) => t.tagId);
  const relatedApps = await getRelatedApps(
    app.id,
    app.categoryId,
    app.type,
    tagIds,
    6
  );

  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";

  // Generate localized SoftwareApplication and Breadcrumb structured schemas server-side only
  const appJsonLd = generateAppJsonLd(app as any, locale);
  
  const categoryName = app.category 
    ? (app.category.name as any)[locale] || (app.category.name as any).en 
    : (app.type === "GAME" ? (locale === "ar" ? "ألعاب" : "Games") : (locale === "ar" ? "تطبيقات" : "Apps"));
  const categoryUrl = app.category ? `/categories/${app.category.slug}` : (app.type === "GAME" ? "/games" : "/apps");
  const appTitle = (app.title as any)[locale] || (app.title as any).en;

  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: locale === "ar" ? "الرئيسية" : "Home", url: "/" },
    { name: categoryName, url: categoryUrl },
    { name: appTitle, url: `/apps/${app.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <AppDetailClient
        app={JSON.parse(JSON.stringify(app))}
        relatedApps={JSON.parse(JSON.stringify(relatedApps))}
      />
    </>
  );
}

