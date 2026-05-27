// =============================================================================
// Download Mirrors API — List + Create
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { downloadMirrorSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string; versionId: string }>;
}

/**
 * GET /api/apps/[id]/versions/[versionId]/mirrors — List mirrors for version
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: appIdOrSlug, versionId } = await params;

    const app = await db.app.findFirst({
      where: {
        OR: [{ id: appIdOrSlug }, { slug: appIdOrSlug }],
      },
      select: { id: true },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const version = await db.appVersion.findUnique({
      where: { id: versionId },
      select: { appId: true },
    });

    if (!version || version.appId !== app.id) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const mirrors = await db.downloadMirror.findMany({
      where: { versionId },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json({ data: mirrors });
  } catch (error) {
    console.error("GET /api/apps/[id]/versions/[versionId]/mirrors error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mirrors" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apps/[id]/versions/[versionId]/mirrors — Create mirror
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const version = await db.appVersion.findUnique({
      where: { id: versionId },
      select: { appId: true },
    });

    if (!version || version.appId !== app.id) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = downloadMirrorSchema.parse(body);

    const mirror = await db.downloadMirror.create({
      data: {
        versionId,
        hostName: validated.hostName,
        downloadUrl: validated.downloadUrl,
        redirectEnabled: validated.redirectEnabled,
        priority: validated.priority,
        healthStatus: validated.healthStatus,
        // Legacy fields mapping for backward compatibility:
        appId: app.id,
        host: validated.hostName,
        url: validated.downloadUrl,
        health: validated.healthStatus,
      },
    });

    return NextResponse.json({ data: mirror }, { status: 201 });
  } catch (error) {
    console.error("POST /api/apps/[id]/versions/[versionId]/mirrors error:", error);
    return NextResponse.json(
      { error: "Failed to create mirror" },
      { status: 500 }
    );
  }
}
