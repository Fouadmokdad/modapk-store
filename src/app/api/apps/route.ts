// =============================================================================
// Apps API — List (public GET) + Create (admin POST)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { appSchema, searchSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { createApiResponse, createApiError, handlePrismaError } from "@/lib/error-utils";

/**
 * GET /api/apps — List published apps (public) or all apps (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getServerSession(authOptions);
    const isAdmin = !!session;

    const params = searchSchema.parse({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 20,
      sort: searchParams.get("sort") || "createdAt",
      order: searchParams.get("order") || "desc",
      q: searchParams.get("q") || undefined,
      type: searchParams.get("type") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      status: searchParams.get("status") || undefined,
      tagId: searchParams.get("tagId") || undefined,
    });

    const skip = (params.page - 1) * params.limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Public users only see published apps
    if (!isAdmin) {
      where.status = "PUBLISHED";
    } else if (params.status) {
      where.status = params.status;
    }

    if (params.type) where.type = params.type;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.tagId) {
      where.tags = { some: { tagId: params.tagId } };
    }

    // Search by title or packageName
    if (params.q) {
      where.OR = [
        { slug: { contains: params.q.toLowerCase() } },
        { packageName: { contains: params.q, mode: "insensitive" } },
        { developer: { contains: params.q, mode: "insensitive" } },
      ];
    }

    // Build orderBy
    const validSortFields = [
      "createdAt", "updatedAt", "publishedAt", "downloadCount", "viewCount", "trending",
    ];
    const sortField = validSortFields.includes(params.sort) ? params.sort : "createdAt";
    let orderBy: any = { [sortField]: params.order };

    if (params.sort === "trending") {
      const { getWeightedTrendingApps } = await import("@/lib/discovery");
      const trendingPool = await getWeightedTrendingApps(150, params.type as "APP" | "GAME" | undefined);
      
      // Filter by category or search query if provided in pool
      let filtered = trendingPool;
      if (params.categoryId) {
        filtered = filtered.filter((app) => app.category?.id === params.categoryId);
      }
      if (params.q) {
        const query = params.q.toLowerCase();
        filtered = filtered.filter(
          (app) =>
            app.slug.includes(query) ||
            (app.developer && app.developer.toLowerCase().includes(query))
        );
      }

      const total = filtered.length;
      const skip = (params.page - 1) * params.limit;
      const apps = filtered.slice(skip, skip + params.limit).map(app => ({
        ...app,
        _count: { tags: 0, versions: 1 }
      }));

      return createApiResponse(apps, 200, {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      });
    }

    const isCachedField = ["createdAt", "updatedAt", "rating", "downloadCount"].includes(params.sort);
    if (!isAdmin && !params.q && !params.tagId && !params.categoryId && isCachedField) {
      const { getDiscoveryList } = await import("@/lib/discovery");
      const list = await getDiscoveryList(
        params.sort as any,
        120, // Decent cached size pool
        params.type as any
      );
      
      const total = list.length;
      const skip = (params.page - 1) * params.limit;
      const apps = list.slice(skip, skip + params.limit).map(app => ({
        ...app,
        _count: { tags: 0, versions: 1 }
      }));

      return createApiResponse(apps, 200, {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      });
    }

    const [apps, total] = await Promise.all([
      db.app.findMany({
        where,
        orderBy,
        skip,
        take: params.limit,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          versions: {
            where: { isLatest: true },
            take: 1,
            select: { versionName: true },
          },
          _count: { select: { tags: true, versions: true } },
        },
      }),
      db.app.count({ where }),
    ]);

    return createApiResponse(apps, 200, {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    });
  } catch (error: any) {
    console.error("GET /api/apps error:", error);
    const prismaResponse = handlePrismaError(error);
    if (prismaResponse) return prismaResponse;
    if (error && typeof error === "object" && "issues" in error) {
      return createApiError("Validation failed", 400, error.issues);
    }
    return createApiError("Failed to fetch apps", 500);
  }
}

import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";

/**
 * POST /api/apps — Create a new app (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "create:apps")) {
      return createApiError("Unauthorized", 401);
    }

    const body = await request.json();
    const validated = appSchema.parse(body);

    // Check slug uniqueness
    const existing = await db.app.findUnique({
      where: { slug: validated.slug },
    });
    if (existing) {
      return createApiError("An app with this slug already exists", 409);
    }

    // 8. Logging: debug details
    console.log("[DEBUG APP CREATE] incoming packageName:", body.packageName);
    console.log("[DEBUG APP CREATE] mode: CREATE");

    // Check package name uniqueness (excluding null/empty)
    if (validated.packageName && validated.packageName.trim() !== "") {
      const existingPkg = await db.app.findFirst({
        where: { packageName: validated.packageName.trim() },
      });
      if (existingPkg) {
        console.log("[DEBUG APP CREATE] Duplicate packageName found: rejecting with 409");
        return createApiError("Package name already exists", 409);
      }
    }

    // Extract tagIds and categoryId before creating
    const { tagIds, categoryId, ...appData } = validated;

    const app = await db.app.create({
      data: {
        ...appData,
        publishedAt: validated.status === "PUBLISHED" ? new Date() : null,
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        ...(tagIds?.length
          ? { tags: { create: tagIds.map((tagId: string) => ({ tagId })) } }
          : {}),
      } as Parameters<typeof db.app.create>[0]["data"],
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    // Log the app creation action
    const appTitleStr = typeof app.title === "object" && app.title !== null ? (app.title as any).en || (app.title as any).ar || "" : "";
    await logActivity(
      session.user.id,
      "APP_CREATE",
      `Created app: ${appTitleStr} (slug: ${app.slug})`,
      request
    );

    // Queue Telegram post if published
    if (app.status === "PUBLISHED") {
      const { queueTelegramPost } = await import("@/lib/telegram/telegramQueue");
      queueTelegramPost(app.id).catch((err) => {
        console.error("[AppsAPI] Error triggering Telegram post:", err);
      });
    }

    return createApiResponse(app, 201);
  } catch (error) {
    console.error("POST /api/apps error:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return createApiError("Package name already exists", 409);
    }

    const prismaResponse = handlePrismaError(error);
    if (prismaResponse) return prismaResponse;

    if (error && typeof error === "object" && "issues" in error) {
      return createApiError("Validation failed", 400, error);
    }

    return createApiError("Failed to create app", 500);
  }
}
