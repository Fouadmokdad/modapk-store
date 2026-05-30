// =============================================================================
// Telegram Post Templates — Formatter & HTML Generator (Dynamic Settings)
// =============================================================================
import { formatNumber } from "../utils";

export interface TelegramPostData {
  appName: string;
  appTitleEn: string;
  appTitleAr?: string;
  slug: string;
  categoryNameEn?: string;
  tags?: string[];
  releaseType?: string;
  modFeatures?: string[];
  versionName?: string;
  apkSize?: string;
  androidRequirement?: string;
  changelogEn?: string;
  changelogAr?: string;
  developer?: string;
  downloadCount?: number;
  publishedAt?: string | Date;
}

export interface TelegramTemplateSettings {
  enabled: boolean;
  template: string;
  downloadButtonText: string;
  websiteButtonText: string;
  showTitle: boolean;
  showVersion: boolean;
  showSize: boolean;
  showAndroid: boolean;
  showCategory: boolean;
  showDate: boolean;
  showModFeatures: boolean;
  showChangelog: boolean;
  showHashtags: boolean;
  showFooter: boolean;
  titleStyle: string; // normal, uppercase, bold, premium
  dateFormat: string; // long, short, relative, hidden
  footerText: string | null;
  hashtagsTemplate: string | null;
  categoryEmojis: any; // Record<string, string> JSON
  parseMode: string;
}

export const DEFAULT_TEMPLATE = `<b>🔥 {title}</b>

✨ Premium Features:
{modFeatures}

📱 Version: {version}
📦 Size: {size}
🤖 Android: {android}
📂 Category: {category}
📅 Updated: {date}

{hashtags}

{footer}`;

export const DEFAULT_TEMPLATE_SETTINGS: TelegramTemplateSettings = {
  enabled: true,
  template: DEFAULT_TEMPLATE,
  downloadButtonText: "⬇️ DOWNLOAD MOD",
  websiteButtonText: "🌐 VISIT PAGE",
  showTitle: true,
  showVersion: true,
  showSize: true,
  showAndroid: true,
  showCategory: true,
  showDate: true,
  showModFeatures: true,
  showChangelog: false,
  showHashtags: true,
  showFooter: true,
  titleStyle: "premium",
  dateFormat: "long",
  footerText: "🚀 Join our channel for more premium MODs!",
  hashtagsTemplate: "#{title} #{category} #Premium #MODAPK",
  categoryEmojis: {
    "Music": "🎵",
    "Social": "📸",
    "Games": "🎮",
    "Streaming": "🎬",
    "Tools": "🔧",
    "Productivity": "💼",
    "Photography": "📷",
    "Entertainment": "🍿",
    "Communication": "💬"
  },
  parseMode: "HTML"
};

/**
 * Escapes characters that are reserved in Telegram HTML parse mode
 */
