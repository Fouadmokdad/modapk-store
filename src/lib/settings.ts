// =============================================================================
// Settings Manager — Strongly Typed Runtime Settings Portal
// =============================================================================
import { db } from "./db";
import { unstable_cache } from "next/cache";
import { revalidateTag } from "next/cache";
import { z } from "zod";

// -----------------------------------------------------------------------------
// Settings Schema Validation (Zod)
// -----------------------------------------------------------------------------
export const bilingualTextSchema = z.object({
  en: z.string().min(1, "English value is required"),
  ar: z.string().optional().default(""),
});

export const settingsSchema = z.object({
  siteTitle: bilingualTextSchema,
  siteDescription: bilingualTextSchema,
  contactEmail: z.string().email("Invalid contact email address"),
  siteUrl: z.string().url("Invalid site canonical URL"),
  downloadCountdown: z.number().int().min(1, "Countdown must be at least 1 second").max(60, "Countdown cannot exceed 60 seconds"),
  socialLinks: z.object({
    twitter: z.string().url("Invalid Twitter URL").or(z.literal("")).optional(),
    facebook: z.string().url("Invalid Facebook URL").or(z.literal("")).optional(),
    github: z.string().url("Invalid GitHub URL").or(z.literal("")).optional(),
  }),
  disclaimer: bilingualTextSchema,
  footerText: bilingualTextSchema,
  homepageFeatured: z.object({
    showTrending: z.boolean().default(true),
    showLatest: z.boolean().default(true),
    showCategories: z.boolean().default(true),
  }),
  maintenanceMode: z.boolean().default(false),
  adsSettings: z.object({
    beforeCountdown: z.string().optional().default(""),
    afterCountdown: z.string().optional().default(""),
    sidebar: z.string().optional().default(""),
  }).optional().default({ beforeCountdown: "", afterCountdown: "", sidebar: "" }),
});

export type SiteSettings = z.infer<typeof settingsSchema>;

// -----------------------------------------------------------------------------
// Safe Fallback Defaults
// -----------------------------------------------------------------------------
export const DEFAULT_SETTINGS: SiteSettings = {
  siteTitle: {
    en: "ModAPK Store",
    ar: "متجر ModAPK",
  },
  siteDescription: {
    en: "Download the best MOD APKs with premium features unlocked. Safe, verified, and free downloads with original Google Play links.",
    ar: "تحميل أفضل تطبيقات وألعاب أندرويد MOD مع ميزات مدفوعة مفتوحة مجاناً. تحميلات آمنة ومُحققة.",
  },
  contactEmail: "contact@modapkstore.com",
  siteUrl: "http://localhost:3000",
  downloadCountdown: 10,
  socialLinks: {
    twitter: "https://twitter.com/modapkstore",
    facebook: "https://facebook.com/modapkstore",
    github: "https://github.com/modapkstore",
  },
  disclaimer: {
    en: "This website provides MOD APK files for informational purposes only. We do not host any APK files. All download links are provided by third parties. Download and install at your own risk.",
    ar: "يوفر هذا الموقع ملفات MOD APK لأغراض إعلامية فقط. نحن لا نستضيف أي ملفات APK. جميع روابط التحميل مقدمة من أطراف ثالثة. قم بالتحميل والتثبيت على مسؤوليتك الخاصة.",
  },
  footerText: {
    en: "Your trusted source for premium MOD APKs. All rights reserved.",
    ar: "مصدرك الموثوق لتطبيقات MOD المميزة. جميع الحقوق محفوظة.",
  },
  homepageFeatured: {
    showTrending: true,
    showLatest: true,
    showCategories: true,
  },
  maintenanceMode: false,
  adsSettings: {
    beforeCountdown: "<!-- Mock Responsive Banner: Before Countdown -->",
    afterCountdown: "<!-- Mock Responsive Banner: After Countdown -->",
    sidebar: "<!-- Mock Sidebar Responsive Banner -->",
  },
};

// -----------------------------------------------------------------------------
// Core Database Operations (Cached & Revalidated)
// -----------------------------------------------------------------------------

async function fetchSettingsRaw(): Promise<SiteSettings> {
  try {
    const record = await db.setting.findUnique({
      where: { id: "global" },
    });

    if (!record) {
      return DEFAULT_SETTINGS;
    }

    // Safely cast database JSON fields into structured settings schema
    return {
      siteTitle: (record.siteTitle as any) || DEFAULT_SETTINGS.siteTitle,
      siteDescription: (record.siteDescription as any) || DEFAULT_SETTINGS.siteDescription,
      contactEmail: record.contactEmail || DEFAULT_SETTINGS.contactEmail,
      siteUrl: record.siteUrl || DEFAULT_SETTINGS.siteUrl,
      downloadCountdown: record.downloadCountdown ?? DEFAULT_SETTINGS.downloadCountdown,
      socialLinks: (record.socialLinks as any) || DEFAULT_SETTINGS.socialLinks,
      disclaimer: (record.disclaimer as any) || DEFAULT_SETTINGS.disclaimer,
      footerText: (record.footerText as any) || DEFAULT_SETTINGS.footerText,
      homepageFeatured: (record.homepageFeatured as any) || DEFAULT_SETTINGS.homepageFeatured,
      maintenanceMode: record.maintenanceMode ?? DEFAULT_SETTINGS.maintenanceMode,
      adsSettings: (record.adsSettings as any) || DEFAULT_SETTINGS.adsSettings,
    };
  } catch (err) {
    console.error("⚠️ Failed to load settings from DB. Returning fallback defaults:", err);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Public cached settings getter (cached for 1 hour, revalidated manually upon admin edits)
 */
export const getSiteSettings = unstable_cache(
  async () => {
    return fetchSettingsRaw();
  },
  ["global-site-settings-cache"],
  { revalidate: 3600, tags: ["settings"] }
);

/**
 * Securely updates site settings, upserting the DB row and purging caches
 */
export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const currentSettings = await fetchSettingsRaw();
  const merged = { ...currentSettings, ...data };
  
  // Zod Validation and input sanitization
  const validated = settingsSchema.parse(merged);

  await db.setting.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      siteTitle: validated.siteTitle as any,
      siteDescription: validated.siteDescription as any,
      contactEmail: validated.contactEmail,
      siteUrl: validated.siteUrl,
      downloadCountdown: validated.downloadCountdown,
      socialLinks: validated.socialLinks as any,
      disclaimer: validated.disclaimer as any,
      footerText: validated.footerText as any,
      homepageFeatured: validated.homepageFeatured as any,
      maintenanceMode: validated.maintenanceMode,
      adsSettings: validated.adsSettings as any,
    },
    update: {
      siteTitle: validated.siteTitle as any,
      siteDescription: validated.siteDescription as any,
      contactEmail: validated.contactEmail,
      siteUrl: validated.siteUrl,
      downloadCountdown: validated.downloadCountdown,
      socialLinks: validated.socialLinks as any,
      disclaimer: validated.disclaimer as any,
      footerText: validated.footerText as any,
      homepageFeatured: validated.homepageFeatured as any,
      maintenanceMode: validated.maintenanceMode,
      adsSettings: validated.adsSettings as any,
    },
  });

  // Purge the settings cache tag immediately so public pages reflect updates instantly!
  (revalidateTag as any)("settings");

  return validated;
}
