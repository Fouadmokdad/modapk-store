"use client";

// =============================================================================
// Public Games Listing Page
// =============================================================================
import React, { useEffect, useState, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppCardGrid, AppCardGridSkeleton } from "@/components/app/AppCard";
import { CustomSelect } from "@/components/ui/CustomSelect";

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
  _count: { apps: number };
}

export default function GamesPage() {
  const { locale, t } = useLocale();
  const txt = (obj: { en: string; ar: string } | null) =>
    obj ? (locale === "ar" && obj.ar ? obj.ar : obj.en) : "";

  const [apps, setApps] = useState<AppData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("downloadCount");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", "GAME");
    params.set("status", "PUBLISHED");
    params.set("sort", sort);
    params.set("order", "desc");
    params.set("page", String(page));
    params.set("limit", "24");
    if (categoryId) params.set("categoryId", categoryId);

    try {
      const res = await fetch(`/api/apps?${params}`);
      const json = await res.json();
      setApps(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [sort, categoryId, page]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  useEffect(() => {
    fetch("/api/categories?type=GAME")
      .then((r) => r.json())
      .then((json) => setCategories(json.data || []));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      <div className="container py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
            🎮 {t("nav.games")}
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>
            {t("home.browseGames")}
          </p>
        </div>

        {/* Category chips */}
        <div className="carousel no-scrollbar mb-6">
          <button onClick={() => { setCategoryId(""); setPage(1); }}
            className={`chip ${categoryId === "" ? "chip-active" : ""}`}>
            {t("common.all")}
          </button>
          {categories.map((cat) => (
            <button key={cat.id}
              onClick={() => { setCategoryId(cat.id); setPage(1); }}
              className={`chip ${categoryId === cat.id ? "chip-active" : ""}`}>
              {txt(cat.name)} <span className="text-[10px] opacity-60">({cat._count.apps})</span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            {loading ? "..." : `${apps.length} ${t("common.games")}`}
          </p>
          <CustomSelect
            value={sort}
            onChange={(val) => { setSort(val); setPage(1); }}
            options={[
              { value: "downloadCount", label: t("search.mostDownloaded") },
              { value: "createdAt", label: t("search.newest") },
              { value: "rating", label: t("search.topRated") },
            ]}
            className="w-48 shrink-0"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => <AppCardGridSkeleton key={i} />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎮</p>
            <p className="text-lg font-semibold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
              {t("common.noResults")}
            </p>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary py-2 px-3.5 text-xs disabled:opacity-30 rounded-xl font-semibold">
              {locale === "ar" ? "→" : "←"} {t("common.previous")}
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => {
              if (totalPages <= 7) return true;
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - page) <= 1;
            }).map((p, idx, arr) => {
              const prev = arr[idx - 1];
              return (
                <React.Fragment key={p}>
                  {prev && p - prev > 1 && <span className="px-2 text-xs select-none" style={{ color: "hsl(var(--color-text-tertiary))" }}>...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all border ${page === p ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "btn-secondary border-transparent"}`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary py-2 px-3.5 text-xs disabled:opacity-30 rounded-xl font-semibold">
              {t("common.next")} {locale === "ar" ? "←" : "→"}
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
