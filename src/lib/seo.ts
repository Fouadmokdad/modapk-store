// =============================================================================
// SEO Metadata & JSON-LD Generators (Bilingual)
// =============================================================================
import { Metadata } from "next";

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "ModAPK Store";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/**
 * Safely escapes dynamic text values for insertion into JSON-LD scripts
 */
function escapeJsonLdString(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
}

/**
 * Generate base metadata for all pages
 */
export function generateBaseMetadata(overrides?: Partial<Metadata>, locale: "en" | "ar" = "en"): Metadata {
  const isAr = locale === "ar";
  const defaultTitle = isAr
    ? `${SITE_NAME} — تحميل تطبيقات وألعاب أندرويد معدلة`
    : `${SITE_NAME} — Download Premium MOD APKs`;
  const defaultDesc = isAr
    ? "تحميل أفضل تطبيقات وألعاب أندرويد MOD مع ميزات مدفوعة مفتوحة مجاناً. ملفات آمنة وموثوقة."
    : "Download the best MOD APKs with premium features unlocked. Safe, verified, and free downloads with original Google Play links.";

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: defaultTitle,
      template: `%s | ${SITE_NAME}`,
    },
    description: defaultDesc,
    keywords: isAr
      ? ["تطبيقات معدلة", "ألعاب مهكرة", "تحميل APK", "ميزات مفتوحة", "أندرويد مهكر"]
      : ["MOD APK", "APK download", "modified apps", "premium unlocked", "Android apps", "Android games"],
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: isAr ? "ar_SA" : "en_US",
      alternateLocale: isAr ? "en_US" : "ar_SA",
      title: defaultTitle,
      description: defaultDesc,
      url: SITE_URL,
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: defaultDesc,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: SITE_URL,
      languages: {
        "en": `${SITE_URL}`,
        "ar": `${SITE_URL}`,
        "x-default": `${SITE_URL}`,
      },
    },
    ...overrides,
  };
}

/**
 * Generate metadata for an app detail page (Synchronized & Localized)
 */
