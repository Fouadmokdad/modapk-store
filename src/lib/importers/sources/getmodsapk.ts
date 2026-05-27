// =============================================================================
// GetModsAPK Importer Parser
// =============================================================================
import * as cheerio from "cheerio";
import { ImporterParser, ImportedAppData } from "../types";

export const GetModsApkParser: ImporterParser = {
  canHandle(url: string): boolean {
    return url.includes("getmodsapk.com");
  },

  async parse(html: string, url: string): Promise<Partial<ImportedAppData>> {
    const $ = cheerio.load(html);
    const warnings: string[] = [];

    // Title
    const titleText = $("h1, .entry-title").first().text().trim();
    const title = {
      en: titleText.replace(/\s*MOD\s*APK.*/i, "").trim(),
      ar: "",
    };
    if (!title.en) warnings.push("Title not resolved.");

    // Description
    const descText = $(".entry-content p").first().text().trim() || $(".description").text().trim();
    const description = {
      en: descText,
      ar: "",
    };

    // Icon
    const iconUrl = $(".app-icon img, .featured-image img, img.wp-post-image").first().attr("src") || null;

    // Screenshots
    const screenshots: string[] = [];
    $(".screenshot-gallery img, .entry-content img").each((_, elem) => {
      const src = $(elem).attr("src");
      if (src && src !== iconUrl && !src.includes("banner") && screenshots.length < 5) {
        screenshots.push(src);
      }
    });

    // Technical specifications
    let versionName = "";
    let size = "";
    let minAndroid = "";
    let developer = "";
    let category = "";

    // Search specs
    $("tr, li, .spec-item").each((_, elem) => {
      const text = $(elem).text().toLowerCase();
      if (text.includes("version")) {
        versionName = $(elem).find("td, span").last().text().trim();
      } else if (text.includes("size")) {
        size = $(elem).find("td, span").last().text().trim();
      } else if (text.includes("android") || text.includes("requires")) {
        minAndroid = $(elem).find("td, span").last().text().trim();
      } else if (text.includes("developer") || text.includes("publisher")) {
        developer = $(elem).find("td, span").last().text().trim();
      } else if (text.includes("category") || text.includes("genre")) {
        category = $(elem).find("td, span").last().text().trim();
      }
    });

    // MOD Features
    const modFeatures: string[] = [];
    $(".mod-features li, .entry-content ul li").each((_, elem) => {
      const text = $(elem).text().trim();
      if (text && modFeatures.length < 5 && (text.toLowerCase().includes("unlocked") || text.toLowerCase().includes("mod") || text.toLowerCase().includes("unlimited"))) {
        modFeatures.push(text);
      }
    });

    return {
      sourceName: "getmodsapk.com",
      sourceUrl: url,
      title,
      description,
      iconUrl,
      screenshots,
      versionName: versionName || null,
      size: size || null,
      minAndroid: minAndroid || null,
      category: category || null,
      type: category.toLowerCase().includes("game") ? "GAME" : "APP",
      developer: developer || null,
      modFeatures,
      warnings,
    };
  },
};
