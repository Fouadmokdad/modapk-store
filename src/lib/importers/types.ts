// =============================================================================
// Importers Module — Type Definitions
// =============================================================================

export type LinkClassification = "trusted" | "mirror" | "unknown" | "suspicious";

export interface ExternalDownloadLink {
  label: string;
  url: string;
  classification?: LinkClassification;
}

export interface ImportedAppData {
  sourceName: string;
  sourceUrl: string;
  confidenceScore: number; // 0 to 100
  warnings: string[];
  errors?: string[];
  
  // Core App Details
  title: { en: string; ar: string };
  slug: string; // Slug suggestion
  packageName: string | null;
  shortDescription: { en: string; ar: string };
  description: { en: string; ar: string };
  iconUrl: string | null;
  screenshots: string[];
  
  // Version Info
  versionName: string | null;
  versionCode: string | null;
  size: string | null;
  minAndroid: string | null;
  category: string | null; // e.g. "Tools", "Action"
  type: "APP" | "GAME";
  developer: string | null;
  developerUrl: string | null;
  rating: number | null;
  contentRating: string | null;
  installs: string | null;
  releasedAt: string | null; // ISO Date string or null
  
  // MOD specific
  modFeatures: string[];
  changelog: { en: string; ar: string } | null;
  
  // External Mapping / Sourcing
  originalPlayStoreUrl: string | null;
  externalDownloadLinks: ExternalDownloadLink[];
  
  // For Debugging / Raw Inspection
  rawExtractedData?: Record<string, any>;
}

export interface ImporterParser {
  canHandle(url: string): boolean;
  parse(html: string, url: string): Promise<Partial<ImportedAppData>>;
}

export class ImporterProtectedSourceError extends Error {
  sourceName: string;
  statusCode: number;
  reason: string;
  suggestion: string;

  constructor(sourceName: string, statusCode: number, reason: string, suggestion: string) {
    super(`Protected Source Alert: "${sourceName}" returned HTTP status ${statusCode}.`);
    this.name = "ImporterProtectedSourceError";
    this.sourceName = sourceName;
    this.statusCode = statusCode;
    this.reason = reason;
    this.suggestion = suggestion;
  }
}
