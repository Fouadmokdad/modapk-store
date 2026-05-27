// =============================================================================
// API Endpoint — Import Preview
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importAppMetadataFromUrl } from "@/lib/importers";
import { ImporterProtectedSourceError } from "@/lib/importers/types";
import { db } from "@/lib/db";
import { checkRateLimit, getCachedPreview, setCachedPreview } from "@/lib/importers/security";
import { normalizeDomain } from "@/lib/importers/normalize";
import { getStrategyForDomain } from "@/lib/importers/sourceStrategies";

/**
 * POST /api/import-url/preview — Fetch and parse metadata preview from URL
 * Admin-only access. Rate-limited and cached.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Strict admin authentication check
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. IP Rate Limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const rateLimit = checkRateLimit(ip, 15, 60 * 1000); // 15 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute before making another scraper request." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url, forceGeneric, html } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "Validation Error: A valid URL string starting with http(s) is required." }, { status: 400 });
    }

    const domain = normalizeDomain(url);
    if (!domain) {
      return NextResponse.json({ error: "Validation Error: Invalid URL host domain." }, { status: 400 });
    }

    const strategy = getStrategyForDomain(domain);

    // If BROWSER_ASSISTED and manual HTML not provided, return early!
    if (strategy.mode === "BROWSER_ASSISTED" && !html) {
      return NextResponse.json({
        success: false,
        requiresBrowserAssist: true,
        reason: "ANTI_BOT_PROTECTED",
        message: `This source (${strategy.host}) blocks server scraping and requires browser-assisted extraction.`
      });
    }

    // 3. Consult 5-minute Preview Cache (skip if pasted HTML fallback is used)
    const cached = html ? null : getCachedPreview(url);
    if (cached) {
      // Re-run real-time duplicate checks even on cache hit so the DB state is always accurate
      const duplicates = {
        slug: false,
        packageName: false,
        importedSourceUrl: false,
      };
      let existingAppId: string | null = null;
      let existingAppTitle = "";

      if (cached.slug) {
        const count = await db.app.count({ where: { slug: cached.slug } });
        duplicates.slug = count > 0;
      }

      if (cached.packageName) {
        const existing = await db.app.findUnique({
          where: { packageName: cached.packageName },
          select: { id: true, title: true }
        });
        if (existing) {
          duplicates.packageName = true;
          existingAppId = existing.id;
          existingAppTitle = (existing.title as any)?.en || "";
        }
      }

      const countSourceUrl = await db.app.count({ where: { importedSourceUrl: url } });
      duplicates.importedSourceUrl = countSourceUrl > 0;

      // Clean old alerts from cached warning pile and insert fresh database state alerts
      const freshWarnings = [...cached.warnings.filter(w => !w.includes("Duplicate Alert"))];
      if (duplicates.slug) {
        freshWarnings.push(`Duplicate Alert: An app with slug "${cached.slug}" already exists in the database.`);
      }
      if (duplicates.packageName) {
        freshWarnings.push(`Duplicate Alert: Package name "${cached.packageName}" is registered (associated with existing app "${existingAppTitle}").`);
      }
      if (duplicates.importedSourceUrl) {
        freshWarnings.push(`Duplicate Alert: This source URL has already been imported.`);
      }

      return NextResponse.json({
        data: {
          preview: {
            ...cached,
            warnings: freshWarnings
          },
          duplicates,
          existingAppId,
          existingAppTitle,
          isCached: true
        },
      });
    }

    // 4. Fetch and parse metadata safely (or use pasted HTML code)
    let previewData;
    try {
      previewData = await importAppMetadataFromUrl(url, !!forceGeneric, html);
      if (strategy.mode === "HYBRID" && !html && (!previewData.title || !previewData.title.en || previewData.confidenceScore < 20)) {
        return NextResponse.json({
          success: false,
          requiresBrowserAssist: true,
          reason: "ANTI_BOT_PROTECTED",
          message: `This hybrid source (${strategy.host}) returned an empty extraction and requires browser-assisted extraction.`
        });
      }
    } catch (error: any) {
      if (strategy.mode === "HYBRID" && !html) {
        return NextResponse.json({
          success: false,
          requiresBrowserAssist: true,
          reason: "ANTI_BOT_PROTECTED",
          message: `This hybrid source (${strategy.host}) failed to scrape server-side and requires browser-assisted extraction.`
        });
      }
      throw error;
    }

    // Save to cache on successful fresh scrape (skip if manually pasted)
    if (!html) {
      setCachedPreview(url, previewData);
    }

    // 5. Perform duplicate detection checks
    const duplicates = {
      slug: false,
      packageName: false,
      importedSourceUrl: false,
    };
    let existingAppId: string | null = null;
    let existingAppTitle = "";

    if (previewData.slug) {
      const count = await db.app.count({ where: { slug: previewData.slug } });
      duplicates.slug = count > 0;
    }

    if (previewData.packageName) {
      const existing = await db.app.findUnique({
        where: { packageName: previewData.packageName },
        select: { id: true, title: true }
      });
      if (existing) {
        duplicates.packageName = true;
        existingAppId = existing.id;
        existingAppTitle = (existing.title as any)?.en || "";
      }
    }

    const countSourceUrl = await db.app.count({ where: { importedSourceUrl: url } });
    duplicates.importedSourceUrl = countSourceUrl > 0;

    // Attach duplicate warnings to preview payload
    if (duplicates.slug) {
      previewData.warnings.push(`Duplicate Alert: An app with slug "${previewData.slug}" already exists in the database.`);
    }
    if (duplicates.packageName) {
      previewData.warnings.push(`Duplicate Alert: Package name "${previewData.packageName}" is already registered (associated with existing app "${existingAppTitle}").`);
    }
    if (duplicates.importedSourceUrl) {
      previewData.warnings.push(`Duplicate Alert: This source URL has already been imported.`);
    }

    return NextResponse.json({
      data: {
        preview: previewData,
        duplicates,
        existingAppId,
        existingAppTitle,
        isCached: false
      },
    });

  } catch (error: any) {
    console.error("POST /api/import-url/preview error:", error);

    if (error.name === "ImporterProtectedSourceError" || error instanceof ImporterProtectedSourceError) {
      const sourceCapitalized = error.sourceName 
        ? error.sourceName.charAt(0).toUpperCase() + error.sourceName.slice(1)
        : "Generic Source";
      return NextResponse.json({
        success: false,
        type: "protected_source",
        source: sourceCapitalized,
        statusCode: error.statusCode || 403,
        message: error.reason || "This source blocks automated metadata extraction.",
        suggestion: error.suggestion || "Try another source or import manually."
      });
    }

    return NextResponse.json(
      { error: error.message || "Failed to process import preview." },
      { status: 500 }
    );
  }
}

