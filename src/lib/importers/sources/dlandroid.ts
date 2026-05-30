// =============================================================================
// DLAndroid Importer Parser
// =============================================================================
import * as cheerio from "cheerio";
import { ImporterParser, ImportedAppData } from "../types";

export const DlandroidParser: ImporterParser = {
  canHandle(url: string): boolean {
    return url.includes("dlandroid.com");
  },

  async parse(html: string, url: string): Promise<Partial<ImportedAppData>> {
    const $ = cheerio.load(html);
    const warnings: string[] = [];

    // Title
    const titleText = $("h1, .entry-title").first().text().trim();
    const title = {
      en: titleText.replace(/\s*MOD\s*Apk.*/i, "").replace(/\s*Apk\s*Mod.*/i, "").trim(),
      ar: "",
    };
    if (!title.en) warnings.push("Title not resolved.");

    // Description
    const descText = $(".entry-content p, .post-content p").first().text().trim() || $(".description").text().trim();
    const description = {
      en: descText,
      ar: "",
    };

    // Icon
    const iconUrl = $(".app-icon img, .featured-image img, img.wp-post-image, .post-content img").first().attr("src") || null;

    // Screenshots
    const screenshots: string[] = [];
    $(".screenshot-gallery img, .entry-content img, .post-content img").each((_, elem) => {
      const src = $(elem).attr("src");
      if (src && src !== iconUrl && !src.includes("banner") && screenshots.length < 5) {
        screenshots.push(src);
      }
    });

    let versionName: string | null = null;
    let size: string | null = null;
    let minAndroid: string | null = null;
    let developer: string | null = null;
    let category: any = null;
    let packageName: string | null = null;
    let originalPlayStoreUrl: string | null = null;

    // Parse DLAndroid specific table
    $("tr").each((_, elem) => {
      const cells = $(elem).find("td, th");
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().toLowerCase();
        const value = $(cells[1]).text().trim();
        if (label.includes("name")) {
          // E.g., "365Scores Pro 14.7.0 Apk..." -> version name is 14.7.0
          const versionMatch = value.match(/(\d+\.\d+(\.\d+)?)/);
          if (versionMatch) {
            versionName = versionMatch[1];
          }
        } else if (label.includes("requires android") || label.includes("android")) {
          minAndroid = value;
        } else if (label.includes("developer")) {
          developer = value;
        } else if (label.includes("google play")) {
          packageName = value;
          const playLink = $(cells[1]).find("a").attr("href");
          if (playLink && playLink.includes("play.google.com")) {
            originalPlayStoreUrl = playLink;
          }
        } else if (label.includes("size")) {
          size = value;
        } else if (label.includes("category")) {
          category = value;
        }
      }
    });

    // Fallback: search version in title if not set
    if (!versionName) {
      const versionMatch = titleText.match(/(\d+\.\d+(\.\d+)?)/);
      if (versionMatch) {
        versionName = versionMatch[1];
      }
    }

    if (packageName && !originalPlayStoreUrl) {
      originalPlayStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
    }

    return {
      sourceName: "dlandroid.com",
      sourceUrl: url,
      title,
      description,
      iconUrl,
      screenshots,
      versionName: versionName || null,
      size: size || null,
      minAndroid: minAndroid || null,
      category: category || null,
      packageName: packageName || null,
      originalPlayStoreUrl: originalPlayStoreUrl || null,
      type: (category && (category as string).toLowerCase().includes("game")) ? "GAME" : "APP",
      developer: developer || null,
      modFeatures: [],
      warnings,
    };
  },
};
