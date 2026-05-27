// =============================================================================
// Importer Module — Core Entry Engine
// =============================================================================
import sanitizeHtml from "sanitize-html";
import { fetchSafeHtml, ALLOWED_DOMAINS } from "./security";
import { normalizeDomain } from "./normalize";
import { getParserForDomain } from "./registry";
import { ImportedAppData, ExternalDownloadLink, LinkClassification } from "./types";
import { slugify } from "../utils";
import { GenericParser } from "./sources/generic";

const IMPORTER_VERSION = "1.1.0";

/**
 * Strips script tags, iframes, inline events, and dangerous selectors, keeping only safe layout tags.
 * Hardened to sanitize short descriptions, descriptions, and changelogs safely.
 */
export function sanitizeHtmlContent(text: string): string {
  if (!text) return "";
  return sanitizeHtml(text, {
    allowedTags: [
      "p", "br", "strong", "em", "b", "i", "ul", "ol", "li", "span", "h3", "h4", "div"
    ],
    allowedAttributes: {
      "span": ["style"],
      "div": ["style"]
    },
    allowedStyles: {
      "*": {
        "color": [/^\#?[a-f0-9]+$/i, /^rgb/i],
        "text-align": [/^left$/, /^right$/, /^center$/]
      }
    }
  }).trim();
}

/**
 * Deprecated name kept for backward compatibility, mapping to sanitizeHtmlContent.
 */
export function sanitizeExtractedDescription(text: string): string {
  return sanitizeHtmlContent(text);
}

/**
 * Classifies an extracted external download link based on security filters.
 */
export function classifyDownloadLink(urlStr: string): LinkClassification {
  try {
    const urlObj = new URL(urlStr);
    const protocol = urlObj.protocol.toLowerCase();

    // Reject dangerous non-HTTP protocols
    if (protocol !== "http:" && protocol !== "https:") {
      return "suspicious";
    }

    let host = urlObj.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.substring(4);
    }

    // 1. Trusted host (matches our direct scraper parser allowlist)
    if (ALLOWED_DOMAINS.includes(host)) {
      return "trusted";
    }

    // 2. Mirror host (known safe cloud storage and direct mirror sites)
    const knownMirrors = [
      "mediafire.com",
      "drive.google.com",
      "dropbox.com",
      "mega.nz",
      "github.com",
      "gitlab.com",
      "apkpure.com",
      "apkcombo.com"
    ];

    if (knownMirrors.some(mirror => host === mirror || host.endsWith("." + mirror))) {
      return "mirror";
    }

    // 3. Suspicious hosts (localhost/private ranges, local domains)
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local") ||
      host.includes("internal")
    ) {
      return "suspicious";
    }

    // 4. Unknown host
    return "unknown";
  } catch {
    return "suspicious";
  }
}

/**
 * Calculates a confidence rating based on data resolution, completeness, and structured telemetry.
 */
export function calculateConfidenceScore(data: Partial<ImportedAppData>, hasStructuredData = false): number {
  const hasTitle = !!(data.title?.en && data.title.en.trim());
  const hasDesc = !!(data.description?.en && data.description.en.trim());
  const hasPackage = !!(data.packageName && data.packageName.trim());
  const hasIcon = !!data.iconUrl;
  const hasScreenshots = Array.isArray(data.screenshots) && data.screenshots.length > 0;
  const hasVersion = !!data.versionName;

  if (!hasTitle) {
    return 0; // Failed
  }

  const complete = hasTitle && hasDesc && hasPackage && hasIcon && hasScreenshots && hasVersion;
  if (complete) {
    return 100;
  }

  // Partial: has title, description, and at least some other core attributes
  const score = [hasPackage, hasIcon, hasScreenshots, hasVersion].filter(Boolean).length;
  if (hasDesc && score >= 2) {
    return 70;
  }

  // Weak: missing description or core attributes, but has title
  return 40;
}

/**
 * The main coordinator fetching and parsing metadata from a third-party app link.
 * Built with robust parser isolation, duplicate checking, and security sanitization.
 */
