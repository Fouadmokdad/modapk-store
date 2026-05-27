"use client";

// =============================================================================
// Homepage — Premium APK Platform with Advanced Discovery
// =============================================================================
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  AppCardGrid,
  AppCardFeatured,
  AppCardHorizontal,
  AppCardGridSkeleton,
  AppCardFeaturedSkeleton,
} from "@/components/app/AppCard";

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
  category: { name: { en: string; ar: string }; slug: string } | null;
  versions: { versionName: string; size?: string | null }[];
}

interface CategoryData {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  type: string;
  _count: { apps: number };
}

const categoryEmojis: Record<string, string> = {
  social: "💬", communication: "📱", photography: "📷", entertainment: "🎬",
  music: "🎵", productivity: "📊", tools: "🔧", education: "📚",
  "health-fitness": "💪", finance: "💰", shopping: "🛒", news: "📰",
  travel: "✈️", weather: "🌤", food: "🍕", action: "⚔️",
  adventure: "🗺", arcade: "🕹", racing: "🏎", puzzle: "🧩",
  strategy: "♟", simulation: "🎮", sports: "⚽", rpg: "🐉",
  casual: "🎲", board: "🎯",
};

export default function HomePage() {
  const { locale, t } = useLocale();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settings, setSettings] = useState<any>(null);

  // Discovery datasets
  const [trendingApps, setTrendingApps] = useState<AppData[]>([]);
  const [updatedApps, setUpdatedApps] = useState<AppData[]>([]);
  const [popularApps, setPopularApps] = useState<AppData[]>([]); // You May Also Like
  const [latestApps, setLatestApps] = useState<AppData[]>([]);
  const [appApps, setAppApps] = useState<AppData[]>([]); // Top apps by downloads
  const [gameApps, setGameApps] = useState<AppData[]>([]); // Top games by downloads

  const txt = (obj: { en: string; ar: string } | null) =>
    obj ? (locale === "ar" && obj.ar ? obj.ar : obj.en) : "";

  useEffect(() => {
    Promise.all([
      fetch("/api/apps?limit=8&sort=trending").then((r) => r.json()),
      fetch("/api/apps?limit=12&sort=updatedAt").then((r) => r.json()),
      fetch("/api/apps?limit=8&sort=rating").then((r) => r.json()), // You May Also Like fallback
      fetch("/api/apps?limit=12&sort=createdAt").then((r) => r.json()),
      fetch("/api/apps?limit=6&sort=downloadCount&type=APP").then((r) => r.json()),
      fetch("/api/apps?limit=6&sort=downloadCount&type=GAME").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ])
      .then(([trendingJson, updatedJson, popularJson, latestJson, appJson, gameJson, catsJson, settingsJson]) => {
        setTrendingApps(trendingJson.data || []);
        setUpdatedApps(updatedJson.data || []);
        setPopularApps(popularJson.data || []);
        setLatestApps(latestJson.data || []);
        setAppApps(appJson.data || []);
        setGameApps(gameJson.data || []);
        setCategories(catsJson.data || []);
        setSettings(settingsJson.data || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load discovery apps on home mount:", err);
        setLoading(false);
      });
  }, []);

  const featuredApps = trendingApps.slice(0, 6);
  const appCategories = categories.filter((c) => c.type === "APP");
  const gameCategories = categories.filter((c) => c.type === "GAME");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const getBadgeStyle = (type: string) => {
    const rel = type ?? "MOD";
    if (rel === "ORIGINAL") return "bg-blue-500/12 text-blue-400 border border-blue-500/20";
    if (rel === "BETA") return "bg-amber-500/12 text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"; // MOD default
  };

  const trustChips = locale === "ar" ? [
    { text: "تطبيقات موثوقة", icon: "✓", color: "text-emerald-400" },
    { text: "تحميل سريع", icon: "⚡", color: "text-blue-400" },
    { text: "روابط آمنة", icon: "🛡️", color: "text-purple-400" },
    { text: "تحديث يومي", icon: "🔄", color: "text-amber-400" },
  ] : [
    { text: "Verified APKs", icon: "✓", color: "text-emerald-400" },
    { text: "Fast Downloads", icon: "⚡", color: "text-blue-400" },
    { text: "Safe Links", icon: "🛡️", color: "text-purple-400" },
    { text: "Updated Daily", icon: "🔄", color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "hsl(var(--color-bg-primary))" }}>
      {/* Background blobs for premium layout depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[130px]" />
        <div className="absolute top-[20%] right-1/4 w-[600px] h-[600px] bg-purple-500/[0.02] rounded-full blur-[160px]" />
        <div className="absolute top-[50%] left-1/3 w-[600px] h-[600px] bg-blue-500/[0.02] rounded-full blur-[140px]" />
      </div>

      <Navbar />

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32 border-b border-white/[0.06] bg-gradient-to-b from-neutral-900/40 to-transparent">
        {/* Glow blobs inside hero */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full opacity-[0.08] blur-[120px] bg-gradient-to-r from-emerald-500 to-purple-500" />
        </div>

        <div className="container relative z-10 text-center">
          <div className="max-w-3xl mx-auto mb-8 sm:mb-10">
            {/* Trust Chips */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-6 sm:mb-8 text-[10px] sm:text-xs font-bold uppercase tracking-wider fade-in-up">
              {trustChips.map((chip, idx) => (
                <span key={idx} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-neutral-300 hover:border-white/20 hover:bg-white/[0.05] transition-all select-none">
                  <span className={chip.color}>{chip.icon}</span> {chip.text}
                </span>
              ))}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight sm:leading-none text-white fade-in-up" style={{ animationDelay: "100ms" }}>
              {t("home.heroTitle")}{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500">{t("home.heroHighlight")}</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-neutral-400 max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed fade-in-up" style={{ animationDelay: "200ms" }}>
              {t("home.heroSubtitle")}
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto w-full px-2 sm:px-0 fade-in-up" style={{ animationDelay: "300ms" }}>
              <div className="relative flex items-center bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-2 pl-4 pr-2 focus-within:border-emerald-500/40 focus-within:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-300 w-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-500 shrink-0 select-none">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search.placeholder")}
                  className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2 text-white placeholder-neutral-500 min-w-0"
                />
                <button type="submit" className="rounded-xl py-3 px-5 sm:px-6 font-bold text-sm bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white cursor-pointer active:scale-[0.98] transition-all shadow-md shrink-0">
                  {t("search.button")}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Category Chips */}
          <div className="flex justify-center gap-2 sm:gap-2.5 flex-wrap px-4 max-w-2xl mx-auto fade-in-up" style={{ animationDelay: "400ms" }}>
            <Link href="/apps" className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all">📱 {t("nav.apps")}</Link>
            <Link href="/games" className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all">🎮 {t("nav.games")}</Link>
            <Link href="/apps?sort=trending" className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all">🔥 {t("common.trending")}</Link>
            <Link href="/apps?sort=createdAt" className="px-4 py-2 rounded-full text-xs font-semibold bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all">✨ {t("common.latest")}</Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED APPS GRID
          ================================================================ */}
      {(settings?.homepageFeatured?.showTrending ?? true) && (loading || featuredApps.length > 0) && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>🌟</span>
                <span>{t("home.featured")}</span>
              </h2>
              <Link href="/apps?sort=trending" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {loading
                ? [...Array(6)].map((_, i) => <AppCardFeaturedSkeleton key={i} />)
                : featuredApps.map((app) => (
                    <AppCardFeatured
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
          </div>
        </section>
      )}

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          TRENDING THIS WEEK — Horizontal List
          ================================================================ */}
      {(settings?.homepageFeatured?.showTrending ?? true) && (loading || trendingApps.length > 0) && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>🔥</span>
                <span>{t("home.trending")}</span>
              </h2>
              <Link href="/apps?sort=trending" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
              {loading
                ? [...Array(6)].map((_, i) => <div key={i} className="skeleton h-[76px] rounded-2xl" />)
                : trendingApps.map((app, index) => (
                    <AppCardHorizontal
                      key={app.id}
                      slug={app.slug}
                      title={app.title}
                      iconUrl={app.iconUrl}
                      developer={app.developer}
                      rating={app.rating}
                      downloadCount={app.downloadCount}
                      versionName={app.versions[0]?.versionName}
                      size={app.versions[0]?.size}
                      releaseType={app.releaseType}
                      priority={index < 4}
                      rank={index + 1}
                    />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          RECENTLY UPDATED — Grid Layout
          ================================================================ */}
      {(settings?.homepageFeatured?.showLatest ?? true) && (loading || updatedApps.length > 0) && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>✨</span>
                <span>{t("home.recentlyUpdated")}</span>
              </h2>
              <Link href="/apps?sort=updatedAt" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 stagger">
              {loading
                ? [...Array(6)].map((_, i) => <AppCardGridSkeleton key={i} />)
                : updatedApps.slice(0, 12).map((app) => (
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
          </div>
        </section>
      )}

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          LATEST MOD APKs — Grid with Sidebar Discovery Widget
          ================================================================ */}
      {(settings?.homepageFeatured?.showLatest ?? true) && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Main Content Grid (8 Columns) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4 border-b border-white/[0.04] pb-3">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                    <span>⚡</span>
                    <span>{t("home.latestMods")}</span>
                  </h2>
                  <Link href="/apps?sort=createdAt" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                    <span>{t("common.viewAll")}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger">
                  {loading
                    ? [...Array(6)].map((_, i) => <AppCardGridSkeleton key={i} />)
                    : latestApps.map((app) => (
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
              </div>

              {/* Sidebar Widget (4 Columns for perfect screen coverage) */}
              <div className="lg:col-span-4 lg:sticky lg:top-24">
                <div className="card-glass p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />
                  
                  <h3 className="text-sm font-extrabold uppercase tracking-wider mb-5 text-emerald-400 flex items-center gap-2 border-b border-white/[0.04] pb-3">
                    <span>⚡</span> Discovery Widget
                  </h3>

                  <div className="space-y-6">
                    {/* Recently Added Section */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 border-b border-white/[0.04] pb-1.5 flex items-center justify-between">
                        <span>🆕 Recently Added</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                      </h4>
                      <div className="space-y-2.5">
                        {latestApps.slice(0, 3).map((app) => (
                          <Link key={app.id} href={`/apps/${app.slug}`} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 shrink-0 relative">
                              {app.iconUrl ? (
                                <img src={app.iconUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">📱</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                  {txt(app.title)}
                                </p>
                                <span className={`px-1.5 py-0.2 rounded text-[7px] font-extrabold uppercase tracking-wider shrink-0 ${getBadgeStyle(app.releaseType)}`}>
                                  {app.releaseType || "MOD"}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                {app.category ? txt(app.category.name) : "Utility"} • {app.versions[0] ? `v${app.versions[0].versionName}` : "Latest"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Recently Updated Section */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 border-b border-white/[0.04] pb-1.5 flex items-center justify-between">
                        <span>🔄 Recently Updated</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                      </h4>
                      <div className="space-y-2.5">
                        {updatedApps.slice(0, 3).map((app) => (
                          <Link key={app.id} href={`/apps/${app.slug}`} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 shrink-0 relative">
                              {app.iconUrl ? (
                                <img src={app.iconUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">📱</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                  {txt(app.title)}
                                </p>
                                <span className={`px-1.5 py-0.2 rounded text-[7px] font-extrabold uppercase tracking-wider shrink-0 ${getBadgeStyle(app.releaseType)}`}>
                                  {app.releaseType || "MOD"}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                {app.category ? txt(app.category.name) : "Utility"} • {app.versions[0] ? `v${app.versions[0].versionName}` : "Latest"}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Popular Downloads Section */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-3 border-b border-white/[0.04] pb-1.5 flex items-center justify-between">
                        <span>🔥 Popular Downloads</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      </h4>
                      <div className="space-y-2.5">
                        {trendingApps.slice(0, 3).map((app) => (
                          <Link key={app.id} href={`/apps/${app.slug}`} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-white/[0.04] border border-transparent hover:border-white/5 transition-all group">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-neutral-900 border border-white/5 shrink-0 relative">
                              {app.iconUrl ? (
                                <img src={app.iconUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">📱</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                  {txt(app.title)}
                                </p>
                                <span className={`px-1.5 py-0.2 rounded text-[7px] font-extrabold uppercase tracking-wider shrink-0 ${getBadgeStyle(app.releaseType)}`}>
                                  {app.releaseType || "MOD"}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-400 mt-0.5">
                                📥 {app.downloadCount.toLocaleString()} downloads
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          YOU MAY ALSO LIKE (Popular / High Rated) — Grid
          ================================================================ */}
      {(loading || popularApps.length > 0) && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>💡</span>
                <span>{t("home.youMayAlsoLike")}</span>
              </h2>
              <Link href="/apps?sort=rating" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 stagger">
              {loading
                ? [...Array(6)].map((_, i) => <AppCardGridSkeleton key={i} />)
                : popularApps.slice(0, 12).map((app) => (
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
          </div>
        </section>
      )}

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          TOP APPS + TOP GAMES — Side by side
          ================================================================ */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Apps */}
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>📱</span> {t("home.topApps")}
                </h2>
                <Link href="/apps" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <span>{t("common.viewAll")}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <div className="card-flat p-3 border border-white/10 bg-white/[0.02] rounded-3xl">
                {loading
                  ? [...Array(5)].map((_, i) => <div key={i} className="skeleton h-[76px] rounded-2xl mb-1.5" />)
                  : appApps.map((app, index) => (
                      <AppCardHorizontal
                        key={app.id}
                        slug={app.slug}
                        title={app.title}
                        iconUrl={app.iconUrl}
                        developer={app.developer}
                        rating={app.rating}
                        downloadCount={app.downloadCount}
                        versionName={app.versions[0]?.versionName}
                        releaseType={app.releaseType}
                        rank={index + 1}
                      />
                    ))}
              </div>
            </div>

            {/* Top Games */}
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-white/[0.04] pb-3">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>🎮</span> {t("home.topGames")}
                </h2>
                <Link href="/games" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                  <span>{t("common.viewAll")}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </div>
              <div className="card-flat p-3 border border-white/10 bg-white/[0.02] rounded-3xl">
                {loading
                  ? [...Array(5)].map((_, i) => <div key={i} className="skeleton h-[76px] rounded-2xl mb-1.5" />)
                  : gameApps.map((app, index) => (
                      <AppCardHorizontal
                        key={app.id}
                        slug={app.slug}
                        title={app.title}
                        iconUrl={app.iconUrl}
                        developer={app.developer}
                        rating={app.rating}
                        downloadCount={app.downloadCount}
                        versionName={app.versions[0]?.versionName}
                        releaseType={app.releaseType}
                        rank={index + 1}
                      />
                    ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          CATEGORIES GRID
          ================================================================ */}
      {(settings?.homepageFeatured?.showCategories ?? true) && (
        <section className="py-10 sm:py-14 lg:py-16">
          <div className="container">
            <div className="flex items-center justify-between mb-8 border-b border-white/[0.04] pb-3">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>📂</span> {t("home.categories")}
              </h2>
              <Link href="/categories" className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                <span>{t("common.viewAll")}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="rtl:rotate-180">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>

            {/* App categories */}
            {appCategories.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-neutral-400 flex items-center gap-2">
                  <span>📱</span> {t("nav.apps")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {appCategories.slice(0, 12).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-white/[0.06] hover:shadow-[0_8px_25px_rgba(16,185,129,0.06)] hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                      <span className="text-2xl shrink-0 select-none group-hover:scale-110 transition-transform duration-300">{categoryEmojis[cat.slug] || "📁"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-200">
                          {txt(cat.name)}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {cat._count.apps} {locale === "ar" ? "تطبيقات" : "Apps"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Game categories */}
            {gameCategories.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4 text-neutral-400 flex items-center gap-2">
                  <span>🎮</span> {t("nav.games")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {gameCategories.slice(0, 12).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/categories/${cat.slug}`}
                      className="flex items-center gap-3.5 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-emerald-500/30 hover:bg-white/[0.06] hover:shadow-[0_8px_25px_rgba(16,185,129,0.06)] hover:-translate-y-0.5 transition-all duration-300 group"
                    >
                      <span className="text-2xl shrink-0 select-none group-hover:scale-110 transition-transform duration-300">{categoryEmojis[cat.slug] || "🎮"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-emerald-400 transition-colors duration-200">
                          {txt(cat.name)}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {cat._count.apps} {locale === "ar" ? "ألعاب" : "Games"}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Premium Divider */}
      <div className="container"><div className="border-t border-white/[0.06] pointer-events-none" /></div>

      {/* ================================================================
          CTA Banner
          ================================================================ */}
      <section className="py-10 sm:py-14 lg:py-16">
        <div className="container">
          <div
            className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden border border-white/10 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-600/10 backdrop-blur-xl shadow-2xl"
          >
            {/* Ambient background glow inside CTA banner */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-purple-500/5" />
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-white">
                {t("home.ctaTitle")}
              </h2>
              <p className="text-sm sm:text-base mb-8 text-neutral-300 leading-relaxed">
                {locale === "ar" 
                  ? "اكتشف تطبيقات أندرويد الموثوقة، وإصدارات المعدلة (MOD)، ونسخ البيتا التجريبية، وروابط التحميل الخارجية الآمنة - المحدثة يومياً."
                  : "Explore verified Android apps, MOD releases, beta builds, and safe external download mirrors — updated daily."
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center items-center w-full sm:w-auto">
                <Link href="/apps" className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 transition-all w-full sm:w-auto">
                  📱 {t("home.browseApps")}
                </Link>
                <Link href="/games" className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl font-bold text-sm text-neutral-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all w-full sm:w-auto">
                  🎮 {t("home.browseGames")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