export function escapeHTML(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Generate a clean, URL-safe and hashtag-safe camelCase string from text
 */
export function cleanHashtag(text: string | null | undefined): string {
  if (!text) return "";
  const str = String(text);
  // Strip non-alphanumeric characters, convert to PascalCase
  const words = str
    .replace(/[^\w\s-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean);
  
  if (words.length === 0) return "";
  
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Format date values based on layout preferences
 */
export function formatTemplateDate(dateVal: Date | string | undefined | null, format: string): string {
  if (!dateVal) return "";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  if (isNaN(d.getTime())) return "";

  const fmt = format || "long";
  if (fmt === "hidden") return "";

  if (fmt === "relative") {
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const day = d.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[d.getMonth()];
  const monthShort = monthShortNames[d.getMonth()];
  const year = d.getFullYear();

  if (fmt === "short") {
    // 27 May 2026
    return `${day} ${monthShort} ${year}`;
  }

  // default: May 27, 2026
  return `${month} ${day}, ${year}`;
}

/**
 * Renders the Telegram post by replacing dynamic variables and cleaning up layout formatting
 */
export function renderTelegramTemplate(
  data: TelegramPostData | null | undefined,
  settings: TelegramTemplateSettings | null | undefined
): string {
  const d = data || { appName: "unknown", appTitleEn: "Unknown", slug: "unknown" };
  const s = settings || DEFAULT_TEMPLATE_SETTINGS;
  
  let text = s.template || DEFAULT_TEMPLATE;
  if (typeof text !== "string") {
    text = DEFAULT_TEMPLATE;
  }

  // Resolve Title variable
  let titleVal = "";
  if (s.showTitle ?? true) {
    const appTitleEn = d.appTitleEn || "";
    const appTitleAr = d.appTitleAr || "";
    const appTitle = appTitleAr
      ? `${appTitleEn} (${appTitleAr})`
      : appTitleEn;
    
    const baseTitle = escapeHTML(appTitle);
    const style = s.titleStyle || "premium";
    
    if (style === "uppercase") {
      titleVal = baseTitle.toUpperCase();
    } else if (style === "bold") {
      titleVal = `<b>${baseTitle}</b>`;
    } else if (style === "premium") {
      titleVal = `🔥 <b>${baseTitle.toUpperCase()}</b> 🔥`;
    } else {
      titleVal = baseTitle;
    }
  }
  text = text.replace(/{title}/g, titleVal);

  // Resolve Version variable
  const versionVal = ((s.showVersion ?? true) && d.versionName) ? escapeHTML(d.versionName) : "";
  text = text.replace(/{version}/g, versionVal);

  // Resolve Size variable
  const sizeVal = ((s.showSize ?? true) && d.apkSize) ? escapeHTML(d.apkSize) : "";
  text = text.replace(/{size}/g, sizeVal);

  // Resolve Android variable
  const androidVal = ((s.showAndroid ?? true) && d.androidRequirement) ? escapeHTML(d.androidRequirement) : "";
  text = text.replace(/{android}/g, androidVal);

  // Resolve Category variable
  let categoryVal = "";
  if ((s.showCategory ?? true) && d.categoryNameEn) {
    // Resolve emoji
    let emojis = s.categoryEmojis;
    if (typeof emojis === "string") {
      try {
        emojis = JSON.parse(emojis);
      } catch (e) {
        emojis = DEFAULT_TEMPLATE_SETTINGS.categoryEmojis;
      }
    }
    if (!emojis || typeof emojis !== "object") {
      emojis = DEFAULT_TEMPLATE_SETTINGS.categoryEmojis || {};
    }
    const emoji = emojis[d.categoryNameEn] || "📂";
    categoryVal = `${emoji} ${escapeHTML(d.categoryNameEn)}`;
  }
  text = text.replace(/{category}/g, categoryVal);

  // Resolve Date variable
  const dateVal = ((s.showDate ?? true) && d.publishedAt)
    ? formatTemplateDate(d.publishedAt, s.dateFormat || "long")
    : "";
  text = text.replace(/{date}/g, dateVal);

  // Resolve MOD Features variable
  let modVal = "";
  if ((s.showModFeatures ?? true) && d.modFeatures && d.modFeatures.length > 0) {
    const cleanFeatures = d.modFeatures.map(f => f ? String(f).trim() : "").filter(Boolean);
    modVal = `<blockquote expandable>\n` + cleanFeatures.map(feat => `• ${escapeHTML(feat)}`).join("\n") + `\n</blockquote>`;
  }
  text = text.replace(/{modFeatures}/g, modVal);

  // Resolve Changelog variable
  let changelogVal = "";
  if ((s.showChangelog ?? false) && (d.changelogEn || d.changelogAr)) {
    const rawChangelog = d.changelogEn || d.changelogAr || "";
    const lines = String(rawChangelog).split("\n").map(l => l.trim().replace(/^-\s*/, "")).filter(Boolean);
    changelogVal = lines.map(line => `- ${escapeHTML(line)}`).join("\n");
  }
  text = text.replace(/{changelog}/g, changelogVal);

  // Resolve Developer variable
  const developerVal = d.developer ? escapeHTML(d.developer) : "";
  text = text.replace(/{developer}/g, developerVal);

  // Resolve Downloads variable
  const downloadsVal = d.downloadCount !== undefined ? formatNumber(d.downloadCount) : "0";
  text = text.replace(/{downloads}/g, downloadsVal);

  // Resolve Footer variable
  const footerVal = ((s.showFooter ?? true) && s.footerText) ? escapeHTML(s.footerText) : "";
  text = text.replace(/{footer}/g, footerVal);

  // Resolve Hashtags variable
  let hashtagsVal = "";
  if (s.showHashtags ?? true) {
    if (s.hashtagsTemplate) {
      // Custom hashtag template parsing
      let hs = String(s.hashtagsTemplate);
      const cleanTitleHash = cleanHashtag(d.appTitleEn);
      const cleanCatHash = cleanHashtag(d.categoryNameEn || "");
      hs = hs.replace(/{title}/g, cleanTitleHash);
      hs = hs.replace(/{category}/g, cleanCatHash);
      hashtagsVal = hs;
    } else {
      // Auto hashtag generation
      const tagsSet = new Set<string>();
      const appTag = cleanHashtag(d.appTitleEn);
      if (appTag) tagsSet.add(`#${appTag}`);
      if (d.categoryNameEn) {
        const catTag = cleanHashtag(d.categoryNameEn);
        if (catTag) tagsSet.add(`#${catTag}`);
      }
      if (d.tags && d.tags.length > 0) {
        d.tags.forEach(t => {
          const ct = cleanHashtag(t);
          if (ct) tagsSet.add(`#${ct}`);
        });
      }
      tagsSet.add("#MODAPK");
      hashtagsVal = Array.from(tagsSet).join(" ");
    }
  }
  text = text.replace(/{hashtags}/g, hashtagsVal);

  // Clean empty lines and collapse redundant spaces
  const lines = text.split("\n");
  const filteredLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "" || trimmed === "\r") {
      filteredLines.push(line);
      continue;
    }

    const withoutHtml = trimmed.replace(/<\/?[^>]+(>|$)/g, "").trim();
    if (withoutHtml.endsWith(":") || withoutHtml.endsWith("：")) {
      // It ends with a colon! Let's check if the next line starts with a list bullet (•, -, *)
      let hasBulletContent = false;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const nextWithoutHtml = nextLine.replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (
          nextWithoutHtml.startsWith("•") ||
          nextWithoutHtml.startsWith("-") ||
          nextWithoutHtml.startsWith("*") ||
          nextLine.includes("<blockquote")
        ) {
          hasBulletContent = true;
        }
      }
      if (!hasBulletContent) {
        continue; // Skip this label line because it has no list content following it
      }
    }

    filteredLines.push(line);
  }

  const cleanedText = filteredLines
    .join("\n")
    // Collapse 3 or more consecutive newlines into 2
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleanedText;
}

/**
 * Helper to build custom inline keyboard buttons based on settings
 */
export function generateTelegramButtons(
  slug: string,
  settings: {
    siteUrl?: string;
    downloadButtonText?: string;
    websiteButtonText?: string;
  } | null | undefined
) {
  const sUrl = settings?.siteUrl || "http://localhost:3000";
  const safeSiteUrl = String(sUrl).replace(/\/+$/, "");
  const downloadUrl = `${safeSiteUrl}/download/${slug || ""}`;
  const websiteUrl = `${safeSiteUrl}/apps/${slug || ""}`;

  return {
    inline_keyboard: [
      [
        { text: settings?.downloadButtonText || "⬇️ DOWNLOAD MOD", url: downloadUrl },
        { text: settings?.websiteButtonText || "🌐 VISIT PAGE", url: websiteUrl }
      ]
    ]
  };
}