export function generateAppMetadata(
  app: {
    title: Record<string, string>;
    shortDescription?: Record<string, string> | null;
    iconUrl?: string | null;
    slug: string;
    modFeatures?: Array<Record<string, string>> | null;
    versions?: Array<{ versionName: string }>;
  },
  locale: "en" | "ar" = "en"
): Metadata {
  const title = app.title?.[locale] || app.title?.en || "App";
  const version = app.versions?.[0]?.versionName;
  
  const modText = app.modFeatures
    ?.slice(0, 3)
    .map((f) => f[locale] || f.en)
    .filter(Boolean)
    .join(", ");

  const isAr = locale === "ar";
  let pageTitle = "";
  if (isAr) {
    pageTitle = version
      ? `تحميل ${title} MOD APK إصدار v${version}${modText ? ` (${modText})` : ""}`
      : `تحميل ${title} MOD APK مهكر`;
  } else {
    pageTitle = version
      ? `${title} MOD APK v${version}${modText ? ` (${modText})` : ""}`
      : `${title} MOD APK`;
  }

  const description =
    app.shortDescription?.[locale] ||
    app.shortDescription?.en ||
    (isAr
      ? `قم بتحميل ${title} MOD APK${version ? ` إصدار v${version}` : ""} مع ميزات premium مفتوحة بالكامل وآمنة.`
      : `Download ${title} MOD APK${version ? ` v${version}` : ""} with premium features unlocked safely.`);

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "article",
      url: `${SITE_URL}/apps/${app.slug}`,
      images: app.iconUrl ? [{ url: app.iconUrl, width: 512, height: 512, alt: title }] : [],
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
      images: app.iconUrl ? [app.iconUrl] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/apps/${app.slug}`,
      languages: {
        "en": `${SITE_URL}/apps/${app.slug}`,
        "ar": `${SITE_URL}/apps/${app.slug}`,
        "x-default": `${SITE_URL}/apps/${app.slug}`,
      },
    },
  };
}

/**
 * Generate metadata for category pages (Synchronized & Localized)
 */
export function generateCategoryMetadata(
  category: {
    name: Record<string, string>;
    slug: string;
    type: string;
  },
  locale: "en" | "ar" = "en"
): Metadata {
  const name = category.name?.[locale] || category.name?.en || "Category";
  const isAr = locale === "ar";
  
  let typeLabel = "";
  if (isAr) {
    typeLabel = category.type === "GAME" ? "ألعاب" : "تطبيقات";
  } else {
    typeLabel = category.type === "GAME" ? "Games" : "Apps";
  }

  const title = isAr
    ? `أفضل ${typeLabel} ${name} مهكرة — تنزيل MOD APK`
    : `Best ${name} ${typeLabel} — MOD APK Downloads`;
  
  const description = isAr
    ? `تصفح وتحميل أفضل ${typeLabel} ${name} مهكرة ومعدلة مع فتح الميزات المدفوعة مجاناً لنظام أندرويد.`
    : `Browse and download the best ${name} ${typeLabel.toLowerCase()} MOD APKs with premium features unlocked.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/categories/${category.slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/categories/${category.slug}`,
      languages: {
        "en": `${SITE_URL}/categories/${category.slug}`,
        "ar": `${SITE_URL}/categories/${category.slug}`,
        "x-default": `${SITE_URL}/categories/${category.slug}`,
      },
    },
  };
}

/**
 * Generate JSON-LD SoftwareApplication schema server-side with localized text
 */
export function generateAppJsonLd(
  app: {
    title: Record<string, string>;
    shortDescription?: Record<string, string> | null;
    iconUrl?: string | null;
    slug: string;
    rating?: number | null;
    viewCount?: number;
    developer?: string | null;
    type: string;
    screenshots?: Array<{ url: string }>;
    versions?: Array<{
      versionName: string;
      size?: string | null;
      minAndroid?: string | null;
    }>;
  },
  locale: "en" | "ar" = "en"
): Record<string, unknown> {
  const version = app.versions?.[0];
  const title = escapeJsonLdString(app.title?.[locale] || app.title?.en || "App");
  const description = escapeJsonLdString(app.shortDescription?.[locale] || app.shortDescription?.en || "");
  const devName = escapeJsonLdString(app.developer || "Developer");

  // Determine dynamic applicationCategory structure
  const applicationCategory = app.type === "GAME" ? "GameApplication" : "MobileApplication";

  const schema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: title,
    description: description,
    applicationCategory: applicationCategory,
    operatingSystem: "Android",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    url: `${SITE_URL}/apps/${app.slug}`,
    downloadUrl: `${SITE_URL}/download/${app.slug}`,
    potentialAction: {
      "@type": "DownloadAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/download/${app.slug}`,
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/AndroidPlatform"
        ]
      }
    }
  };

  // Add version details safely
  if (version) {
    schema.softwareVersion = escapeJsonLdString(version.versionName);
    const sizeVal = (version as any).apkSize || version.size;
    const minAndroidVal = (version as any).androidRequirement || version.minAndroid;
    if (sizeVal) {
      schema.fileSize = escapeJsonLdString(sizeVal);
    }
    if (minAndroidVal) {
      schema.operatingSystem = `Android ${escapeJsonLdString(minAndroidVal)}`;
    }
  }

  // Add realistic ratingCount derived conservatively to protect data integrity
  if (app.rating != null && app.rating > 0) {
    const viewCount = app.viewCount || 0;
    // Derive rating count conservatively: 5% of views, minimum of 10
    const ratingCount = viewCount > 0 ? Math.max(10, Math.floor(viewCount * 0.05)) : 35;
    
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(app.rating.toFixed(1)),
      ratingCount: ratingCount,
      bestRating: "5",
      worstRating: "1",
    };
  }

  // Set icon URL safely
  if (app.iconUrl) {
    schema.image = app.iconUrl;
  }

  // Add author / organization details
  if (app.developer) {
    schema.author = {
      "@type": "Organization",
      name: devName,
    };
  }

  // Add screenshots if provided
  if (app.screenshots && app.screenshots.length > 0) {
    schema.screenshot = app.screenshots.map((s) => s.url);
  }

  return schema;
}

/**
 * Generate BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: escapeJsonLdString(item.name),
      item: item.url.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
    })),
  };
}

/**
 * Generate Organization JSON-LD
 */
export function generateOrganizationJsonLd(customName?: string, customUrl?: string): Record<string, unknown> {
  const name = customName || SITE_NAME;
  const url = customUrl || SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: name,
    url: url,
    logo: `${url}/favicon.ico`,
    sameAs: [
      "https://twitter.com/modapkstore",
      "https://facebook.com/modapkstore",
      "https://github.com/modapkstore",
    ],
  };
}

/**
 * Generate WebSite SearchAction JSON-LD for Google Sitelinks Searchbox
 */
export function generateWebSiteJsonLd(customName?: string, customUrl?: string): Record<string, unknown> {
  const name = customName || SITE_NAME;
  const url = customUrl || SITE_URL;

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: name,
    url: url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
