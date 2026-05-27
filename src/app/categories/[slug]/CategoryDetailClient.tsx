"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppCardGrid, AppCardGridSkeleton } from "@/components/app/AppCard";

interface AppData {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  iconUrl: string | null;
  developer: string | null;
  rating: number | null;
  downloadCount: number;
  type: string;
  releaseType: string;
  category: { name: { en: string; ar: string } } | null;
  versions: { versionName: string }[];
}

interface CategoryData {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string } | null;
  type: string;
  _count: { apps: number };
}

export default function CategoryDetailClient({ category }: { category: CategoryData }) {
  const { locale, t } = useLocale();
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("downloadCount");

  const txt = (obj: { en: string; ar: string } | null | undefined) =>
    obj ? (locale === "ar" && obj.ar ? obj.ar : obj.en) : "";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("categoryId", category.id);
      params.set("status", "PUBLISHED");
      params.set("sort", sort);
      params.set("order", "desc");
      params.set("limit", "30");

      const appsRes = await fetch(`/api/apps?${params}`);
      const appsJson = await appsRes.json();
      setApps(appsJson.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category.id, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-6" style={{ color: "hsl(var(--color-text-tertiary))" }}>
          <Link href="/" className="hover:underline">{t("common.home")}</Link>
          <span>/</span>
          <Link href="/categories" className="hover:underline">{t("common.categories")}</Link>
          <span>/</span>
          <span style={{ color: "hsl(var(--color-text-primary))" }}>{txt(category.name)}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
            {txt(category.name)}
          </h1>
          {category.description && txt(category.description) && (
            <p className="text-sm mb-2" style={{ color: "hsl(var(--color-text-secondary))" }}>
              {txt(category.description)}
            </p>
          )}
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            {category._count.apps} {category.type === "APP" ? t("common.apps") : t("common.games")}
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center justify-end mb-6">
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="input py-2 px-3 text-xs w-auto rounded-full" style={{ maxWidth: 180 }}>
            <option value="downloadCount">{t("search.mostDownloaded")}</option>
            <option value="createdAt">{t("search.newest")}</option>
            <option value="rating">{t("search.topRated")}</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => <AppCardGridSkeleton key={i} />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📂</p>
            <p className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
              {t("common.noResults")}
            </p>
            <Link href="/categories" className="btn-secondary mt-4 inline-flex">
              ← {t("common.categories")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 stagger">
            {apps.map((app) => (
              <AppCardGrid key={app.id} slug={app.slug} title={app.title} iconUrl={app.iconUrl}
                developer={app.developer} rating={app.rating} downloadCount={app.downloadCount}
                categoryName={app.category?.name} versionName={app.versions[0]?.versionName}
                releaseType={app.releaseType} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
