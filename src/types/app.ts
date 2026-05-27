// =============================================================================
// Application Type Definitions
// =============================================================================
import type { AppStatus, AppType, ReportType, ReportStatus, ReleaseType } from "@prisma/client";

/**
 * Bilingual text field
 */
export interface BilingualText {
  en: string;
  ar: string;
  [key: string]: string;
}

/**
 * App with all relations (for admin views)
 */
export interface AppWithRelations {
  id: string;
  slug: string;
  packageName: string | null;
  status: AppStatus;
  type: AppType;
  title: BilingualText;
  releaseType: ReleaseType;
  shortDescription: BilingualText | null;
  description: BilingualText | null;
  iconUrl: string | null;
  headerImageUrl: string | null;
  developer: string | null;
  developerUrl: string | null;
  originalPlayStoreUrl: string | null;
  categoryId: string | null;
  category: CategoryData | null;
  rating: number | null;
  contentRating: string | null;
  installs: string | null;
  isFeatured: boolean;
  isTrending: boolean;
  modFeatures: BilingualText[] | null;
  safetyDisclaimer: BilingualText | null;
  antiBanWarning: BilingualText | null;
  installationGuide: BilingualText | null;
  virusScanHash: string | null;
  virusScanUrl: string | null;
  viewCount: number;
  downloadCount: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  versions: VersionData[];
  screenshots: ScreenshotData[];
  tags: TagData[];
}

/**
 * App card data (for listing views — minimal)
 */
export interface AppCardData {
  id: string;
  slug: string;
  title: BilingualText;
  shortDescription: BilingualText | null;
  iconUrl: string | null;
  type: AppType;
  releaseType: ReleaseType;
  rating: number | null;
  downloadCount: number;
  isFeatured: boolean;
  isTrending: boolean;
  category: { name: BilingualText; slug: string } | null;
  versions: { versionName: string }[];
}

/**
 * Category
 */
export interface CategoryData {
  id: string;
  slug: string;
  name: BilingualText;
  description: BilingualText | null;
  iconUrl: string | null;
  type: AppType;
  sortOrder: number;
  _count?: { apps: number };
}

/**
 * Tag
 */
export interface TagData {
  id: string;
  slug: string;
  name: BilingualText;
}

/**
 * App Version
 */
export interface VersionData {
  id: string;
  versionName: string;
  versionCode: string | null;
  size: string | null;
  minAndroid: string | null;
  changelog: BilingualText | null;
  modInfo: BilingualText | null;
  isLatest: boolean;
  releasedAt: string | null;
  createdAt: string;
  downloadLinks: DownloadLinkData[];
}

/**
 * Download Link
 */
export interface DownloadLinkData {
  id: string;
  label: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

/**
 * Screenshot
 */
export interface ScreenshotData {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

/**
 * Report
 */
export interface ReportData {
  id: string;
  appId: string;
  app: { title: BilingualText; slug: string };
  type: ReportType;
  reporterEmail: string | null;
  reporterName: string | null;
  message: string;
  status: ReportStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

/**
 * Dashboard stats
 */
export interface DashboardStats {
  totalApps: number;
  publishedApps: number;
  draftApps: number;
  totalDownloads: number;
  totalViews: number;
  pendingReports: number;
}
