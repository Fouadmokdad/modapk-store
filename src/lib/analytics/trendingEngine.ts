// =============================================================================
// Analytics Module — Trending Score Engine
// =============================================================================
import { db } from "../db";
import { App } from "@prisma/client";

export interface TrendingStats {
  trendingToday: App[];
  trendingThisWeek: App[];
  rising: App[];
}

/**
 * Calculates trending indexes based on download events and page views within historical boundaries.
 * Automatically recalibrates the isTrending flag on published apps.
 */
export async function calculateAndSyncTrendingScores(): Promise<TrendingStats> {
  const now = new Date();
  const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch PageView and Download counts grouped by appId
  const pageViews24h = await db.pageView.groupBy({
    by: ["appId"],
    _count: { id: true },
    where: { createdAt: { gte: past24h } },
  });

  const pageViewsWeek = await db.pageView.groupBy({
    by: ["appId"],
    _count: { id: true },
    where: { createdAt: { gte: pastWeek } },
  });

  const downloads24h = await db.downloadEvent.groupBy({
    by: ["appId"],
    _count: { id: true },
    where: { createdAt: { gte: past24h } },
  });

  const downloadsWeek = await db.downloadEvent.groupBy({
    by: ["appId"],
    _count: { id: true },
    where: { createdAt: { gte: pastWeek } },
  });

  // Load all published apps
  const apps = await db.app.findMany({
    where: { status: "PUBLISHED" },
    include: {
      downloadMirrors: { select: { health: true } },
    },
  });

  // Calculate scores for each app
  const scoredApps = apps.map(app => {
    const pv24 = pageViews24h.find(pv => pv.appId === app.id)?._count.id || 0;
    const pv7d = pageViewsWeek.find(pv => pv.appId === app.id)?._count.id || 0;
    const dl24 = downloads24h.find(dl => dl.appId === app.id)?._count.id || 0;
    const dl7d = downloadsWeek.find(dl => dl.appId === app.id)?._count.id || 0;

    // Check mirror health index
    const mirrors = app.downloadMirrors || [];
    const healthyCount = mirrors.filter(m => m.health === "HEALTHY").length;
    const hasDeadMirror = mirrors.some(m => m.health === "DEAD");
    
    // De-merit if mirrors are broken
    const healthMultiplier = hasDeadMirror ? 0.6 : healthyCount > 0 ? 1.1 : 1.0;

    // Freshness factor: newly published or updated apps receive weight boost
    const hoursSinceUpdate = (now.getTime() - app.updatedAt.getTime()) / (1000 * 60 * 60);
    const freshnessBoost = hoursSinceUpdate < 24 ? 30 : hoursSinceUpdate < 72 ? 15 : 0;

    // Score formulas
    const score24h = (pv24 * 1.5 + dl24 * 4 + freshnessBoost) * healthMultiplier;
    const scoreWeek = (pv7d * 1.0 + dl7d * 3 + freshnessBoost * 0.5) * healthMultiplier;

    // Rising score: velocity of growth in traffic comparing 24h to the rest of the week
    const avgTrafficBefore = (pv7d - pv24) / 6; // average per day for previous 6 days
    const velocity = pv24 - avgTrafficBefore;
    const risingScore = velocity * 2 + dl24 * 5;

    return {
      app,
      score24h,
      scoreWeek,
      risingScore,
    };
  });

  // Sort groups
  const sortedToday = [...scoredApps]
    .sort((a, b) => b.score24h - a.score24h)
    .map(x => x.app);

  const sortedWeek = [...scoredApps]
    .sort((a, b) => b.scoreWeek - a.scoreWeek)
    .map(x => x.app);

  const sortedRising = [...scoredApps]
    .sort((a, b) => b.risingScore - a.risingScore)
    .map(x => x.app);

  // Sync isTrending flag back to DB for top performers
  const topTrendingIds = sortedWeek.slice(0, 10).map(a => a.id);
  
  await db.app.updateMany({
    where: { id: { in: topTrendingIds } },
    data: { isTrending: true },
  });

  await db.app.updateMany({
    where: { id: { notIn: topTrendingIds } },
    data: { isTrending: false },
  });

  return {
    trendingToday: sortedToday.slice(0, 8),
    trendingThisWeek: sortedWeek.slice(0, 8),
    rising: sortedRising.slice(0, 8),
  };
}
export async function getTrendingStats(): Promise<TrendingStats> {
  const trendingToday = await db.app.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [
      { downloadCount: "desc" },
      { viewCount: "desc" },
    ],
    take: 8,
  });

  const trendingThisWeek = await db.app.findMany({
    where: { status: "PUBLISHED", isTrending: true },
    take: 8,
  });

  const rising = await db.app.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return { trendingToday, trendingThisWeek, rising };
}
