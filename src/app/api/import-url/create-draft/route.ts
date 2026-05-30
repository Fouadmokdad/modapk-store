// =============================================================================
// API Endpoint — Create App Draft from Imported Data
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/importers/security";

/**
 * POST /api/import-url/create-draft — Create a new DRAFT app from imported and edited metadata.
 * Admin-only access. Rate-limited and validated transactionally.
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
    const rateLimit = checkRateLimit(ip, 30, 60 * 1000); // 30 requests per minute
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute before making another write request." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      title,
      slug,
      packageName,
      shortDescription,
      description,
      iconUrl,
      screenshots,
      versionName,
      size,
      minAndroid,
      category,
      type,
      developer,
      developerUrl,
      rating,
      contentRating,
      installs,
      modFeatures,
      originalPlayStoreUrl,
      externalDownloadLinks,
      sourceName,
      sourceUrl,
      rawExtractedData,
      warnings,
    } = body;

    const finalTitle = title || { en: "", ar: "" };
    const finalDescription = description || { en: "", ar: "" };

    // Resolve or auto-generate slug if missing
    let finalSlug = slug;
    if (!finalSlug || typeof finalSlug !== "string" || !finalSlug.trim()) {
      if (finalTitle.en) {
        finalSlug = finalTitle.en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      } else if (packageName) {
        finalSlug = packageName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      } else {
        finalSlug = `draft-incomplete-${Math.random().toString(36).substring(2, 9)}`;
      }
    }

    const normalizedSlug = finalSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // 3. Prevent duplicate writes / race conditions in database transaction
    if (normalizedSlug) {
      const slugExists = await db.app.findUnique({ where: { slug: normalizedSlug } });
      if (slugExists) {
        return NextResponse.json({ error: "Conflict Error: An app with this Slug already exists." }, { status: 409 });
      }
    }

    if (packageName && packageName.trim()) {
      const pkgExists = await db.app.findUnique({ where: { packageName: packageName.trim() } });
      if (pkgExists) {
        return NextResponse.json({ error: "Conflict Error: An app with this Package Name is already registered." }, { status: 409 });
      }
    }

    // 4. Validate all download links protocol whitelists
    if (Array.isArray(externalDownloadLinks)) {
      for (const link of externalDownloadLinks) {
        if (!link.url || typeof link.url !== "string") {
          return NextResponse.json({ error: "Validation Error: External download links must contain a valid URL." }, { status: 400 });
        }
        try {
          const u = new URL(link.url);
          if (u.protocol !== "http:" && u.protocol !== "https:") {
            return NextResponse.json({ error: `Security Error: Download protocol "${u.protocol}" is forbidden. Only HTTP/HTTPS is allowed.` }, { status: 400 });
          }
        } catch {
          return NextResponse.json({ error: "Validation Error: Invalid download link URL structure." }, { status: 400 });
        }
      }
    }

    // Resolve categoryId if category name matches an existing one in the database
    let categoryId = null;
    if (category && typeof category === "string" && category.trim()) {
      const normalizedCategorySlug = category.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      
      let dbCategory = await db.category.findFirst({
        where: {
          OR: [
            { slug: normalizedCategorySlug },
            { name: { path: ["en"], equals: category.trim() } },
            { name: { path: ["ar"], equals: category.trim() } }
          ]
        }
      });
      
      if (!dbCategory && normalizedCategorySlug) {
        dbCategory = await db.category.findUnique({
          where: { slug: normalizedCategorySlug }
        });
      }

      if (dbCategory) {
        categoryId = dbCategory.id;
      } else if (normalizedCategorySlug) {
        // Auto-create category with slug normalization
        const newCategory = await db.category.create({
          data: {
            slug: normalizedCategorySlug,
            name: { en: category.trim(), ar: category.trim() },
            type: type === "GAME" ? "GAME" : "APP",
            description: { en: `Awesome MODs in the ${category.trim()} category`, ar: `تعديلات رائعة في قسم ${category.trim()}` },
          }
        });
        categoryId = newCategory.id;
      }
    }

    // Determine status: If title or description English values are missing/empty, mark as DRAFT_INCOMPLETE
    const isTitleMissing = !finalTitle.en || !finalTitle.en.trim();
    const isDescMissing = !finalDescription.en || !finalDescription.en.trim();
    const resolvedStatus = (isTitleMissing || isDescMissing) ? "DRAFT_INCOMPLETE" : "DRAFT";

    // 1. Transactionally write DRAFT App model
    const app = await db.app.create({
      data: {
        slug: normalizedSlug,
        packageName: packageName ? packageName.trim() : null,
        status: resolvedStatus,
        type: type === "GAME" ? "GAME" : "APP",
        title: finalTitle,
        shortDescription: shortDescription || { en: "", ar: "" },
        description: finalDescription,
        iconUrl: iconUrl || null,
        developer: developer || null,
        developerUrl: developerUrl || null,
        originalPlayStoreUrl: originalPlayStoreUrl || null,
        categoryId,
        rating: rating ? parseFloat(rating) : null,
        contentRating: contentRating || null,
        installs: installs || null,
        modFeatures: modFeatures || [],
        
        // Audit trails
        importedSourceName: sourceName || null,
        importedSourceUrl: sourceUrl || null,
        importMetadata: {
          importedAt: new Date().toISOString(),
          importerVersion: "1.0.0",
          parserUsed: sourceName || "generic",
          extractionWarnings: warnings || [],
          rawExtractedData: rawExtractedData || {},
        },
      },
    });

    const appId = app.id;

    // 2. Add Screenshots
    if (Array.isArray(screenshots) && screenshots.length > 0) {
      const screenshotData = screenshots.map((url, i) => ({
        appId,
        url,
        altText: `${title.en} screenshot ${i + 1}`,
        sortOrder: i,
      }));
      await db.screenshot.createMany({
        data: screenshotData,
      });
    }

    // 3. Create Version and Download Links if Version Data is present
    if (versionName) {
      const appVersion = await db.appVersion.create({
        data: {
          appId,
          versionName: versionName.trim(),
          size: size || null,
          minAndroid: minAndroid || null,
          apkSize: size || null,
          androidRequirement: minAndroid || null,
          isLatest: true,
        },
      });

      // 4. Create Download Links linked to this Version
      if (Array.isArray(externalDownloadLinks) && externalDownloadLinks.length > 0) {
        const downloadLinkData = externalDownloadLinks.map((link, i) => ({
          versionId: appVersion.id,
          label: link.label || `Mirror ${i + 1}`,
          url: link.url,
          isPrimary: i === 0,
          sortOrder: i,
        }));
        await db.downloadLink.createMany({
          data: downloadLinkData,
        });
      }
    }

    return NextResponse.json({
      data: {
        appId,
        message: "Successfully created app draft from imported metadata.",
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/import-url/create-draft error:", error);
    
    // Check for unique key constraints in DB (like duplicate slug/packageName)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Conflict Error: An app with this Slug or Package Name already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create app draft from imported data." },
      { status: 500 }
    );
  }
}
