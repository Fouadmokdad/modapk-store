// =============================================================================
// Security Logs API — Activity audit trail (SUPER_ADMIN and ADMIN only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

/**
 * GET /api/admin/activity-logs — List activity logs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN and ADMIN roles can access logs
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("q") || undefined;

    const skip = (page - 1) * limit;

    // Build filter query
    const where: any = {};
    if (action) {
      where.action = action;
    }

    if (search) {
      where.OR = [
        { details: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        {
          admin: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      db.adminActivityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              name: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      db.adminActivityLog.count({ where }),
    ]);

    return NextResponse.json({
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/activity-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch security logs" },
      { status: 500 }
    );
  }
}
