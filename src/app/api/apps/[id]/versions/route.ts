// =============================================================================
// App Versions API — List + Create
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appVersionSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/apps/[id]/versions — List versions (public for published, admin for all)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const app = await db.app.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!app) {
      console.warn(`[GET App Versions] App not found with identifier: ${id}`);
      return NextResponse.json({ data: [] });
    }

    try {
      const versions = await db.appVersion.findMany({
        where: { appId: app.id },
        orderBy: { createdAt: "desc" },
        include: {
          downloadLinks: { orderBy: { sortOrder: "asc" } },
          downloadMirrors: { orderBy: { priority: "desc" } },
        },
      });

      return NextResponse.json({ data: versions || [] });
    } catch (dbError) {
      console.error("[GET App Versions] Database query failed:", dbError);
      // Return empty array instead of 500 when database/schema issues occur
      return NextResponse.json({ data: [], error: "Database error fetching versions" });
    }
  } catch (error) {
    console.error("GET /api/apps/[id]/versions general error:", error);
    return NextResponse.json({ data: [], error: "Failed to fetch versions" });
  }
}

import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";

/**
 * POST /api/apps/[id]/versions — Add version (admin only)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:versions")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const app = await db.app.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = appVersionSchema.parse(body);

    // If this version is marked as latest, unmark all others
    if (validated.isLatest) {
      await db.appVersion.updateMany({
        where: { appId: app.id },
        data: { isLatest: false },
      });
    }

    // Map new fields to legacy fields for backward compatibility
    const size = validated.size || validated.apkSize;
    const minAndroid = validated.minAndroid || validated.androidRequirement;

    const version = await db.appVersion.create({
      data: {
        appId: app.id,
        versionName: validated.versionName,
        versionCode: validated.versionCode,
        apkSize: validated.apkSize,
        androidRequirement: validated.androidRequirement,
        size,
        minAndroid,
        changelog: validated.changelog as any,
        modInfo: validated.modInfo as any,
        isLatest: validated.isLatest,
        releasedAt: validated.releasedAt ? new Date(validated.releasedAt) : null,
      },
      include: {
        downloadLinks: true,
        downloadMirrors: true,
      },
    });

    // Log version creation
    await logActivity(
      session.user.id,
      "VERSION_CREATE",
      `Added app version ${version.versionName} to app ID: ${app.id}`,
      request
    );

    return NextResponse.json({ data: version }, { status: 201 });
  } catch (error) {
    console.error("POST /api/apps/[id]/versions error:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 }
    );
  }
}
