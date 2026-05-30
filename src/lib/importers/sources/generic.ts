// =============================================================================
// Generic Importer Parser — Fallback SEO & Structured Data Scraper
// =============================================================================
import * as cheerio from "cheerio";
import { ImporterParser, ImportedAppData } from "../types";

export const GenericParser: ImporterParser = {
  canHandle(): boolean {
    return true; // Catch-all fallback
  },

  async parse(html: string, url: string): Promise<Partial<ImportedAppData>> {
    const $ = cheerio.load(html);
    const warnings: string[] = [];

    // 1. Try to extract metadata from JSON-LD first
    let jsonLdApp: Record<string, any> = {};
    $('script[type="application/ld+json"]').each((_, elem) => {
      try {
        const text = $(elem).text().trim();
        if (!text) return;
        const parsed = JSON.parse(text);
        
        // Handle direct objects or arrays of schemas
        const schemas = Array.isArray(parsed) ? parsed : [parsed];
        for (const schema of schemas) {
          if (schema["@type"] === "SoftwareApplication" || schema["@type"] === "MobileApplication" || schema["@type"] === "GameApplication") {
            jsonLdApp = schema;
            break;
          }
        }
      } catch {
        // Safe skip invalid JSON-LD
      }
    });

    // 2. Extract Title
    const titleEn = 
      jsonLdApp.name ||
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      $("title").text() ||
      $("h1").first().text();

    const title = {
      en: (titleEn || "").trim(),
      ar: "",
    };

    if (!title.en) {
      warnings.push("Title field could not be found.");
    }

    // 3. Extract Description
    const descEn = 
      jsonLdApp.description ||
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="twitter:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      $(".description").text() ||
      $("#description").text();

    const description = {
      en: (descEn || "").trim(),
      ar: "",
    };

    if (!description.en) {
      warnings.push("Description field could not be found.");
    }

    // 4. Extract Icon
    const iconUrl = 
      jsonLdApp.image ||
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      $('link[rel="apple-touch-icon"]').attr("href") ||
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") ||
      null;

    // 5. Screenshots (collect meta og:images or common article images)
    const screenshots: string[] = [];
    $('meta[property="og:image"]').each((_, elem) => {
      const src = $(elem).attr("content");
      if (src && src !== iconUrl) screenshots.push(src);
    });

    // 6. Technical details
    const versionName = 
      jsonLdApp.softwareVersion || 
      html.match(/version\s*[:\-\s]\s*([0-9a-zA-Z\.]+)/i)?.[1] || 
      null;
      
    const size = 
      jsonLdApp.fileSize || 
      html.match(/size\s*[:\-\s]\s*([0-9\.]+\s*(mb|gb|kb))/i)?.[1] || 
      null;
      
    const minAndroid = 
      jsonLdApp.operatingSystem || 
      html.match(/android\s*([0-9\.\+]+)/i)?.[0] || 
      null;

    const developer = 
      jsonLdApp.author?.name || 
      jsonLdApp.publisher?.name || 
      null;

    const developerUrl = 
      jsonLdApp.author?.url || 
      jsonLdApp.publisher?.url || 
      jsonLdApp.developer?.url || 
      null;

    const ratingVal = jsonLdApp.aggregateRating?.ratingValue;
    const rating = ratingVal ? Number(ratingVal) : null;

    const contentRating = jsonLdApp.contentRating || null;

    let installs = null;
    if (jsonLdApp.interactionStatistic) {
      const stats = Array.isArray(jsonLdApp.interactionStatistic)
        ? jsonLdApp.interactionStatistic
        : [jsonLdApp.interactionStatistic];
      for (const stat of stats) {
        if (stat.userInteractionCount) {
          installs = stat.userInteractionCount.toString();
          break;
        }
      }
    }

    // 7. Find original Google Play store URL references
    let originalPlayStoreUrl: string | null = null;
    $("a").each((_, elem) => {
      const href = $(elem).attr("href") || "";
      if (href.includes("play.google.com/store/apps/details")) {
        originalPlayStoreUrl = href;
      }
    });

    let packageName = jsonLdApp.packageName || null;
    if (!packageName && originalPlayStoreUrl) {
      try {
        const u = new URL(originalPlayStoreUrl);
        const id = u.searchParams.get("id");
        if (id) {
          packageName = id;
        }
      } catch {
        // safe skip
      }
    }

    // 8. Safely inspect for visible public download links
    const externalDownloadLinks: { label: string; url: string }[] = [];
    $("a").each((_, elem) => {
      const href = $(elem).attr("href") || "";
      const text = $(elem).text().trim().toLowerCase();
      if (
        (text.includes("download") || text.includes("apk") || text.includes("mirror")) &&
        /^https?:\/\//i.test(href) &&
        !href.includes("play.google.com") &&
        !href.includes(url)
      ) {
        externalDownloadLinks.push({
          label: $(elem).text().trim() || "Download Mirror",
          url: href,
        });
      }
    });

    return {
      sourceName: "Generic fallback parser",
      sourceUrl: url,
      title,
      packageName,
      shortDescription: { en: "", ar: "" },
      description,
      iconUrl,
      screenshots: screenshots.slice(0, 5),
      versionName,
      size,
      minAndroid,
      category: jsonLdApp.applicationCategory || null,
      type: jsonLdApp.applicationCategory?.toLowerCase().includes("game") ? "GAME" : "APP",
      developer,
      developerUrl,
      rating,
      contentRating,
      installs,
      originalPlayStoreUrl,
      externalDownloadLinks: externalDownloadLinks.slice(0, 2),
      warnings,
      modFeatures: [],
      rawExtractedData: {
        hasStructuredData: Object.keys(jsonLdApp).length > 0
      }
    };
  },
};
