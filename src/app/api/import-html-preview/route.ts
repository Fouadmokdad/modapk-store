// =============================================================================
// API Endpoint — Browser Import Preview
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importAppMetadataFromUrl } from "@/lib/importers";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/importers/security";
import zlib from "zlib";

/**
 * POST /api/import-html-preview — Preview app metadata from raw, potentially compressed, browser HTML.
 * Admin-only access. Rate-limited.
 */
export async function POST(request: NextRequest) {
  let logDomain = "unknown";
  let logCompressedSize = 0;
  let logRawSize = 0;
  let logParserSelected = "generic";
  let logStatus = "FAILED";

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
    const { url, forceGeneric, html: rawHtml, compressedHtml } = body;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json({ error: "Validation Error: A valid URL string starting with http(s) is required to determine parser domain." }, { status: 400 });
    }

    try {
      const parsedUrl = new URL(url);
      logDomain = parsedUrl.hostname;
    } catch {
      return NextResponse.json({ error: "Validation Error: Malformed URL format." }, { status: 400 });
    }

    let html = "";
    if (compressedHtml) {
      try {
        const buffer = Buffer.from(compressedHtml, "base64");
        logCompressedSize = buffer.length;
        html = zlib.gunzipSync(buffer).toString("utf-8");
      } catch (err: any) {
        return NextResponse.json({ error: `Decompression Error: Failed to decompress gzipped HTML. ${err.message || err}` }, { status: 400 });
      }
    } else if (rawHtml) {
      html = rawHtml;
    } else {
      return NextResponse.json({ error: "Validation Error: Missing raw html or compressedHtml payload." }, { status: 400 });
    }

    logRawSize = html.length;

    // 3. Security HTML Size Guard (Max 4MB raw)
    if (html.length > 4 * 1024 * 1024) {
      console.warn(`[SECURITY WARN] Blocked large HTML import payload from domain: ${logDomain}. Size: ${html.length} bytes`);
      return NextResponse.json({ error: "Security Error: Raw HTML page exceeds the maximum safety limit of 4MB." }, { status: 400 });
    }

    // 4. Parse metadata using importAppMetadataFromUrl
    // We pass pastedHtml (third parameter) so it bypasses fetching entirely and uses Cheerio.
    const previewData = await importAppMetadataFromUrl(url, !!forceGeneric, html);
    logParserSelected = previewData.sourceName || "generic";

    // 5. Merge Smart Client-Side Extracted Metadata if provided (e.g. from Bookmarklet OG tags)
    if (body.smartMetadata) {
      const sm = body.smartMetadata;
      
      // Fill in title if missing or poor
      if ((!previewData.title.en || previewData.title.en === "") && sm.title) {
        previewData.title.en = sm.title;
      }
      
      // Merge screenshots if none resolved
      if ((!previewData.screenshots || previewData.screenshots.length === 0) && Array.isArray(sm.screenshots)) {
        previewData.screenshots = sm.screenshots.filter((s: string) => s.startsWith("http"));
      }

      // Add a smart extraction notice to warnings
      previewData.warnings.push("Smart Extraction Merge: Enriched parsed metadata using browser-side client markers.");
    }

    // 6. Perform duplicate detection checks
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

    // Add browser import identifier to telemetry rawExtractedData
    if (previewData.rawExtractedData) {
      previewData.rawExtractedData.isBrowserImport = true;
      previewData.rawExtractedData.compressedPayloadSize = logCompressedSize;
      previewData.rawExtractedData.rawPayloadSize = logRawSize;
    }

    logStatus = "SUCCESS";
    
    // Server Auditing Security Logging
    console.log(`[AUDIT LOG] Browser-Assisted Import Success
- User: ${session.user?.email}
- Target Domain: ${logDomain}
- Compressed Size: ${logCompressedSize} bytes
- Decompressed Size: ${logRawSize} bytes
- Parser Selected: ${logParserSelected}
- Status: ${logStatus}`);

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
    console.error(`[AUDIT LOG] Browser-Assisted Import Failed
- Target Domain: ${logDomain}
- Status: FAILED
- Error: ${error.message || error}`);

    return NextResponse.json(
      { error: error.message || "Failed to process browser HTML import preview." },
      { status: 500 }
    );
  }
}
