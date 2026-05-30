// =============================================================================
// Google Play Store Scraper Wrapper
// =============================================================================
// Uses google-play-scraper to fetch public app metadata
// Maps Play Store data to our App schema format
// =============================================================================
import gplay from "google-play-scraper";
import * as cheerio from "cheerio";
import { fetchSafeHtml } from "./importers/security";
import { hybridFetchHtml } from "./importers/hybridExtractor";

function cleanTitleForSearch(title: string): string {
  let clean = title.split(/[-:|]/)[0].trim();
  clean = clean.replace(/[^a-zA-Z0-9\s]/g, "");
  const words = clean.split(/\s+/);
  if (words.length > 3) {
    clean = words.slice(0, 3).join(" ");
  }
  return clean.trim();
}

function isTitleMatch(titleA: string, titleB: string): boolean {
  const normA = titleA.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normB = titleB.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!normA || !normB) return false;
  return normA.includes(normB) || normB.includes(normA);
}

function formatSize(sizeStr: string): string {
  const cleaned = sizeStr.trim();
  const numPart = cleaned.match(/^[0-9\.]+/)?.[0] || "";
  const unitPart = cleaned.replace(numPart, "").trim().toLowerCase();
  
  if (unitPart === "m" || unitPart === "mb") {
    return `${numPart} MB`;
  }
  if (unitPart === "g" || unitPart === "gb") {
    return `${numPart} GB`;
  }
  if (unitPart === "k" || unitPart === "kb") {
    return `${numPart} KB`;
  }
  return cleaned;
}

async function fallbackSizeFromThirdParty(packageName: string, appTitle?: string): Promise<string | null> {
  // 1. Try APKPure details page (original size)
  try {
    const url = `https://apkpure.com/store/apps/details?id=${packageName}`;
    console.log(`[SizeFallback] Fetching APKPure direct page: ${url}`);
    const { html } = await hybridFetchHtml(url);
    const $ = cheerio.load(html);
    let size: string | null = null;

    $("a strong, .text.one-line, .ny-down .size, .fast-download-box .size").each((_, elem) => {
      const text = $(elem).text().trim();
      if (text.includes("Download APK") || text.includes("Download XAPK")) {
        const match = text.match(/([0-9\.]+\s*(mb|gb|kb))/i);
        if (match) {
          size = formatSize(match[1]);
          return false; // break each
        }
      }
    });

    if (!size) {
      $(".technical-info tr, tr, li, div").each((_, elem) => {
        const text = $(elem).text().trim().toLowerCase();
        if (text.includes("size") || text.includes("file size")) {
          const innerText = $(elem).text().trim();
          const match = innerText.match(/([0-9\.]+\s*(mb|gb|kb))/i);
          if (match) {
            size = formatSize(match[1]);
            return false; // break each
          }
        }
      });
    }

    if (size) {
      console.log(`[SizeFallback] Successfully parsed size from APKPure: ${size}`);
      return size;
    }
  } catch (e: any) {
    console.warn("[SizeFallback] APKPure fallback failed:", e.message || e);
  }

  // 2. Try APKCombo details page (original size)
  try {
    const url = `https://apkcombo.com/store/apps/details?id=${packageName}`;
    console.log(`[SizeFallback] Fetching APKCombo direct page: ${url}`);
    const { html } = await hybridFetchHtml(url);
    const $ = cheerio.load(html);
    let size: string | null = null;

    $(".technical-info tr, tr, li, td").each((_, elem) => {
      const text = $(elem).text().toLowerCase();
      if (text.includes("size") || text.includes("file size")) {
        const innerText = $(elem).text().trim();
        const match = innerText.match(/([0-9\.]+\s*(mb|gb|kb))/i);
        if (match) {
          size = formatSize(match[1]);
          return false; // break each
        }
      }
    });

    if (size) {
      console.log(`[SizeFallback] Successfully parsed size from APKCombo: ${size}`);
      return size;
    }
  } catch (e: any) {
    console.warn("[SizeFallback] APKCombo fallback failed:", e.message || e);
  }

  // 3. Fallback to LiteAPKs & GetModsAPK search queries (mods / secondary source)
  const searchQueries: string[] = [];
  if (appTitle) {
    searchQueries.push(cleanTitleForSearch(appTitle));
    searchQueries.push(appTitle);
  }
  const lastPart = packageName.split(".").pop();
  if (lastPart) {
    searchQueries.push(lastPart);
  }

  console.log(`[SizeFallback] Falling back to search queries:`, searchQueries);

  // LiteAPKs Search
  for (const query of searchQueries) {
    try {
      const url = `https://liteapks.com/?s=${encodeURIComponent(query)}`;
      const { html } = await hybridFetchHtml(url);
      const $ = cheerio.load(html);
      let sizeResult: string | null = null;
      
      $("article, a").each((_, elem) => {
        const cardTitle = $(elem).find("h2").text().trim();
        if (cardTitle && (!appTitle || isTitleMatch(cardTitle, appTitle))) {
          $(elem).find("span").each((_, spanElem) => {
            const text = $(spanElem).text().trim();
            const match = text.match(/^([0-9\.]+\s*(m|mb|gb|kb|g|k))$/i);
            if (match) {
              sizeResult = formatSize(match[1]);
              return false; // break inner
            }
          });
          if (sizeResult) return false; // break outer
        }
      });

      if (sizeResult) {
        console.log(`[SizeFallback] Successfully parsed size from LiteAPKs search: ${sizeResult}`);
        return sizeResult;
      }
    } catch (e: any) {
      console.warn(`[SizeFallback] LiteAPKs search fallback failed for query "${query}":`, e.message || e);
    }
  }

  // GetModsAPK Search
  for (const query of searchQueries) {
    try {
      const url = `https://getmodsapk.com/?s=${encodeURIComponent(query)}`;
      const { html } = await hybridFetchHtml(url);
      const $ = cheerio.load(html);
      let sizeResult: string | null = null;

      $("a").each((_, elem) => {
        const text = $(elem).text().replace(/\s+/g, ' ');
        if (text.toLowerCase().includes("size:") && (text.toLowerCase().includes(query.toLowerCase()) || (appTitle && isTitleMatch(text, appTitle)))) {
          const match = text.match(/size:\s*([0-9\.]+\s*(mb|gb|kb))/i);
          if (match) {
            sizeResult = formatSize(match[1]);
            return false; // break each
          }
        }
      });

      if (sizeResult) {
        console.log(`[SizeFallback] Successfully parsed size from GetModsAPK search: ${sizeResult}`);
        return sizeResult;
      }
    } catch (e: any) {
      console.warn(`[SizeFallback] GetModsAPK search fallback failed for query "${query}":`, e.message || e);
    }
  }

  return null;
}

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

    let size = result.size || "Varies";
    if (!size || size.toLowerCase().includes("varies")) {
      const fallbackSize = await fallbackSizeFromThirdParty(packageName, result.title);
      if (fallbackSize) {
        size = fallbackSize;
      }
    }

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
      size: size,
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
