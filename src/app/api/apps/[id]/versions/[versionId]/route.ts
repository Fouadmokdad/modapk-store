// =============================================================================
// Single App Version API — PUT, DELETE
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appVersionSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

/**
 * PUT /api/apps/[id]/versions/[versionId] — Update version (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: appIdOrSlug, versionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const app = await db.app.findFirst({
      where: {
        OR: [{ id: appIdOrSlug }, { slug: appIdOrSlug }],
      },
      select: { id: true },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const existing = await db.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing || existing.appId !== app.id) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = appVersionSchema.parse(body);

    // If marked as latest, unmark all other versions of this app
    if (validated.isLatest && !existing.isLatest) {
      await db.appVersion.updateMany({
        where: { appId: app.id },
        data: { isLatest: false },
      });
    }

    // Map new fields to legacy fields for backward compatibility
    const size = validated.size || validated.apkSize;
    const minAndroid = validated.minAndroid || validated.androidRequirement;

    const version = await db.appVersion.update({
      where: { id: versionId },
      data: {
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

    return NextResponse.json({ data: version });
  } catch (error) {
    console.error("PUT /api/apps/[id]/versions/[versionId] error:", error);
    return NextResponse.json(
      { error: "Failed to update version" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[id]/versions/[versionId] — Delete version (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: appIdOrSlug, versionId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const app = await db.app.findFirst({
      where: {
        OR: [{ id: appIdOrSlug }, { slug: appIdOrSlug }],
      },
      select: { id: true },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const existing = await db.appVersion.findUnique({
      where: { id: versionId },
    });

    if (!existing || existing.appId !== app.id) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    await db.appVersion.delete({
      where: { id: versionId },
    });

    return NextResponse.json({ data: { message: "Version deleted successfully" } });
  } catch (error) {
    console.error("DELETE /api/apps/[id]/versions/[versionId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete version" },
      { status: 500 }
    );
  }
}