export async function importAppMetadataFromUrl(urlStr: string, forceGeneric = false, pastedHtml?: string): Promise<ImportedAppData> {
  const warnings: string[] = [];
  const errors: string[] = [];
  let parserSuccess = false;

  const domain = normalizeDomain(urlStr);
  if (!domain) {
    throw new Error("Validation Error: Invalid URL input. Host domain could not be parsed.");
  }

  // 1. Fetch raw safe HTML code (SSRF & DNS rebinding guarded) or use manually pasted HTML
  const html = pastedHtml ? pastedHtml : await fetchSafeHtml(urlStr);

  // 2. Resolve target parser from registry (with optional generic bypass)
  const parser = forceGeneric ? GenericParser : getParserForDomain(domain);

  // 3. Parse html in isolated environment to ensure one parser failure won't crash the engine
  let parsed: Partial<ImportedAppData> = {};
  try {
    parsed = await parser.parse(html, urlStr);
    parserSuccess = true;
  } catch (err: any) {
    const parserName = parser === GenericParser ? "Generic" : domain;
    errors.push(`Parser Error: Scraper "${parserName}" crashed: ${err.message || err}. Attempting automatic generic recovery.`);
    
    // Automatic Crash Recovery: Attempt fallback to GenericParser
    try {
      if (parser !== GenericParser) {
        parsed = await GenericParser.parse(html, urlStr);
        parsed.warnings = parsed.warnings || [];
        parsed.warnings.push("Recovery Warning: Specialized scraper crashed; metadata compiled via generic fallback parser.");
        parserSuccess = true;
      }
    } catch (fallbackErr: any) {
      errors.push(`Fallback Error: Generic scraper also crashed: ${fallbackErr.message || fallbackErr}`);
    }
  }

  // Combine warnings and clean descriptions
  const combinedWarnings = [...warnings, ...(parsed.warnings || [])];

  const rawDescriptionEn = parsed.description?.en || "";
  const rawDescriptionAr = parsed.description?.ar || "";
  const rawShortDescEn = parsed.shortDescription?.en || "";
  const rawShortDescAr = parsed.shortDescription?.ar || "";

  const cleanDescriptionEn = sanitizeHtmlContent(rawDescriptionEn);
  const cleanDescriptionAr = sanitizeHtmlContent(rawDescriptionAr);
  const cleanShortDescEn = sanitizeHtmlContent(rawShortDescEn);
  const cleanShortDescAr = sanitizeHtmlContent(rawShortDescAr);

  if (!cleanDescriptionEn) {
    combinedWarnings.push("Sanitized description field resolved to an empty string.");
  }

  // Structured data check
  const hasStructuredData = parser !== GenericParser || !!parsed.rawExtractedData?.hasStructuredData;

  // External Download Links - strictly filter protocols, extract hostnames, and classify security level
  const externalDownloadLinks: ExternalDownloadLink[] = (parsed.externalDownloadLinks || [])
    .map((link) => {
      let hostname = "unknown";
      try {
        const u = new URL(link.url);
        hostname = u.hostname.replace("www.", "");
        
        // Strict protocol validation
        if (u.protocol !== "http:" && u.protocol !== "https:") {
          throw new Error("Dangerous protocol");
        }
      } catch {
        // Drop malformed/unsupported protocol links
        return null;
      }

      const classification = classifyDownloadLink(link.url);

      return {
        label: link.label || `Mirror [${hostname}]`,
        url: link.url,
        classification,
      };
    })
    .filter((l) => l !== null) as ExternalDownloadLink[];

  const result: ImportedAppData = {
    sourceName: parsed.sourceName || domain,
    sourceUrl: urlStr,
    confidenceScore: 0, // Assigned below
    warnings: combinedWarnings,
    errors,

    title: parsed.title || { en: "", ar: "" },
    slug: parsed.slug || (parsed.title?.en ? slugify(parsed.title.en) : ""),
    packageName: parsed.packageName || null,
    shortDescription: {
      en: cleanShortDescEn,
      ar: cleanShortDescAr,
    },
    description: {
      en: cleanDescriptionEn,
      ar: cleanDescriptionAr,
    },
    iconUrl: parsed.iconUrl || null,
    screenshots: parsed.screenshots || [],

    versionName: parsed.versionName || null,
    versionCode: parsed.versionCode || null,
    size: parsed.size || null,
    minAndroid: parsed.minAndroid || null,
    category: parsed.category || null,
    type: parsed.type || "APP",
    developer: parsed.developer || null,
    rating: parsed.rating || null,
    installs: parsed.installs || null,
    releasedAt: parsed.releasedAt || null,

    modFeatures: parsed.modFeatures || [],
    changelog: parsed.changelog
      ? {
          en: sanitizeHtmlContent(parsed.changelog.en || ""),
          ar: sanitizeHtmlContent(parsed.changelog.ar || ""),
        }
      : null,
    originalPlayStoreUrl: parsed.originalPlayStoreUrl || null,
    externalDownloadLinks,

    // Importer Telemetry Audit Trail
    rawExtractedData: {
      importerVersion: IMPORTER_VERSION,
      importedAt: new Date().toISOString(),
      parserUsed: parsed.sourceName || domain,
      rawHtmlLength: html.length,
      parserSuccess,
      hasStructuredData,
      isPastedHtml: !!pastedHtml,
      extractionWarningsCount: combinedWarnings.length,
      errorsCount: errors.length,
    },
  };

  // 4. Calculate total confidence rating
  result.confidenceScore = calculateConfidenceScore(result, hasStructuredData);

  return result;
}

