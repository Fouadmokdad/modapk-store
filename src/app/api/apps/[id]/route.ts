// =============================================================================
// Single App API — GET, PUT, DELETE, PATCH
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appSchema, appStatusSchema } from "@/lib/validators";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/apps/[id] — Get single app (public for published, admin for all)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const isAdmin = !!session;

    const app = await db.app.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        ...(!isAdmin ? { status: "PUBLISHED" } : {}),
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
        versions: {
          orderBy: { createdAt: "desc" },
          include: {
            downloadLinks: { orderBy: { sortOrder: "asc" } },
            downloadMirrors: { orderBy: { priority: "desc" } },
          },
        },
        screenshots: { orderBy: { sortOrder: "asc" } },
        downloadMirrors: {
          orderBy: { lastCheckedAt: "desc" },
        },
      },
    });

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    return NextResponse.json({ data: app });
  } catch (error) {
    console.error("GET /api/apps/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch app" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/apps/[id] — Update app (admin only)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "edit:apps")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.app.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = appSchema.parse(body);

    // Check slug uniqueness (excluding self)
    if (validated.slug !== existing.slug) {
      const slugExists = await db.app.findUnique({
        where: { slug: validated.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "This slug is already in use" },
          { status: 409 }
        );
      }
    }

    const { tagIds, categoryId, releaseType, ...appData } = validated;

    // Determine publishedAt
    let publishedAt = existing.publishedAt;
    if (validated.status === "PUBLISHED" && !existing.publishedAt) {
      publishedAt = new Date();
    } else if (validated.status !== "PUBLISHED") {
      publishedAt = null;
    }

    const app = await db.app.update({
      where: { id },
      data: {
        ...appData,
        releaseType: validated.releaseType,
        publishedAt,
        ...(categoryId !== undefined
          ? categoryId
            ? { category: { connect: { id: categoryId } } }
            : { category: { disconnect: true } }
          : {}),
        tags: {
          deleteMany: {},
          create: tagIds?.map((tagId: string) => ({ tagId })) || [],
        },
      } as Parameters<typeof db.app.update>[0]["data"],
      include: {
        category: true,
        tags: { include: { tag: true } },
        versions: {
          orderBy: { createdAt: "desc" },
          include: { downloadLinks: true },
        },
        screenshots: { orderBy: { sortOrder: "asc" } },
      },
    });

    // Log the app edit action
    const appTitleStr = typeof app.title === "object" && app.title !== null ? (app.title as any).en || (app.title as any).ar || "" : "";
    await logActivity(
      session.user.id,
      "APP_EDIT",
      `Updated app: ${appTitleStr} (slug: ${app.slug})`,
      request
    );

    return NextResponse.json({ data: app });
  } catch (error) {
    console.error('UPDATE_APP_ERROR', error);

    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { 
          success: false,
          error: "Validation failed", 
          details: error,
          message: "Validation failed"
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update app' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/apps/[id] — Update status only (admin)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "edit:apps")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = appStatusSchema.parse(body);

    const existing = await db.app.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    const app = await db.app.update({
      where: { id },
      data: {
        status,
        publishedAt:
          status === "PUBLISHED" && !existing.publishedAt
            ? new Date()
            : status !== "PUBLISHED"
              ? null
              : existing.publishedAt,
      },
    });

    // Log status edit action
    await logActivity(
      session.user.id,
      "APP_EDIT",
      `Changed status of app: ${app.slug} to ${app.status}`,
      request
    );

    return NextResponse.json({ data: app });
  } catch (error) {
    console.error("PATCH /api/apps/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/apps/[id] — Delete app (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "delete:apps")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.app.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    await db.app.delete({ where: { id } });

    // Log deletion action
    await logActivity(
      session.user.id,
      "APP_DELETE",
      `Deleted app: ${existing.slug} (ID: ${existing.id})`,
      request
    );

    return NextResponse.json({ data: { message: "App deleted successfully" } });
  } catch (error) {
    console.error("DELETE /api/apps/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete app" },
      { status: 500 }
    );
  }
}
