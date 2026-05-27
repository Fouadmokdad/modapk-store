// =============================================================================
// Telegram Logs API — Retrieve & Manage Posting Logs (admin only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";

/**
 * GET /api/admin/telegram-logs — Get list of logs (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      db.telegramLog.findMany({
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.telegramLog.count(),
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
    console.error("GET /api/admin/telegram-logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/telegram-logs — Delete a specific log
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const log = await db.telegramLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    await db.telegramLog.delete({ where: { id } });

    // Log admin activity
    await logActivity(
      session.user.id,
      "SETTING_CHANGE",
      `Deleted Telegram post log for: ${log.appName} (ID: ${log.id})`,
      request
    );

    return NextResponse.json({ success: true, message: "Log deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/telegram-logs error:", error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 }
    );
  }
}
