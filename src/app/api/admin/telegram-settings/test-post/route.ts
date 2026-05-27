// =============================================================================
// Telegram Test Post API — Send Live Test Post from Preview Settings (admin only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { sendTelegramMessage } from "@/lib/telegram/telegram.service";
import { renderTelegramTemplate, generateTelegramButtons } from "@/lib/telegram/telegramTemplates";
import { getSiteSettings } from "@/lib/settings";

/**
 * POST /api/admin/telegram-settings/test-post — Dispatch a live preview post to Telegram
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings, appData } = await request.json();

    if (!settings || !appData) {
      return NextResponse.json(
        { error: "Settings and App Data are required" },
        { status: 400 }
      );
    }

    // Render message body
    const text = renderTelegramTemplate(appData, settings);

    // Build keyboard buttons
    const reply_markup = generateTelegramButtons(appData.slug, settings);

    // Get global site settings to determine if image is enabled
    const globalSettings = await getSiteSettings();
    const photoUrl = globalSettings.telegramIncludeImage
      ? (appData.iconUrl || appData.headerImageUrl || null)
      : null;

    // Send the post to Telegram
    const response = await sendTelegramMessage({
      text,
      photoUrl,
      reply_markup,
    });

    return NextResponse.json({
      success: true,
      message: "Test post sent successfully!",
      telegramResponse: response,
    });
  } catch (error: any) {
    console.error("POST /api/admin/telegram-settings/test-post error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to dispatch test post to Telegram" },
      { status: 500 }
    );
  }
}
