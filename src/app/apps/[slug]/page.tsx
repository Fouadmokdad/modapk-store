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
  try {
    const { slug } = await params;

    const app = await db.app.findFirst({
      where: { slug, status: "PUBLISHED" },
      include: { category: true },
    });

    if (!app) return { title: "App Not Found" };

    const cookieStore = await cookies();
    const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";

    return generateAppMetadata(app as Parameters<typeof generateAppMetadata>[0], locale);
  } catch (error) {
    console.error("Database offline during metadata generation for app details page:", error);
    return { title: "App Store" };
  }
}

export default async function AppDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let app: any = null;
  let dbError = false;

  try {
    app = await db.app.findFirst({
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
  } catch (error) {
    console.error("Database offline during app details query:", error);
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

  if (!app) notFound();

  // Increment view count (fire-and-forget)
  try {
    db.app.update({
      where: { id: app.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});
  } catch (err) {}

  // Fetch dynamic, scored related apps with robust caching fallback queues
  let relatedApps: any[] = [];
  try {
    const tagIds = Array.isArray(app.tags) ? app.tags.map((t: any) => t.tagId) : [];
    relatedApps = await getRelatedApps(
      app.id,
      app.categoryId,
      app.type,
      tagIds,
      6
    );
  } catch (error) {
    console.error("Failed to fetch related apps defensively:", error);
  }

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
        id="jsonld-app"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />
      <script
        id="jsonld-breadcrumbs"
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

