// =============================================================================
// Google Play Store Scraper Wrapper
// =============================================================================
// Uses google-play-scraper to fetch public app metadata
// Maps Play Store data to our App schema format
// =============================================================================
import gplay from "google-play-scraper";

export interface PlayStoreAppData {
  packageName: string;
  title: string;
  summary: string;
  description: string;
  descriptionHTML: string;
  icon: string;
  headerImage: string | null;
  screenshots: string[];
  developer: string;
  developerUrl: string | null;
  playStoreUrl: string;
  genre: string;
  genreId: string;
  rating: number;
  contentRating: string;
  installs: string;
  version: string;
  androidVersion: string;
  size: string;
  updated: Date;
  released: string | null;
}

/**
 * Fetch app data from Google Play by package name
 */
export async function fetchAppFromPlayStore(
  packageName: string
): Promise<PlayStoreAppData> {
  try {
    const result = await gplay.app({
      appId: packageName,
      lang: "en",
      country: "us",
    });

    return {
      packageName: result.appId,
      title: result.title || "",
      summary: result.summary || "",
      description: result.description || "",
      descriptionHTML: result.descriptionHTML || "",
      icon: result.icon || "",
      headerImage: result.headerImage || null,
      screenshots: result.screenshots || [],
      developer: result.developer || "",
      developerUrl: result.developerWebsite || null,
      playStoreUrl: result.url || `https://play.google.com/store/apps/details?id=${packageName}`,
      genre: result.genre || "",
      genreId: result.genreId || "",
      rating: result.score || 0,
      contentRating: result.contentRating || "",
      installs: result.installs || "",
      version: result.version || "Varies",
      androidVersion: result.androidVersion || "5.0",
      size: result.size || "Varies",
      updated: new Date(result.updated || Date.now()),
      released: result.released || null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch app data";
    throw new Error(`Play Store fetch failed for "${packageName}": ${message}`);
  }
}

/**
 * Map Play Store data to our App create schema
 */
export function mapPlayStoreToAppDraft(data: PlayStoreAppData) {
  // Guess app type from genre
  const gameGenres = [
    "Action", "Adventure", "Arcade", "Board", "Card", "Casino", "Casual",
    "Educational", "Music", "Puzzle", "Racing", "Role Playing", "Simulation",
    "Sports", "Strategy", "Trivia", "Word",
  ];
  const isGame = gameGenres.some(
    (g) => data.genre.toLowerCase().includes(g.toLowerCase())
  );

  return {
    packageName: data.packageName,
    title: { en: data.title, ar: "" },
    shortDescription: { en: data.summary, ar: "" },
    description: { en: data.description, ar: "" },
    iconUrl: data.icon,
    headerImageUrl: data.headerImage,
    developer: data.developer,
    developerUrl: data.developerUrl,
    originalPlayStoreUrl: data.playStoreUrl,
    type: isGame ? ("GAME" as const) : ("APP" as const),
    rating: Math.round(data.rating * 10) / 10,
    contentRating: data.contentRating,
    installs: data.installs,
    status: "DRAFT" as const,

    // Version data (to create as AppVersion)
    _versionData: {
      versionName: data.version,
      size: data.size,
      minAndroid: data.androidVersion,
      isLatest: true,
      releasedAt: data.updated.toISOString(),
    },

    // Screenshots (to create as Screenshot[])
    _screenshotUrls: data.screenshots,

    // Category matching hint
    categoryName: data.genre,
    _genreHint: data.genre,
    _genreId: data.genreId,
  };
}
