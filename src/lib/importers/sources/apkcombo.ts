// =============================================================================
// APKCombo Importer Parser
// =============================================================================
import * as cheerio from "cheerio";
import { ImporterParser, ImportedAppData } from "../types";

export const ApkComboParser: ImporterParser = {
  canHandle(url: string): boolean {
    return url.includes("apkcombo.com");
  },

  async parse(html: string, url: string): Promise<Partial<ImportedAppData>> {
    const $ = cheerio.load(html);
    const warnings: string[] = [];

    // Title
    const titleText = $(".title-like h1, h1, .title").first().text().trim();
    const title = {
      en: titleText.replace(/\s*MOD\s*APK.*/i, "").trim(),
      ar: "",
    };
    if (!title.en) warnings.push("Title not resolved.");

    // Description
    const descText = $(".description p, .entry-content p").first().text().trim();
    const description = {
      en: descText,
      ar: "",
    };

    // Icon
    const iconUrl = $(".icon img, .app-icon img").first().attr("src") || null;

    // Screenshots
    const screenshots: string[] = [];
    $(".screenshot-gallery img, .screenshot img").each((_, elem) => {
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
    $(".technical-info tr, tr, li").each((_, elem) => {
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

    return {
      sourceName: "apkcombo.com",
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
      modFeatures: [],
      warnings,
    };
  },
};
