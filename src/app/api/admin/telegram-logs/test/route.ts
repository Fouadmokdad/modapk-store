// =============================================================================
// Telegram Test API — Validate Bot Token & Chat ID (admin only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { testTelegramConnection } from "@/lib/telegram/telegram.service";

/**
 * POST /api/admin/telegram-logs/test — Test telegram bot connection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { botToken, chatId } = await request.json();

    if (!botToken || !chatId) {
      return NextResponse.json(
        { error: "Bot Token and Chat ID are required" },
        { status: 400 }
      );
    }

    // Call service test connection
    await testTelegramConnection(botToken, chatId);

    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (error: any) {
    console.error("POST /api/admin/telegram-logs/test error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to Telegram" },
      { status: 500 }
    );
  }
}
