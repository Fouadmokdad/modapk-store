// =============================================================================
// Telegram Post Templates — Formatter & HTML Generator
// =============================================================================

export interface TelegramPostData {
  appName: string;
  appTitleEn: string;
  appTitleAr?: string;
  slug: string;
  categoryNameEn?: string;
  tags?: string[];
  releaseType?: string;
  modFeatures?: string[]; // English array of mod features
  versionName?: string;
  apkSize?: string;
  androidRequirement?: string;
  changelogEn?: string;
  changelogAr?: string;
}

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
  // Strip non-alphanumeric characters, convert to camel case
  const words = text
    .replace(/[^\w\s-]/g, "")
    .split(/[\s_-]+/)
    .filter(Boolean);
  
  if (words.length === 0) return "";
  
  return words
    .map((word, idx) => {
      // Capitalize first letter of each word to make it readable PascalCase
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

/**
 * Generate a string of hashtags from app details and settings
 */
export function generateHashtags(
  appName: string,
  categoryName?: string,
  tags?: string[],
  defaultHashtags?: string
): string {
  const hashtagsSet = new Set<string>();

  // Add App name as hashtag
  const appTag = cleanHashtag(appName);
  if (appTag) hashtagsSet.add(`#${appTag}`);

  // Add Category as hashtag
  if (categoryName) {
    const catTag = cleanHashtag(categoryName);
    if (catTag) hashtagsSet.add(`#${catTag}`);
  }

  // Add Tags
  if (tags && tags.length > 0) {
    tags.forEach((t) => {
      const cleanT = cleanHashtag(t);
      if (cleanT) hashtagsSet.add(`#${cleanT}`);
    });
  }

  // Add default hashtags
  if (defaultHashtags) {
    defaultHashtags
      .split(/[\s,]+/)
      .filter((h) => h.startsWith("#"))
      .forEach((h) => hashtagsSet.add(h));
  }

  // Ensure #MODAPK is always present
  hashtagsSet.add("#MODAPK");

  return Array.from(hashtagsSet).join(" ");
}

/**
 * Generate the final HTML message and inline buttons for Telegram
 */
export function generateTelegramPost(
  data: TelegramPostData,
  settings: {
    siteUrl: string;
    telegramDefaultHashtags?: string;
    telegramIncludeModFeatures?: boolean;
    telegramIncludeVersionInfo?: boolean;
    telegramIncludeApkSize?: boolean;
    telegramIncludeChangelog?: boolean;
    telegramIncludeDownloadButton?: boolean;
  }
) {
  const includeModFeatures = settings.telegramIncludeModFeatures ?? true;
  const includeVersionInfo = settings.telegramIncludeVersionInfo ?? true;
  const includeApkSize = settings.telegramIncludeApkSize ?? true;
  const includeChangelog = settings.telegramIncludeChangelog ?? true;
  const includeDownloadButton = settings.telegramIncludeDownloadButton ?? true;

  const appTitle = data.appTitleAr
    ? `${data.appTitleEn} (${data.appTitleAr})`
    : data.appTitleEn;

  const releaseTypeStr = data.releaseType === "ORIGINAL" ? "Original APK" : "MOD APK";
  
  let html = `🔥 <b>${escapeHTML(appTitle)} ${releaseTypeStr}</b>\n\n`;

  // MOD Features section
  if (includeModFeatures && data.modFeatures && data.modFeatures.length > 0) {
    html += `✨ <b>MOD Features:</b>\n`;
    data.modFeatures.slice(0, 8).forEach((feat) => {
      html += `• ${escapeHTML(feat)}\n`;
    });
    html += `\n`;
  }

  // Tech Specs section
  let hasSpecs = false;
  if (includeVersionInfo && data.versionName) {
    html += `📌 <b>Version:</b> ${escapeHTML(data.versionName)}\n`;
    hasSpecs = true;
  }
  if (includeApkSize && data.apkSize) {
    html += `📦 <b>Size:</b> ${escapeHTML(data.apkSize)}\n`;
    hasSpecs = true;
  }
  if (includeVersionInfo && data.androidRequirement) {
    html += `📱 <b>Android:</b> ${escapeHTML(data.androidRequirement)}\n`;
    hasSpecs = true;
  }
  if (hasSpecs) {
    html += `\n`;
  }

  // Changelog section
  if (includeChangelog && (data.changelogEn || data.changelogAr)) {
    const changelogText = data.changelogEn || data.changelogAr || "";
    html += `🆕 <b>Changelog:</b>\n`;
    // Split and format lines
    const lines = changelogText.split("\n").filter(Boolean);
    if (lines.length > 0) {
      lines.slice(0, 5).forEach((line) => {
        const cleanLine = line.trim().replace(/^-\s*/, "");
        html += `- ${escapeHTML(cleanLine)}\n`;
      });
    } else {
      html += `${escapeHTML(changelogText)}\n`;
    }
    html += `\n`;
  }

  // Auto Hashtag section
  const generatedTags = generateHashtags(
    data.appName,
    data.categoryNameEn,
    data.tags,
    settings.telegramDefaultHashtags
  );
  html += `\n${generatedTags}`;

  // Keyboard buttons
  const buttons: Array<Array<{ text: string; url: string }>> = [];
  
  if (includeDownloadButton) {
    const downloadUrl = `${settings.siteUrl.replace(/\/+$/, "")}/download/${data.slug}`;
    const websiteUrl = `${settings.siteUrl.replace(/\/+$/, "")}/apps/${data.slug}`;
    
    buttons.push([
      { text: "⬇️ Download APK", url: downloadUrl },
      { text: "🌐 Visit Website", url: websiteUrl }
    ]);
  }

  return {
    text: html,
    reply_markup: buttons.length > 0 ? { inline_keyboard: buttons } : undefined,
  };
}
