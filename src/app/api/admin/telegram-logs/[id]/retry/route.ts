// =============================================================================
// Telegram Retry API — Trigger manual retry for a failed post (admin only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { addJobToQueue } from "@/lib/queue/backgroundJobQueue";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/telegram-logs/[id]/retry — Trigger a retry for a post log
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const log = await db.telegramLog.findUnique({ where: { id } });
    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    // Reset log for retry
    await db.telegramLog.update({
      where: { id },
      data: {
        status: "PENDING",
        retryCount: 0,
        errorDetails: null,
      },
    });

    // Re-queue the post job
    await addJobToQueue("telegramQueue", "telegramPost", { logId: id });

    return NextResponse.json({
      success: true,
      message: `Telegram post for "${log.appName}" has been queued for retry.`,
    });
  } catch (error: any) {
    console.error("POST /api/admin/telegram-logs/[id]/retry error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to trigger retry" },
      { status: 500 }
    );
  }
}
