"use client";

// =============================================================================
// App Card Components — Design System
// =============================================================================
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";

interface AppCardProps {
  slug: string;
  title: { en: string; ar: string };
  iconUrl: string | null;
  developer?: string | null;
  rating?: number | null;
  downloadCount?: number;
  type?: string;
  categoryName?: { en: string; ar: string } | null;
  versionName?: string | null;
  size?: string | null;
  releaseType?: string;
  priority?: boolean;
  rank?: number;
}

// =============================================================================
// Grid Card — Used in grids (homepage, category, search)
// =============================================================================
export function AppCardGrid({
  slug, title, iconUrl, developer, rating,
  downloadCount = 0, categoryName, versionName, releaseType,
  priority,
}: AppCardProps) {
  const { locale } = useLocale();
  const name = locale === "ar" && title.ar ? title.ar : title.en;
  const catName = categoryName ? (locale === "ar" && categoryName.ar ? categoryName.ar : categoryName.en) : null;

  const relType = releaseType ?? "MOD";

  // Badge dynamic style
  const getBadgeStyle = (type: string) => {
    if (type === "ORIGINAL") return "bg-blue-500/12 text-blue-400 border border-blue-500/20";
    if (type === "BETA") return "bg-amber-500/12 text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"; // MOD default
  };

  return (
    <Link href={`/apps/${slug}`} className="block relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-emerald-400/30 hover:shadow-[0_10px_30px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      <div className="p-4">
        <div className="flex items-center gap-3.5">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-neutral-900 border border-white/5 relative shadow-md">
            {iconUrl ? (
              <Image src={iconUrl} alt={name} width={64} height={64} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" unoptimized priority={priority} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-green-500/10 to-purple-500/10">📱</div>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors duration-200">
              {name}
            </h3>
            {developer ? (
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{developer}</p>
            ) : (
              <p className="text-[11px] text-neutral-500 mt-0.5">Verified Developer</p>
            )}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle(relType)}`}>
                {relType}
              </span>
              {catName && (
                <span className="text-[10px] text-neutral-400 truncate bg-white/5 px-2 py-0.5 rounded-md">
                  {catName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <div
        className="px-4 py-2.5 flex items-center justify-between gap-2 bg-white/[0.01]"
        style={{ borderTop: "1px solid hsl(var(--color-border) / 0.4)" }}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {rating != null && rating > 0 ? (
            <span className="text-[11px] font-bold flex items-center gap-0.5 text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
              ★ {rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/10">
              ✓ Safe
            </span>
          )}
          {downloadCount > 0 && (
            <span className="text-[10px] text-neutral-400 bg-neutral-800/40 px-2 py-0.5 rounded-lg border border-neutral-700/20">
              ⬇ {downloadCount >= 1000 ? `${(downloadCount / 1000).toFixed(0)}K` : downloadCount}
            </span>
          )}
        </div>
        
        {versionName && (
          <span className="text-[11px] text-neutral-400 font-semibold bg-neutral-800/40 px-2 py-0.5 rounded-lg border border-neutral-700/20">
            v{versionName}
          </span>
        )}
      </div>
    </Link>
  );
}

// =============================================================================
// Horizontal Card — Used in carousels + lists
// =============================================================================
export function AppCardHorizontal({
  slug, title, iconUrl, developer, rating,
  downloadCount = 0, versionName, size, releaseType,
  priority, rank,
}: AppCardProps) {
  const { locale } = useLocale();
  const name = locale === "ar" && title.ar ? title.ar : title.en;
  const relType = releaseType ?? "MOD";

  // Badge dynamic style
  const getBadgeStyle = (type: string) => {
    if (type === "ORIGINAL") return "bg-blue-500/12 text-blue-400 border border-blue-500/20";
    if (type === "BETA") return "bg-amber-500/12 text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"; // MOD default
  };

  return (
    <Link href={`/apps/${slug}`} className="flex items-center gap-3.5 p-3 rounded-2xl border border-transparent hover:border-white/10 hover:bg-white/[0.04] backdrop-blur-md transition-all duration-300 group">
      {/* Rank badge */}
      {rank !== undefined && (
        <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs select-none ${
          rank === 1 ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
          rank === 2 ? "bg-slate-300/15 text-slate-300 border border-slate-300/30" :
          rank === 3 ? "bg-amber-700/15 text-amber-600 border border-amber-700/30" :
          "bg-white/5 text-neutral-400 border border-white/5"
        }`}>
          {rank}
        </div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-neutral-900 border border-white/5 relative shadow-md">
        {iconUrl ? (
          <Image src={iconUrl} alt={name} width={56} height={56} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" unoptimized priority={priority} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-green-500/10 to-purple-500/10">📱</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-400 transition-colors duration-200">
            {name}
          </h3>
          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider ${getBadgeStyle(relType)}`}>
            {relType}
          </span>
        </div>
        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
          {developer || "Verified Developer"}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {rating != null && rating > 0 && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/5 px-1.5 py-0.2 rounded border border-amber-500/10">
              ★ {rating.toFixed(1)}
            </span>
          )}
          {size && (
            <span className="text-[10px] text-neutral-400 bg-neutral-800/40 px-1.5 py-0.2 rounded border border-neutral-700/20">{size}</span>
          )}
          <span className="text-[10px] text-neutral-400 bg-neutral-800/40 px-1.5 py-0.2 rounded border border-neutral-700/20">
            ⬇ {downloadCount >= 1000 ? `${(downloadCount / 1000).toFixed(0)}K` : downloadCount}
          </span>
        </div>
      </div>

      {/* Download arrow */}
      <div
        className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all bg-white/5 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 text-neutral-400 border border-white/5 group-hover:border-emerald-500/20"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </div>
    </Link>
  );
}

// =============================================================================
// Featured Card — Large hero card for featured apps
// =============================================================================
export function AppCardFeatured({
  slug, title, iconUrl, developer, rating,
  downloadCount = 0, categoryName, versionName, releaseType,
  priority,
}: AppCardProps) {
  const { locale, t } = useLocale();
  const name = locale === "ar" && title.ar ? title.ar : title.en;
  const relType = releaseType ?? "MOD";

  // Badge dynamic style
  const getBadgeStyle = (type: string) => {
    if (type === "ORIGINAL") return "bg-blue-500/12 text-blue-400 border border-blue-500/20";
    if (type === "BETA") return "bg-amber-500/12 text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20"; // MOD default
  };

  return (
    <Link
      href={`/apps/${slug}`}
      className="block w-full rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02] border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)] group"
    >
      {/* Header with gradient overlay */}
      <div
        className="relative h-28 flex items-end p-4"
        style={{
          background: `linear-gradient(135deg, hsl(142 71% 20% / 0.6), hsl(262 83% 25% / 0.6))`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute top-4 right-4">
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getBadgeStyle(relType)}`}>
            {relType}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 -mt-8 relative">
        {/* Icon floating */}
        <div
          className="w-16 h-16 rounded-2xl overflow-hidden mb-3.5 bg-neutral-900 border-4 border-neutral-950 relative shadow-lg"
        >
          {iconUrl ? (
            <Image src={iconUrl} alt={name} width={64} height={64} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300" unoptimized priority={priority ?? true} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl bg-gradient-to-br from-green-500/20 to-purple-500/20">📱</div>
          )}
        </div>

        <h3 className="text-base font-bold text-white line-clamp-1 mb-0.5 group-hover:text-emerald-400 transition-colors duration-200">
          {name}
        </h3>
        {developer && (
          <p className="text-xs mb-4 line-clamp-1 text-neutral-400">{developer}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {rating != null && rating > 0 && (
              <span className="text-xs font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/10">
                ★ {rating.toFixed(1)}
              </span>
            )}
            <span className="text-xs text-neutral-400 bg-neutral-800/40 px-2 py-0.5 rounded-lg border border-neutral-700/20">
              ⬇ {downloadCount >= 1000 ? `${(downloadCount / 1000).toFixed(0)}K` : downloadCount}
            </span>
          </div>
          <span
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-blue-500 shadow-md group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300"
          >
            {t("common.download")}
          </span>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Skeleton Variants
// =============================================================================
export function AppCardGridSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]" style={{ minHeight: 120 }}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-16 h-16 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2.5 min-w-0">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 flex items-center justify-between bg-white/[0.01]" style={{ borderTop: "1px solid hsl(var(--color-border) / 0.2)" }}>
        <div className="skeleton h-3.5 w-1/4 rounded" />
        <div className="skeleton h-3.5 w-1/5 rounded" />
      </div>
    </div>
  );
}

export function AppCardFeaturedSkeleton() {
  return (
    <div className="w-full rounded-3xl overflow-hidden border border-white/10 bg-white/[0.02]">
      <div className="skeleton h-28" />
      <div className="p-4 -mt-8 relative">
        <div className="skeleton w-16 h-16 rounded-2xl mb-3.5 border-4 border-neutral-950" />
        <div className="skeleton h-4 w-3/4 rounded mb-2" />
        <div className="skeleton h-3 w-1/2 rounded mb-4" />
        <div className="skeleton h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}
