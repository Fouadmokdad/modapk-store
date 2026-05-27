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
import { db } from "@/lib/db";

/**
 * POST /api/admin/telegram-settings/test-post — Dispatch a live preview post to Telegram
 */
export async function POST(request: NextRequest) {
  let appTitle = "Unknown";
  let versionName: string | null = null;
  let text = "";
  let photoUrl: string | null = null;
  let reply_markup: any = null;

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

    appTitle = appData.appTitleEn || "Unknown";
    versionName = appData.versionName || null;

    // Get site settings first so they can be used for button siteUrl resolving
    const globalSettings = await getSiteSettings();

    // Render message body & buttons inside try/catch to log details if it fails
    try {
      text = renderTelegramTemplate(appData, settings);
      
      reply_markup = generateTelegramButtons(appData.slug, {
        ...settings,
        siteUrl: globalSettings.siteUrl,
      });

      photoUrl = globalSettings.telegramIncludeImage
        ? (appData.iconUrl || appData.headerImageUrl || null)
        : null;
    } catch (renderErr: any) {
      throw new Error(`Template rendering failed: ${renderErr.message}`);
    }

    // Send the post to Telegram
    let response;
    try {
      response = await sendTelegramMessage({
        text,
        photoUrl,
        reply_markup,
      });
    } catch (sendErr: any) {
      throw new Error(`Telegram sending failed: ${sendErr.message}`);
    }

    // Create a successful log
    await db.telegramLog.create({
      data: {
        appId: null,
        appName: `${appTitle} [TEST]`,
        versionName,
        status: "POSTED",
        retryCount: 1,
        payload: {
          text,
          photoUrl,
          reply_markup,
        } as any,
        telegramResponse: response as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Test post sent successfully!",
      telegramResponse: response,
    });
  } catch (error: any) {
    console.error("POST /api/admin/telegram-settings/test-post error:", error);
    
    // Create a failed log
    try {
      await db.telegramLog.create({
        data: {
          appId: null,
          appName: `${appTitle} [TEST]`,
          versionName,
          status: "FAILED",
          retryCount: 1,
          payload: {
            text: text || "",
            photoUrl: photoUrl || null,
            reply_markup: reply_markup || null,
          } as any,
          errorDetails: error.message || String(error),
        },
      });
    } catch (logErr) {
      console.error("Failed to create error log in test-post api:", logErr);
    }

    return NextResponse.json(
      { error: error.message || "Failed to dispatch test post to Telegram" },
      { status: 500 }
    );
  }
}
