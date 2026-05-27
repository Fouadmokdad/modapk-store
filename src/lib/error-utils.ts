// =============================================================================
// Centralized Error Utilities & Safe Data Normalizers
// Production-grade defensive programming helpers
// =============================================================================
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Default fallbacks
// ---------------------------------------------------------------------------
export const DEFAULT_APP_THEME = {
  bg: "from-purple-500/20 to-cyan-500/20",
  color: "#8B5CF6",
  border: "#A855F7",
};

export const DEFAULT_CATEGORY = {
  id: "",
  slug: "uncategorized",
  name: { en: "Uncategorized", ar: "غير مصنف" },
};

export const DEFAULT_STATUS_STYLE = {
  bg: "hsl(0 0% 50% / 0.1)",
  text: "hsl(0 0% 50%)",
  label: "Unknown",
};

// ---------------------------------------------------------------------------
// Safe bilingual text extractor
// ---------------------------------------------------------------------------
export function getBilingualText(
  value: unknown,
  fallbackEn = "Untitled",
  fallbackAr = "بدون عنوان"
): { en: string; ar: string } {
  if (value && typeof value === "object" && value !== null) {
    const v = value as Record<string, string>;
    return {
      en: v.en || fallbackEn,
      ar: v.ar || fallbackAr,
    };
  }
  if (typeof value === "string" && value) {
    return { en: value, ar: value };
  }
  return { en: fallbackEn, ar: fallbackAr };
}

/**
 * Safely display a bilingual text field, preferring `locale` or falling back.
 */
export function safeBilingualDisplay(
  value: unknown,
  locale: "en" | "ar" = "en",
  fallback = "—"
): string {
  const text = getBilingualText(value, fallback, fallback);
  return text[locale] || text.en || fallback;
}

// ---------------------------------------------------------------------------
// Safe property accessor — never crashes on undefined
// ---------------------------------------------------------------------------
export function safeGet<T>(
  obj: unknown,
  path: string,
  fallback: T
): T {
  if (!obj || typeof obj !== "object") return fallback;
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return fallback;
    if (typeof current !== "object") return fallback;
    current = (current as Record<string, unknown>)[key];
  }
  return (current as T) ?? fallback;
}

// ---------------------------------------------------------------------------
// App data normalizer — ensures every field is defined
// ---------------------------------------------------------------------------
export function normalizeApp(app: unknown) {
  if (!app || typeof app !== "object") return null;
  const a = app as Record<string, unknown>;

  const title = getBilingualText(a.title, "Untitled", "بدون عنوان");
  const category = a.category && typeof a.category === "object"
    ? a.category
    : DEFAULT_CATEGORY;

  return {
    ...a,
    id: String(a.id || ""),
    slug: String(a.slug || ""),
    title,
    category,
    tags: Array.isArray(a.tags) ? a.tags : [],
    screenshots: Array.isArray(a.screenshots) ? a.screenshots : [],
    versions: Array.isArray(a.versions) ? a.versions : [],
    downloadMirrors: Array.isArray(a.downloadMirrors) ? a.downloadMirrors : [],
    theme: (a.theme && typeof a.theme === "object" ? a.theme : DEFAULT_APP_THEME) as typeof DEFAULT_APP_THEME,
    downloadCount: typeof a.downloadCount === "number" ? a.downloadCount : 0,
    viewCount: typeof a.viewCount === "number" ? a.viewCount : 0,
    status: String(a.status || "DRAFT"),
    type: String(a.type || "APP"),
    releaseType: String(a.releaseType || "MOD"),
    isFeatured: Boolean(a.isFeatured),
    isTrending: Boolean(a.isTrending),
    iconUrl: a.iconUrl ? String(a.iconUrl) : undefined,
    headerImageUrl: a.headerImageUrl ? String(a.headerImageUrl) : undefined,
    packageName: a.packageName ? String(a.packageName) : undefined,
  };
}

// ---------------------------------------------------------------------------
// Category data normalizer
// ---------------------------------------------------------------------------
export function normalizeCategory(cat: unknown) {
  if (!cat || typeof cat !== "object") return DEFAULT_CATEGORY;
  const c = cat as Record<string, unknown>;
  return {
    id: String(c.id || ""),
    slug: String(c.slug || "uncategorized"),
    name: getBilingualText(c.name, "Uncategorized", "غير مصنف"),
    description: c.description ? getBilingualText(c.description, "", "") : null,
    iconUrl: c.iconUrl ? String(c.iconUrl) : null,
    type: String(c.type || "APP"),
    sortOrder: typeof c.sortOrder === "number" ? c.sortOrder : 0,
    _count: c._count && typeof c._count === "object" ? c._count : { apps: 0 },
  };
}

