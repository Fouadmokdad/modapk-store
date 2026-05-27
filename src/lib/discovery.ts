// =============================================================================
// Discovery System — Cached & Hardened Recommendation Logic
// =============================================================================
import { db } from "./db";
import { unstable_cache } from "next/cache";

interface AppDetailMinimal {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  iconUrl: string | null;
  developer: string | null;
  rating: number | null;
  downloadCount: number;
  viewCount: number;
  type: string;
  releaseType: string;
  category: { id: string; slug: string; name: { en: string; ar: string } } | null;
  versions: { versionName: string; size?: string | null }[];
}

/**
 * Performant deterministic LCG hash based on a seed string
 * Returns a stable float in [0, 1)
 */
function getStableRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  // Linear congruential generator parameters
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  const nextHash = (a * Math.abs(hash) + c) % m;
  return nextHash / m;
}

/**
 * Core query for fetching weighted trending apps.
 * Implements exponential decay on recent downloads, recent views, and conversion rates,
 * biasing recent activity heavily over all-time statistics.
 */
async function fetchWeightedTrendingAppsRaw(limit: number, type?: "APP" | "GAME") {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = Date.now();

  // 1. Fetch recent events with absolute minimal columns (indexed)
  const [recentDownloads, recentViews] = await Promise.all([
    db.downloadEvent.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        app: type ? { type, status: "PUBLISHED" } : { status: "PUBLISHED" },
      },
      select: { appId: true, createdAt: true },
    }),
    db.pageView.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        app: type ? { type, status: "PUBLISHED" } : { status: "PUBLISHED" },
      },
      select: { appId: true, createdAt: true },
    }),
  ]);

  // 2. Score with exponential recency decay (lambda = 0.35)
  const downloadScores: Record<string, number> = {};
  const viewScores: Record<string, number> = {};
  const activeAppIds = new Set<string>();

  for (const dl of recentDownloads) {
    const ageInDays = (now - dl.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const decay = Math.exp(-0.35 * ageInDays); // recent 24h weighs ~1.0, day 7 weighs ~0.08
    downloadScores[dl.appId] = (downloadScores[dl.appId] || 0) + decay;
    activeAppIds.add(dl.appId);
  }

  for (const pv of recentViews) {
    const ageInDays = (now - pv.createdAt.getTime()) / (24 * 60 * 60 * 1000);
    const decay = Math.exp(-0.35 * ageInDays);
    viewScores[pv.appId] = (viewScores[pv.appId] || 0) + decay;
    activeAppIds.add(pv.appId);
  }

  // 3. To handle low recent activity, add top 40 all-time apps as safety candidates
  const topAllTime = await db.app.findMany({
    where: {
      status: "PUBLISHED",
      ...(type ? { type } : {}),
    },
    select: { id: true },
    orderBy: { downloadCount: "desc" },
    take: 40,
  });

  for (const app of topAllTime) {
    activeAppIds.add(app.id);
  }

  // Cap pool to avoid excessive candidate sets
  const candidateIds = Array.from(activeAppIds).slice(0, 150);

  if (candidateIds.length === 0) return [];

  // 4. Fetch candidate details in one optimized batch query
  const apps = await db.app.findMany({
    where: {
      id: { in: candidateIds },
      status: "PUBLISHED",
    },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      versions: {
        where: { isLatest: true },
        take: 1,
        select: { versionName: true, size: true },
      },
    },
  });

  // 5. Calculate weighted score in memory
  // Score = (recentDownloads * 10) + (recentViews * 1) + (conversionRate * 100) + (allTimeDownloads * 0.05)
  const scoredApps = apps.map((app) => {
    const recentDL = downloadScores[app.id] || 0;
    const recentPV = viewScores[app.id] || 0;
    const convRate = recentPV > 0 ? recentDL / recentPV : 0;

    const score =
      recentDL * 10.0 +
      recentPV * 1.0 +
      convRate * 100.0 +
      app.downloadCount * 0.05 +
      app.viewCount * 0.005;

    return { app, score };
  });

  scoredApps.sort((a, b) => b.score - a.score);

  return scoredApps.map((s) => ({
    id: s.app.id,
    slug: s.app.slug,
    title: s.app.title as any,
    iconUrl: s.app.iconUrl,
    developer: s.app.developer,
    rating: s.app.rating,
    downloadCount: s.app.downloadCount,
    viewCount: s.app.viewCount,
    type: s.app.type,
    releaseType: s.app.releaseType,
    category: s.app.category ? {
      id: s.app.category.id,
      slug: s.app.category.slug,
      name: s.app.category.name as any,
    } : null,
    versions: s.app.versions.map(v => ({
      versionName: v.versionName,
      size: v.size,
    })),
  }));
}

/**
 * Cached Wrapper for Trending Apps (revalidated every 5 minutes)
 */
export const getWeightedTrendingApps = unstable_cache(
  async (limit: number, type?: "APP" | "GAME") => {
    const list = await fetchWeightedTrendingAppsRaw(limit, type);
    return list.slice(0, limit);
  },
  ["trending-apps-cache"],
  { revalidate: 300, tags: ["trending-apps"] }
);

/**
 * Unified Related Apps Algorithm featuring same-category priority, shared tag mapping,
 * deterministic stable randomization, developer diversity constraints, and robust fallback chains.
 */
