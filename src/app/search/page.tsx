"use client";

// =============================================================================
// Search Page
// =============================================================================
import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const { t } = useLocale();

  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("downloadCount");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchInput, setSearchInput] = useState(query);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    params.set("sort", sort);
    params.set("order", "desc");
    params.set("limit", "30");
    if (typeFilter) params.set("type", typeFilter);

    try {
      const res = await fetch(`/api/apps?${params}`);
      const json = await res.json();
      setApps(json.data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  }, [query, sort, typeFilter]);

  useEffect(() => { fetchResults(); }, [fetchResults]);
  useEffect(() => { setSearchInput(query); }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      <div className="container py-8">
        {/* Search header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="search-bar max-w-2xl">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-text-tertiary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 bg-transparent border-none outline-none text-sm py-2"
                style={{ color: "hsl(var(--color-text-primary))" }}
              />
              <button type="submit" className="btn-primary py-2.5 px-5 text-sm rounded-xl">
                {t("search.button")}
              </button>
            </div>
          </form>

          {query && (
            <h1 className="text-xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
              {t("search.resultsFor", { query })}
            </h1>
          )}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Type filter */}
          <div className="flex gap-1">
            {[
              { value: "", label: t("common.all") },
              { value: "APP", label: t("common.apps") },
              { value: "GAME", label: t("common.games") },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`chip ${typeFilter === f.value ? "chip-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <CustomSelect
            value={sort}
            onChange={(val) => setSort(val)}
            options={[
              { value: "downloadCount", label: t("search.mostDownloaded") },
              { value: "createdAt", label: t("search.newest") },
              { value: "rating", label: t("search.topRated") },
            ]}
            className="w-48 shrink-0"
          />
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4">
            {[...Array(12)].map((_, i) => <AppCardGridSkeleton key={i} />)}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-20 card-glass p-8 max-w-md mx-auto rounded-2xl border" style={{ borderColor: "hsl(var(--color-border))" }}>
            <div className="text-5xl mb-4 animate-bounce">🔍</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
              {query ? t("search.noResults", { query }) : t("common.noResults")}
            </h2>
            <p className="text-xs mb-6 leading-relaxed" style={{ color: "hsl(var(--color-text-tertiary))" }}>
              {t("search.tryDifferent")}
            </p>
            <Link href="/categories" className="btn-primary py-2 px-5 text-xs rounded-xl inline-block">
              📂 {t("home.categories")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 stagger">
            {apps.map((app) => (
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
      </div>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
        <div className="container py-20">
          <div className="skeleton h-12 w-64 rounded-xl mb-6" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {[...Array(12)].map((_, i) => <AppCardGridSkeleton key={i} />)}
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
