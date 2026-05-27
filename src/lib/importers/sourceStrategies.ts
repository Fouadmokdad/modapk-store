// =============================================================================
// Importer Module — Extraction Strategies Registry
// =============================================================================

export type ExtractionMode =
  | "SERVER_SCRAPE"
  | "BROWSER_ASSISTED"
  | "HYBRID"
  | "MANUAL_HTML";

export interface SourceStrategy {
  host: string;
  mode: ExtractionMode;
  supportsServerScrape: boolean;
  supportsBrowserAssist: boolean;
  antiBotRisk: "LOW" | "MEDIUM" | "HIGH";
}

export const sourceStrategies: Record<string, SourceStrategy> = {
  "liteapks.com": {
    host: "liteapks.com",
    mode: "BROWSER_ASSISTED",
    supportsServerScrape: false,
    supportsBrowserAssist: true,
    antiBotRisk: "HIGH",
  },
  "modyolo.com": {
    host: "modyolo.com",
    mode: "BROWSER_ASSISTED",
    supportsServerScrape: false,
    supportsBrowserAssist: true,
    antiBotRisk: "HIGH",
  },
  "gamedva.com": {
    host: "gamedva.com",
    mode: "HYBRID",
    supportsServerScrape: true,
    supportsBrowserAssist: true,
    antiBotRisk: "MEDIUM",
  },
  "getmodsapk.com": {
    host: "getmodsapk.com",
    mode: "HYBRID",
    supportsServerScrape: true,
    supportsBrowserAssist: true,
    antiBotRisk: "MEDIUM",
  },
  "apkpure.com": {
    host: "apkpure.com",
    mode: "SERVER_SCRAPE",
    supportsServerScrape: true,
    supportsBrowserAssist: false,
    antiBotRisk: "MEDIUM",
  },
  "apkcombo.com": {
    host: "apkcombo.com",
    mode: "SERVER_SCRAPE",
    supportsServerScrape: true,
    supportsBrowserAssist: false,
    antiBotRisk: "MEDIUM",
  },
  "uptodown.com": {
    host: "uptodown.com",
    mode: "SERVER_SCRAPE",
    supportsServerScrape: true,
    supportsBrowserAssist: false,
    antiBotRisk: "LOW",
  },
  "happymod.com": {
    host: "happymod.com",
    mode: "HYBRID",
    supportsServerScrape: true,
    supportsBrowserAssist: true,
    antiBotRisk: "MEDIUM",
  },
  "play.google.com": {
    host: "play.google.com",
    mode: "SERVER_SCRAPE",
    supportsServerScrape: true,
    supportsBrowserAssist: false,
    antiBotRisk: "LOW",
  },
};

/**
 * Resolves the appropriate extraction strategy for a given domain/host.
 */
export function getStrategyForDomain(domain: string): SourceStrategy {
  let cleaned = domain.toLowerCase().trim();
  if (cleaned.startsWith("www.")) {
    cleaned = cleaned.substring(4);
  }
  
  if (sourceStrategies[cleaned]) {
    return sourceStrategies[cleaned];
  }

  // Suffix/subdomain match
  for (const host of Object.keys(sourceStrategies)) {
    if (cleaned === host || cleaned.endsWith("." + host)) {
      return sourceStrategies[host];
    }
  }

  // Fallback default generic strategy
  return {
    host: cleaned,
    mode: "SERVER_SCRAPE",
    supportsServerScrape: true,
    supportsBrowserAssist: false,
    antiBotRisk: "LOW",
  };
}