async function fetchRelatedAppsRaw(
  appId: string,
  categoryId: string | null,
  type: string,
  tagIds: string[],
  limit: number
) {
  // Query 1: Retrieve candidate published apps
  const candidates = await db.app.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: appId },
    },
    take: 100, // Safe intelligently capped pool size
    orderBy: { downloadCount: "desc" },
    include: {
      category: { select: { id: true, slug: true, name: true } },
      tags: { select: { tagId: true } },
      versions: {
        where: { isLatest: true },
        take: 1,
        select: { versionName: true, size: true },
      },
    },
  });

  // Deterministic seed based on appId and stable hour string to ensure hydration consistency
  const stableHourSeed = appId + Math.floor(Date.now() / (3600 * 1000)).toString();

  // Score each candidate
  const scored = candidates.map((item) => {
    let score = 0;

    // Priority 1: Same category
    if (categoryId && item.categoryId === categoryId) {
      score += 100;
    }

    // Priority 2: Shared tags
    const sharedTags = item.tags.filter((t) => tagIds.includes(t.tagId)).length;
    score += sharedTags * 10;

    // Priority 3: Similar type (APP/GAME)
    if (item.type === type) {
      score += 1;
    }

    // Priority 4: Stable Seeded Randomization to avoid raw Math.random() & allow caching
    const randomFactor = getStableRandom(stableHourSeed + item.id) * 2.0;
    score += randomFactor;

    return { item, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Apply Developer Diversity Limit (max 2 apps from same developer)
  const results: typeof candidates = [];
  const developerCounts: Record<string, number> = {};

  for (const s of scored) {
    if (results.length >= limit) break;

    const dev = s.item.developer;
    if (dev) {
      const currentCount = developerCounts[dev] || 0;
      if (currentCount >= 2) {
        continue; // Skip to ensure variety
      }
      developerCounts[dev] = currentCount + 1;
    }

    results.push(s.item);
  }

  // --- FALLBACK CHAINS ---
  const existingIds = new Set([appId, ...results.map((r) => r.id)]);

  // Fallback 1: Trending Apps (excluding duplicates)
  if (results.length < limit) {
    const trending = await fetchWeightedTrendingAppsRaw(limit * 2, type as "APP" | "GAME");
    for (const trendApp of trending) {
      if (results.length >= limit) break;
      if (!existingIds.has(trendApp.id)) {
        // Fetch full candidate structure for trending app
        const fullTrend = candidates.find((c) => c.id === trendApp.id);
        if (fullTrend) {
          results.push(fullTrend);
          existingIds.add(trendApp.id);
        }
      }
    }
  }

  // Fallback 2: Latest Apps (excluding duplicates)
  if (results.length < limit) {
    const needed = limit - results.length;
    const latestFallback = await db.app.findMany({
      where: {
        status: "PUBLISHED",
        id: { notIn: Array.from(existingIds) },
        type: type as any,
      },
      take: needed,
      orderBy: { createdAt: "desc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        tags: { select: { tagId: true } },
        versions: {
          where: { isLatest: true },
          take: 1,
          select: { versionName: true, size: true },
        },
      },
    });

    for (const item of latestFallback) {
      results.push(item);
    }
  }

  // Map to clean structure
  return results.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title as any,
    iconUrl: r.iconUrl,
    developer: r.developer,
    rating: r.rating,
    downloadCount: r.downloadCount,
    viewCount: r.viewCount,
    type: r.type,
    releaseType: r.releaseType,
    category: r.category ? {
      id: r.category.id,
      slug: r.category.slug,
      name: r.category.name as any,
    } : null,
    versions: r.versions.map(v => ({
      versionName: v.versionName,
      size: v.size,
    })),
  }));
}

/**
 * Cached Wrapper for Related Apps (revalidated every 5 minutes)
 */
export const getRelatedApps = unstable_cache(
  async (appId: string, categoryId: string | null, type: string, tagIds: string[], limit: number) => {
    return fetchRelatedAppsRaw(appId, categoryId, type, tagIds, limit);
  },
  ["related-apps-cache"],
  { revalidate: 300, tags: ["related-apps"] }
);

/**
 * Standard cached query for discovery lists to prevent multiple heavy database loads
 */
export const getDiscoveryList = unstable_cache(
  async (sort: "updatedAt" | "createdAt" | "rating" | "downloadCount", limit: number, type?: "APP" | "GAME") => {
    const apps = await db.app.findMany({
      where: {
        status: "PUBLISHED",
        ...(type ? { type } : {}),
      },
      take: limit,
      orderBy: { [sort]: "desc" },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        versions: {
          where: { isLatest: true },
          take: 1,
          select: { versionName: true, size: true },
        },
      },
    });

    return apps.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title as any,
      iconUrl: r.iconUrl,
      developer: r.developer,
      rating: r.rating,
      downloadCount: r.downloadCount,
      viewCount: r.viewCount,
      type: r.type,
      releaseType: r.releaseType,
      category: r.category ? {
        id: r.category.id,
        slug: r.category.slug,
        name: r.category.name as any,
      } : null,
      versions: r.versions.map(v => ({
        versionName: v.versionName,
        size: v.size,
      })),
    }));
  },
  ["discovery-lists-cache"],
  { revalidate: 300, tags: ["discovery-lists"] }
);
