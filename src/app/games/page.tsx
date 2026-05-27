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
import { CategoryFilterSheet } from "@/components/ui/CategoryFilterSheet";

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
  category: { id: string; name: { en: string; ar: string } } | null;
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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

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

        {/* Category Selector: Desktop Horizontal Strip / Mobile Premium Bottom Sheet Trigger */}
        <div className="mb-6 w-full overflow-hidden">
          {/* Desktop View: Horizontal Chips strip with Gradient Fade Edges */}
          <div className="relative flex-1 w-full overflow-hidden hidden md:block">
            <div 
              className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none" 
              style={{ backgroundImage: "linear-gradient(to right, hsl(var(--color-bg-primary)), transparent)" }}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none" 
              style={{ backgroundImage: "linear-gradient(to left, hsl(var(--color-bg-primary)), transparent)" }}
            />
            <div className="carousel no-scrollbar gap-2 w-full pb-1 flex overflow-x-auto scroll-smooth">
              <button
                onClick={() => { setCategoryId(""); setPage(1); }}
                className={`chip rounded-full transition-all shrink-0 cursor-pointer ${categoryId === "" ? "chip-active" : "border-white/10"}`}
              >
                {t("common.all")}
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setCategoryId(cat.id); setPage(1); }}
                  className={`chip rounded-full transition-all shrink-0 cursor-pointer ${categoryId === cat.id ? "chip-active" : "border-white/10"}`}
                >
                  {txt(cat.name)} <span className="text-[10px] opacity-60">({cat._count.apps})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile View: Single Selected Active Pill + Browse Sheet Button */}
          <div className="flex md:hidden items-center justify-between w-full gap-3 select-none">
            {categoryId ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setCategoryId(""); setPage(1); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  <span>{txt(categories.find(c => c.id === categoryId)?.name || null)}</span>
                  <span className="text-[10px] opacity-60 ml-1">✕</span>
                </button>
                <button
                  onClick={() => { setCategoryId(""); setPage(1); }}
                  className="text-[10px] font-bold text-neutral-400 hover:text-white underline transition-colors cursor-pointer"
                >
                  Reset
                </button>
              </div>
            ) : (
              <span className="text-xs font-bold text-neutral-400">
                {locale === "ar" ? "التصنيف الحالي: الكل" : "Current: All Categories"}
              </span>
            )}
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>📂 {locale === "ar" ? "التصنيفات" : "Categories"}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-400 shrink-0">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
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

      {/* Category selector bottom sheet modal for mobile viewports */}
      <CategoryFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        categories={categories}
        selectedId={categoryId}
        onSelect={(id) => { setCategoryId(id); setPage(1); }}
        title={locale === "ar" ? "اختر التصنيف" : "Select Category"}
        searchPlaceholder={locale === "ar" ? "ابحث عن تصنيف..." : "Search categories..."}
        allLabel={t("common.all")}
        locale={locale}
      />

      <Footer />
    </div>
  );
}

