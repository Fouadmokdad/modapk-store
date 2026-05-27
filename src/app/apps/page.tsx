"use client";

// =============================================================================
// Public Apps Listing Page — Premium UI/UX
// =============================================================================
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
  _count: { apps: number };
}

export default function AppsPage() {
  const { locale, t } = useLocale();
  const txt = (obj: { en: string; ar: string } | null) =>
    obj ? (locale === "ar" && obj.ar ? obj.ar : obj.en) : "";

  const [apps, setApps] = useState<AppData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("downloadCount");
  const [categoryId, setCategoryId] = useState("");
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("type", "APP");
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
    fetch("/api/categories?type=APP")
      .then((r) => r.json())
      .then((json) => setCategories(json.data || []));
  }, []);

  // Real-time client-side query filtering
  const filteredApps = apps.filter((app) => {
    const titleText = txt(app.title).toLowerCase();
    const devText = (app.developer || "").toLowerCase();
    const query = filterQuery.toLowerCase();
    return titleText.includes(query) || devText.includes(query);
  });

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "hsl(var(--color-bg-primary))" }}>
      {/* Background blobs for depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.01] rounded-full blur-[130px]" />
        <div className="absolute top-[30%] right-1/4 w-[600px] h-[600px] bg-purple-500/[0.01] rounded-full blur-[160px]" />
      </div>

      <Navbar />

      <div className="container relative z-10 py-10 sm:py-14 lg:py-16">
        {/* Premium Header */}
        <div className="mb-8 border-b border-white/[0.06] pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>📱</span> {t("nav.apps")}
              </h1>
              <p className="text-sm mt-2 text-neutral-400 max-w-xl leading-relaxed">
                {locale === "ar"
                  ? "تصفح وحمل آلاف التطبيقات الموثوقة والمعدلة بأحدث الإصدارات وخطوات تحميل آمنة بالكامل."
                  : "Browse and download thousands of verified, MOD, and beta Android applications updated daily with secure direct links."
                }
              </p>
            </div>
            
            {/* Stats Chips */}
            <div className="flex flex-wrap gap-2.5 text-xs font-bold uppercase tracking-wider shrink-0 select-none">
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300">
                <span className="text-emerald-400">●</span> {loading ? "..." : apps.length} {t("common.apps")}
              </span>
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300">
                <span className="text-blue-400">✓</span> Verified Safe
              </span>
            </div>
          </div>
        </div>

        {/* Filter & Controller Bar */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8 border-b border-white/[0.06] pb-6">
          {/* Category Chips Scrollbar */}
          <div className="carousel no-scrollbar gap-2 w-full lg:w-auto pb-1 flex-1 overflow-x-auto">
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

          {/* Search & Sort Panel */}
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full lg:w-auto shrink-0">
            {/* Inner query search */}
            <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-full px-3 py-1.5 w-full sm:w-64 focus-within:border-emerald-500/30 transition-all duration-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-500 shrink-0">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder={locale === "ar" ? "تصفية النتائج..." : "Filter results..."}
                className="flex-1 bg-transparent border-none outline-none text-xs px-2 text-white placeholder-neutral-500 min-w-0"
              />
              {filterQuery && (
                <button onClick={() => setFilterQuery("")} className="text-xs text-neutral-500 hover:text-white shrink-0 cursor-pointer">✕</button>
              )}
            </div>

            {/* Sort selector */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              className="input py-2.5 px-4 text-xs font-semibold bg-white/[0.03] border border-white/10 rounded-full text-white cursor-pointer hover:bg-white/5 transition-all outline-none w-full sm:w-auto min-w-[150px]"
            >
              <option value="downloadCount">{t("search.mostDownloaded")}</option>
              <option value="createdAt">{t("search.newest")}</option>
              <option value="rating">{t("search.topRated")}</option>
            </select>
          </div>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(12)].map((_, i) => <AppCardGridSkeleton key={i} />)}
          </div>
        ) : filteredApps.length === 0 ? (
          /* Premium Empty State */
          <div className="text-center py-16 sm:py-20 card-glass p-8 max-w-md mx-auto rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden my-6">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />
            <div className="text-5xl mb-4 animate-pulse select-none">📱</div>
            <h2 className="text-lg font-bold mb-2 text-white">
              {t("common.noResults")}
            </h2>
            <p className="text-xs mb-6 leading-relaxed text-neutral-400">
              {locale === "ar"
                ? "لم نجد أي تطبيقات تطابق هذا التصنيف أو تصفية البحث. جرب تصنيفاً آخر أو ارجع للرئيسية."
                : "No apps found matching this category or filter. Try checking another category, resetting search filters, or return back home."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setCategoryId(""); setFilterQuery(""); setPage(1); }}
                className="btn-primary py-2.5 px-5 text-xs rounded-xl font-bold cursor-pointer transition-all w-full sm:w-auto"
              >
                🔄 Reset Filters
              </button>
              <Link
                href="/"
                className="btn-secondary py-2.5 px-5 text-xs rounded-xl font-bold transition-all border border-white/10 hover:bg-white/5 w-full sm:w-auto"
              >
                🏠 Back Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 stagger">
            {filteredApps.map((app) => (
              <AppCardGrid
                key={app.id}
                slug={app.slug}
                title={app.title}
                iconUrl={app.iconUrl}
                developer={app.developer}
                rating={app.rating}
                downloadCount={app.downloadCount}
                categoryName={app.category?.name}
                versionName={app.versions[0]?.versionName}
                releaseType={app.releaseType}
              />
            ))}
          </div>
        )}

        {/* Pagination spacing container */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 sm:mt-16">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary py-2.5 px-4 text-xs disabled:opacity-30 rounded-xl font-bold cursor-pointer"
            >
              {locale === "ar" ? "→" : "←"} {t("common.previous")}
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => {
              if (totalPages <= 7) return true;
              if (p === 1 || p === totalPages) return true;
              return Math.abs(p - page) <= 1;
            }).map((p, idx, arr) => {
              const prev = arr[idx - 1];
              return (
                <React.Fragment key={p}>
                  {prev && p - prev > 1 && (
                    <span className="px-2 text-xs select-none text-neutral-500">...</span>
                  )}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      page === p
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "btn-secondary border-transparent"
                    }`}
                  >
                    {p}
                  </button>
                </React.Fragment>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary py-2.5 px-4 text-xs disabled:opacity-30 rounded-xl font-bold cursor-pointer"
            >
              {t("common.next")} {locale === "ar" ? "←" : "→"}
            </button>
          </div>
        )}
      </div>

      {/* Footer spacer */}
      <div className="mt-16 sm:mt-20" />

      <Footer />
    </div>
  );
}
