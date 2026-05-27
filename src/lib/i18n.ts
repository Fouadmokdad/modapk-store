// =============================================================================
// i18n — Locale Helper System
// =============================================================================

export type Locale = "en" | "ar";

export const locales: Locale[] = ["en", "ar"];
export const defaultLocale: Locale = "en";

export const localeConfig: Record<Locale, { name: string; dir: "ltr" | "rtl"; nativeName: string }> = {
  en: { name: "English", dir: "ltr", nativeName: "English" },
  ar: { name: "Arabic", dir: "rtl", nativeName: "العربية" },
};

/**
 * Get the text direction for a locale
 */
export function getDirection(locale: Locale): "ltr" | "rtl" {
  return localeConfig[locale].dir;
}

/**
 * Extract a localized string from a bilingual JSON field
 * Falls back to English if the target locale is missing
 */
export function getLocalizedText(
  field: Record<string, string> | string | null | undefined,
  locale: Locale
): string {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[locale] || field["en"] || "";
}

/**
 * Create a bilingual text object
 */
export function createBilingualText(en: string, ar: string = ""): Record<string, string> {
  return { en, ar };
}

/**
 * Load locale translations (client-side)
 */
export async function loadTranslations(locale: Locale): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(`/locales/${locale}.json`);
    if (!res.ok) throw new Error(`Failed to load ${locale} translations`);
    return res.json();
  } catch {
    console.error(`Failed to load translations for ${locale}`);
    return {};
  }
}

/**
 * Get a nested translation key like "common.home"
 */
export function t(
  translations: Record<string, unknown>,
  key: string,
  params?: Record<string, string>
): string {
  const keys = key.split(".");
  let value: unknown = translations;

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Return key as fallback
    }
  }

  let result = typeof value === "string" ? value : key;

  // Replace parameters like {appName}
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      result = result.replace(`{${paramKey}}`, paramValue);
    }
  }

  return result;
}
