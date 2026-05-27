import { MetadataRoute } from "next";
import { db } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://modapkstore.com";

  // Fetch all published apps to index their details page
  const apps = await db.app.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  // Fetch all categories to index category listing pages
  const categories = await db.category.findMany({
    select: { slug: true },
  });

  const staticUrls = [
    { url: `${siteUrl}/`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${siteUrl}/apps`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${siteUrl}/games`, lastModified: new Date(), changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${siteUrl}/categories`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${siteUrl}/search`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
  ];

  const appUrls = apps.map((app) => ({
    url: `${siteUrl}/apps/${app.slug}`,
    lastModified: app.updatedAt || new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const categoryUrls = categories.map((cat) => ({
    url: `${siteUrl}/categories/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticUrls, ...appUrls, ...categoryUrls];
}
