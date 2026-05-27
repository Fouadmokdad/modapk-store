// =============================================================================
// Download Links API — Manage external download links for a version
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadLinkSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/apps/[id]/links — List all download links across all versions
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const versions = await db.appVersion.findMany({
      where: { appId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        versionName: true,
        isLatest: true,
        downloadLinks: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: versions });
  } catch (error) {
    console.error("GET /api/apps/[id]/links error:", error);
    return NextResponse.json(
      { error: "Failed to fetch download links" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apps/[id]/links — Add download link (admin only)
 * Requires: versionId in body
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { versionId, ...linkData } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: "versionId is required" },
        { status: 400 }
      );
    }

    // Verify version belongs to this app
    const version = await db.appVersion.findFirst({
      where: { id: versionId, appId: id },
    });
    if (!version) {
      return NextResponse.json(
        { error: "Version not found for this app" },
        { status: 404 }
      );
    }

    const validated = downloadLinkSchema.parse(linkData);

    // If this link is primary, unmark others in same version
    if (validated.isPrimary) {
      await db.downloadLink.updateMany({
        where: { versionId },
        data: { isPrimary: false },
      });
    }

    const link = await db.downloadLink.create({
      data: {
        ...validated,
        versionId,
      },
    });

    return NextResponse.json({ data: link }, { status: 201 });
  } catch (error) {
    console.error("POST /api/apps/[id]/links error:", error);
    return NextResponse.json(
      { error: "Failed to create download link" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[id]/links — Delete download link (admin only)
 * Requires: ?linkId=xxx
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    // Verify the link belongs to a version of this app
    const link = await db.downloadLink.findFirst({
      where: {
        id: linkId,
        version: { appId: id },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await db.downloadLink.delete({ where: { id: linkId } });

    return NextResponse.json({ data: { message: "Link deleted" } });
  } catch (error) {
    console.error("DELETE /api/apps/[id]/links error:", error);
    return NextResponse.json(
      { error: "Failed to delete link" },
      { status: 500 }
    );
  }
}