// ---------------------------------------------------------------------------
// Safe array normalizer
// ---------------------------------------------------------------------------
export function normalizeArray<T>(input: unknown): T[] {
  if (Array.isArray(input)) return input.filter(Boolean) as T[];
  return [];
}

// ---------------------------------------------------------------------------
// API response sanitizer
// ---------------------------------------------------------------------------
export function sanitizeApiResponse<T>(
  data: unknown,
  normalizer?: (item: unknown) => T | null
): T[] {
  if (!data) return [];
  const arr = Array.isArray(data) ? data : [];
  if (normalizer) {
    return arr.map(normalizer).filter((item): item is T => item !== null);
  }
  return arr as T[];
}

// ---------------------------------------------------------------------------
// Standardized API Response Factories
// ---------------------------------------------------------------------------
export function createApiResponse<T>(data: T, status = 200, meta?: Record<string, unknown>) {
  return NextResponse.json(
    { success: true, data, ...(meta ? { meta } : {}) },
    { status }
  );
}

export function createApiError(message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      message, // Dual-key for frontend compat
      ...(details ? { details } : {}),
    },
    { status }
  );
}

// ---------------------------------------------------------------------------
// Prisma Error Handler — converts Prisma errors to clean API responses
// ---------------------------------------------------------------------------
export function handlePrismaError(error: unknown): NextResponse | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        const target = (error.meta as Record<string, unknown>)?.target;
        const fields = Array.isArray(target) ? target.join(", ") : String(target || "field");
        return createApiError(
          `Duplicate value: ${fields} is already used by another record`,
          409
        );
      }
      case "P2003":
        return createApiError("Related record not found (foreign key constraint)", 400);
      case "P2025":
        return createApiError("Record not found", 404);
      case "P2014":
        return createApiError("Required relation violation", 400);
      default:
        return createApiError(`Database error: ${error.code}`, 500);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return createApiError("Invalid data provided to database", 400);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    logError("Database", "Database connection failed", { message: (error as Error).message });
    return createApiError("Database connection error. Please try again.", 503);
  }

  return null; // Not a Prisma error
}

// ---------------------------------------------------------------------------
// API Route Error Handler Wrapper (HOF)
// ---------------------------------------------------------------------------
type ApiHandler = (
  request: Request,
  context?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      logError("API", error, { url: request.url, method: request.method });

      // Check Zod validation error
      if (error && typeof error === "object" && "issues" in error) {
        return createApiError("Validation failed", 400, error);
      }

      // Check Prisma error
      const prismaResponse = handlePrismaError(error);
      if (prismaResponse) return prismaResponse;

      // Generic error
      return createApiError(
        error instanceof Error ? error.message : "Internal server error",
        500
      );
    }
  };
}

// ---------------------------------------------------------------------------
// Logging service (no console spam in production)
// ---------------------------------------------------------------------------
const LOG_PREFIX = "[ModAPK]";

export function logError(source: string, error: unknown, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    // In production, minimal logging — could send to external service
    console.error(`${LOG_PREFIX}[${source}] Error:`, error instanceof Error ? error.message : String(error));
  } else {
    console.error(`${LOG_PREFIX}[${source}]`, error, context ? { context } : "");
  }
}

export function logWarn(source: string, message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`${LOG_PREFIX}[${source}]`, message, context ? { context } : "");
  }
}

export function logInfo(source: string, message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`${LOG_PREFIX}[${source}]`, message);
  }
}

// ---------------------------------------------------------------------------
// Safe JSON parse
// ---------------------------------------------------------------------------
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Graceful async wrapper — catches all errors, never throws
// ---------------------------------------------------------------------------
export async function safeAsync<T>(
  promise: Promise<T>,
  fallback: T,
  errorSource = "safeAsync"
): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    logError(errorSource, error);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// In-memory TTL cache (for AI response caching, etc.)
// ---------------------------------------------------------------------------
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  // Prevent unbounded cache growth
  if (cacheStore.size > 500) {
    const now = Date.now();
    for (const [k, v] of cacheStore) {
      if (now > v.expiresAt) cacheStore.delete(k);
    }
    // If still too large, clear oldest entries
    if (cacheStore.size > 400) {
      const entries = [...cacheStore.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
      for (let i = 0; i < 100 && i < entries.length; i++) {
        cacheStore.delete(entries[i][0]);
      }
    }
  }
  cacheStore.set(key, { value, expiresAt: Date.now() + ttlMs });
}
