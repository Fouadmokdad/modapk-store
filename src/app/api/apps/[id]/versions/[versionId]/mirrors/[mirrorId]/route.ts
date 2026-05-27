// =============================================================================
// Single Download Mirror API — PUT, DELETE
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadMirrorSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string; versionId: string; mirrorId: string }>;
}

/**
 * PUT /api/apps/[id]/versions/[versionId]/mirrors/[mirrorId] — Update mirror (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: appId, versionId, mirrorId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.downloadMirror.findUnique({
      where: { id: mirrorId },
    });

    if (!existing || existing.versionId !== versionId) {
      return NextResponse.json({ error: "Mirror not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = downloadMirrorSchema.parse(body);

    const mirror = await db.downloadMirror.update({
      where: { id: mirrorId },
      data: {
        hostName: validated.hostName,
        downloadUrl: validated.downloadUrl,
        redirectEnabled: validated.redirectEnabled,
        priority: validated.priority,
        healthStatus: validated.healthStatus,
        // Legacy fields:
        host: validated.hostName,
        url: validated.downloadUrl,
        health: validated.healthStatus,
      },
    });

    return NextResponse.json({ data: mirror });
  } catch (error) {
    console.error("PUT /api/apps/[id]/versions/[versionId]/mirrors/[mirrorId] error:", error);
    return NextResponse.json(
      { error: "Failed to update mirror" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[id]/versions/[versionId]/mirrors/[mirrorId] — Delete mirror (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: appId, versionId, mirrorId } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.downloadMirror.findUnique({
      where: { id: mirrorId },
    });

    if (!existing || existing.versionId !== versionId) {
      return NextResponse.json({ error: "Mirror not found" }, { status: 404 });
    }

    await db.downloadMirror.delete({
      where: { id: mirrorId },
    });

    return NextResponse.json({ data: { message: "Mirror deleted successfully" } });
  } catch (error) {
    console.error("DELETE /api/apps/[id]/versions/[versionId]/mirrors/[mirrorId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete mirror" },
      { status: 500 }
    );
  }
}
