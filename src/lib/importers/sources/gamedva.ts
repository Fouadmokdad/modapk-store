// =============================================================================
// GameDVA Importer Parser
// =============================================================================
import * as cheerio from "cheerio";
import { ImporterParser, ImportedAppData } from "../types";

export const GameDvaParser: ImporterParser = {
  canHandle(url: string): boolean {
    return url.includes("gamedva.com");
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
    let versionName = null;
    let size = null;
    let minAndroid = null;
    let developer = null;
    let category = null;

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
      sourceName: "gamedva.com",
      sourceUrl: url,
      title,
      description,
      iconUrl,
      screenshots,
      versionName,
      size,
      minAndroid,
      category: category || "Action", // GameDVA is gaming first
      type: "GAME",
      developer,
      modFeatures,
      warnings,
    };
  },
};
