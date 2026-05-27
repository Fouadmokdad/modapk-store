// =============================================================================
// Zod Validation Schemas for API Routes
// =============================================================================
import { z } from "zod";

// ---------------------------------------------------------------------------
// Bilingual text field (shared)
// ---------------------------------------------------------------------------
export const bilingualTextSchema = z.object({
  en: z.string().min(1, "English text is required"),
  ar: z.string().optional().default(""),
});

export const bilingualTextOptionalSchema = z.object({
  en: z.string().optional().default(""),
  ar: z.string().optional().default(""),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------
export const categorySchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  name: bilingualTextSchema,
  description: bilingualTextOptionalSchema.optional(),
  iconUrl: z.string().url().optional().or(z.literal("")),
  type: z.enum(["APP", "GAME"]),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------
export const tagSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  name: bilingualTextSchema,
});

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export const appSchema = z.object({
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  packageName: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional().default("DRAFT"),
  type: z.enum(["APP", "GAME"]).optional().default("APP"),
  releaseType: z.enum(['ORIGINAL', 'MOD', 'BETA']).default('MOD'),
  title: bilingualTextSchema,
  shortDescription: bilingualTextOptionalSchema.optional(),
  description: bilingualTextOptionalSchema.optional(),
  iconUrl: z.string().url().optional().or(z.literal("")).nullable(),
  headerImageUrl: z.string().url().optional().or(z.literal("")).nullable(),
  developer: z.string().optional().nullable(),
  developerUrl: z.string().url().optional().or(z.literal("")).nullable(),
  originalPlayStoreUrl: z.string().url().optional().or(z.literal("")).nullable(),
  categoryId: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  contentRating: z.string().optional().nullable(),
  installs: z.string().optional().nullable(),
  isFeatured: z.boolean().optional().default(false),
  isTrending: z.boolean().optional().default(false),
  modFeatures: z
    .array(bilingualTextOptionalSchema)
    .optional()
    .nullable(),
  safetyDisclaimer: bilingualTextOptionalSchema.optional().nullable(),
  antiBanWarning: bilingualTextOptionalSchema.optional().nullable(),
  installationGuide: bilingualTextOptionalSchema.optional().nullable(),
  virusScanHash: z.string().optional().nullable(),
  virusScanUrl: z.string().url().optional().or(z.literal("")).nullable(),
  tagIds: z.array(z.string()).optional().default([]),
});

export const appStatusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]),
});

// ---------------------------------------------------------------------------
// App Version
// ---------------------------------------------------------------------------
export const appVersionSchema = z.object({
  versionName: z.string().min(1, "Version name is required"),
  versionCode: z.string().optional().nullable(),
  size: z.string().optional().nullable(), // Deprecated
  minAndroid: z.string().optional().nullable(), // Deprecated
  apkSize: z.string().optional().nullable(),
  androidRequirement: z.string().optional().nullable(),
  changelog: bilingualTextOptionalSchema.optional(),
  modInfo: bilingualTextOptionalSchema.optional(),
  isLatest: z.boolean().optional().default(false),
  releasedAt: z.string().datetime().optional().nullable(),
});

// ---------------------------------------------------------------------------
// Download Mirror
// ---------------------------------------------------------------------------
export const downloadMirrorSchema = z.object({
  hostName: z.string().min(1, "Host name is required"),
  downloadUrl: z.string().url("Must be a valid URL"),
  redirectEnabled: z.boolean().optional().default(true),
  priority: z.number().int().optional().default(0),
  healthStatus: z.enum(["HEALTHY", "DEAD", "SLOW", "REDIRECT_BROKEN", "REMOVED"]).optional().default("HEALTHY"),
});

// ---------------------------------------------------------------------------
// Download Link
// ---------------------------------------------------------------------------
export const downloadLinkSchema = z.object({
  label: z.string().min(1, "Label is required"),
  url: z.string().url("Must be a valid URL"),
  isPrimary: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ---------------------------------------------------------------------------
// Screenshot
// ---------------------------------------------------------------------------
export const screenshotSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  altText: z.string().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
export const reportSchema = z.object({
  appId: z.string().min(1),
  type: z.enum(["BROKEN_LINK", "COPYRIGHT"]),
  reporterEmail: z.string().email().optional().or(z.literal("")),
  reporterName: z.string().optional().or(z.literal("")),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export const reportStatusSchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"]),
  adminNotes: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Search / Pagination
// ---------------------------------------------------------------------------
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  sort: z.string().optional().default("createdAt"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const searchSchema = paginationSchema.extend({
  q: z.string().optional(),
  type: z.enum(["APP", "GAME"]).optional(),
  categoryId: z.string().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "HIDDEN"]).optional(),
  tagId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Play Store Fetch
// ---------------------------------------------------------------------------
export const fetchPlayStoreSchema = z.object({
  packageName: z
    .string()
    .min(3, "Package name is required")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/,
      "Invalid package name format (e.g., com.example.app)"
    ),
});
