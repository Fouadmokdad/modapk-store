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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Generate a clean, URL-safe and hashtag-safe camelCase string from text
 */
export function cleanHashtag(text: string): string {
  if (!text) return "";
  // Strip non-alphanumeric characters, convert to PascalCase
  const words = text
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

  if (format === "hidden") return "";

  if (format === "relative") {
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

  if (format === "short") {
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
  data: TelegramPostData,
  settings: TelegramTemplateSettings
): string {
  let text = settings.template;

  // Resolve Title variable
  let titleVal = "";
  if (settings.showTitle) {
    const appTitle = data.appTitleAr
      ? `${data.appTitleEn} (${data.appTitleAr})`
      : data.appTitleEn;
    
    const baseTitle = escapeHTML(appTitle);
    
    if (settings.titleStyle === "uppercase") {
      titleVal = baseTitle.toUpperCase();
    } else if (settings.titleStyle === "bold") {
      titleVal = `<b>${baseTitle}</b>`;
    } else if (settings.titleStyle === "premium") {
      titleVal = `🔥 <b>${baseTitle.toUpperCase()}</b> 🔥`;
    } else {
      titleVal = baseTitle;
    }
  }
  text = text.replace(/{title}/g, titleVal);

  // Resolve Version variable
  const versionVal = settings.showVersion && data.versionName ? escapeHTML(data.versionName) : "";
  text = text.replace(/{version}/g, versionVal);

  // Resolve Size variable
  const sizeVal = settings.showSize && data.apkSize ? escapeHTML(data.apkSize) : "";
  text = text.replace(/{size}/g, sizeVal);

  // Resolve Android variable
  const androidVal = settings.showAndroid && data.androidRequirement ? escapeHTML(data.androidRequirement) : "";
  text = text.replace(/{android}/g, androidVal);

  // Resolve Category variable
  let categoryVal = "";
  if (settings.showCategory && data.categoryNameEn) {
    // Resolve emoji
    const emojis = typeof settings.categoryEmojis === "string" 
      ? JSON.parse(settings.categoryEmojis) 
      : settings.categoryEmojis || {};
    const emoji = emojis[data.categoryNameEn] || "📂";
    categoryVal = `${emoji} ${escapeHTML(data.categoryNameEn)}`;
  }
  text = text.replace(/{category}/g, categoryVal);

  // Resolve Date variable
  const dateVal = settings.showDate && data.publishedAt
    ? formatTemplateDate(data.publishedAt, settings.dateFormat)
    : "";
  text = text.replace(/{date}/g, dateVal);

  // Resolve MOD Features variable
  let modVal = "";
  if (settings.showModFeatures && data.modFeatures && data.modFeatures.length > 0) {
    const cleanFeatures = data.modFeatures.map(f => f.trim()).filter(Boolean);
    modVal = cleanFeatures.map(feat => `• ${escapeHTML(feat)}`).join("\n");
  }
  text = text.replace(/{modFeatures}/g, modVal);

  // Resolve Changelog variable
  let changelogVal = "";
  if (settings.showChangelog && (data.changelogEn || data.changelogAr)) {
    const rawChangelog = data.changelogEn || data.changelogAr || "";
    const lines = rawChangelog.split("\n").map(l => l.trim().replace(/^-\s*/, "")).filter(Boolean);
    changelogVal = lines.map(line => `- ${escapeHTML(line)}`).join("\n");
  }
  text = text.replace(/{changelog}/g, changelogVal);

  // Resolve Developer variable
  const developerVal = data.developer ? escapeHTML(data.developer) : "";
  text = text.replace(/{developer}/g, developerVal);

  // Resolve Downloads variable
  const downloadsVal = data.downloadCount !== undefined ? formatNumber(data.downloadCount) : "0";
  text = text.replace(/{downloads}/g, downloadsVal);

  // Resolve Footer variable
  const footerVal = settings.showFooter && settings.footerText ? escapeHTML(settings.footerText) : "";
  text = text.replace(/{footer}/g, footerVal);

  // Resolve Hashtags variable
  let hashtagsVal = "";
  if (settings.showHashtags) {
    if (settings.hashtagsTemplate) {
      // Custom hashtag template parsing
      let hs = settings.hashtagsTemplate;
      const cleanTitleHash = cleanHashtag(data.appTitleEn);
      const cleanCatHash = cleanHashtag(data.categoryNameEn || "");
      hs = hs.replace(/{title}/g, cleanTitleHash);
      hs = hs.replace(/{category}/g, cleanCatHash);
      hashtagsVal = hs;
    } else {
      // Auto hashtag generation
      const tagsSet = new Set<string>();
      const appTag = cleanHashtag(data.appTitleEn);
      if (appTag) tagsSet.add(`#${appTag}`);
      if (data.categoryNameEn) {
        const catTag = cleanHashtag(data.categoryNameEn);
        if (catTag) tagsSet.add(`#${catTag}`);
      }
      if (data.tags && data.tags.length > 0) {
        data.tags.forEach(t => {
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
  const cleanedText = text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === "" || trimmed === "\r") return true;
      
      // Strip HTML to see if there is actual content
      const withoutHtml = trimmed.replace(/<\/?[^>]+(>|$)/g, "").trim();
      
      // If line ends with a colon (and has no content after it), it was a label for an empty variable. Filter it out.
      if (withoutHtml.endsWith(":") || withoutHtml.endsWith("：")) {
        return false;
      }
      return true;
    })
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
    siteUrl: string;
    downloadButtonText: string;
    websiteButtonText: string;
  }
) {
  const downloadUrl = `${settings.siteUrl.replace(/\/+$/, "")}/download/${slug}`;
  const websiteUrl = `${settings.siteUrl.replace(/\/+$/, "")}/apps/${slug}`;

  return {
    inline_keyboard: [
      [
        { text: settings.downloadButtonText || "⬇️ DOWNLOAD MOD", url: downloadUrl },
        { text: settings.websiteButtonText || "🌐 VISIT PAGE", url: websiteUrl }
      ]
    ]
  };
}
