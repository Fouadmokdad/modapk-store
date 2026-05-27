// =============================================================================
// Recommendation Engine — Similar & Trending Apps Matches
// =============================================================================
import { db } from "../db";
import { App, AppType } from "@prisma/client";

export interface RecommendationResults {
  similar: App[];
  trending: App[];
}

/**
 * Computes recommendations for similar apps, games, and alternatives.
 * Scores matches using category taxonomy, matching developers, tags, ratings, and analytics.
 */
export async function getRecommendations(appId: string, limit = 6): Promise<RecommendationResults> {
  const currentApp = await db.app.findUnique({
    where: { id: appId },
    include: {
      tags: { select: { tagId: true } },
    },
  });

  if (!currentApp) {
    // Return general popular/featured apps if current app is missing
    const genericApps = await db.app.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { isTrending: "desc" },
        { downloadCount: "desc" },
      ],
      take: limit,
    });
    return { similar: genericApps, trending: genericApps };
  }

  // Fetch candidate apps in the system
  const candidates = await db.app.findMany({
    where: {
      id: { not: appId },
      status: "PUBLISHED",
    },
    include: {
      tags: { select: { tagId: true } },
    },
  });

  const scoredCandidates = candidates.map(candidate => {
    let score = 0;

    // 1. Category taxonomy match (High Priority)
    if (candidate.categoryId && candidate.categoryId === currentApp.categoryId) {
      score += 50;
    }

    // 2. Type matching (App Type vs Game Type)
    if (candidate.type === currentApp.type) {
      score += 25;
    }

    // 3. Same developer match
    if (candidate.developer && currentApp.developer && candidate.developer.toLowerCase().trim() === currentApp.developer.toLowerCase().trim()) {
      score += 30;
    }

    // 4. Tag matches
    const currentTags = currentApp.tags.map(t => t.tagId);
    const candidateTags = candidate.tags.map(t => t.tagId);
    const sharedTagsCount = candidateTags.filter(t => currentTags.includes(t)).length;
    score += sharedTagsCount * 12;

    // 5. Rating weight
    if (candidate.rating) {
      score += candidate.rating * 3;
    }

    // 6. Trending weights
    if (candidate.isTrending) {
      score += 15;
    }

    return {
      app: candidate,
      score,
    };
  });

  // Sort candidates by highest score
  const sortedSimilar = [...scoredCandidates]
    .sort((a, b) => b.score - a.score)
    .map(x => x.app)
    .slice(0, limit);

  // Trending Alternatives (same AppType, sorted by download count/trending flags)
  const trendingAlternatives = await db.app.findMany({
    where: {
      id: { not: appId },
      status: "PUBLISHED",
      type: currentApp.type,
    },
    orderBy: [
      { isTrending: "desc" },
      { downloadCount: "desc" },
      { viewCount: "desc" },
    ],
    take: limit,
  });

  return {
    similar: sortedSimilar,
    trending: trendingAlternatives,
  };
}
