// =============================================================================
// Screenshots API — Manage app screenshots
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { screenshotSchema } from "@/lib/validators";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/apps/[id]/screenshots — List screenshots
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const screenshots = await db.screenshot.findMany({
      where: { appId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ data: screenshots });
  } catch (error) {
    console.error("GET /api/apps/[id]/screenshots error:", error);
    return NextResponse.json(
      { error: "Failed to fetch screenshots" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/apps/[id]/screenshots — Add screenshot(s) (admin only)
 * Accepts single screenshot or array of screenshots
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const app = await db.app.findUnique({ where: { id }, select: { id: true } });
    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const body = await request.json();

    // Support both single and batch creation
    const items = Array.isArray(body) ? body : [body];
    const validated = items.map((item) => screenshotSchema.parse(item));

    const screenshots = await db.screenshot.createManyAndReturn({
      data: validated.map((s, index) => ({
        ...s,
        appId: id,
        sortOrder: s.sortOrder ?? index,
      })),
    });

    return NextResponse.json({ data: screenshots }, { status: 201 });
  } catch (error) {
    console.error("POST /api/apps/[id]/screenshots error:", error);
    return NextResponse.json(
      { error: "Failed to add screenshots" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[id]/screenshots — Delete screenshot (admin only)
 * Requires: ?screenshotId=xxx
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const screenshotId = searchParams.get("screenshotId");

    if (!screenshotId) {
      return NextResponse.json(
        { error: "screenshotId is required" },
        { status: 400 }
      );
    }

    const screenshot = await db.screenshot.findFirst({
      where: { id: screenshotId, appId: id },
    });

    if (!screenshot) {
      return NextResponse.json(
        { error: "Screenshot not found" },
        { status: 404 }
      );
    }

    await db.screenshot.delete({ where: { id: screenshotId } });

    return NextResponse.json({ data: { message: "Screenshot deleted" } });
  } catch (error) {
    console.error("DELETE /api/apps/[id]/screenshots error:", error);
    return NextResponse.json(
      { error: "Failed to delete screenshot" },
      { status: 500 }
    );
  }
}
