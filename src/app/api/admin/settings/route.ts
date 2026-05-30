// =============================================================================
// Settings API — Admin-Only Settings Configuration Routes
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSiteSettings, updateSiteSettings, settingsSchema } from "@/lib/settings";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";

/**
 * GET /api/admin/settings — Fetch global configurations (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getSiteSettings();
    
    // Mask the Telegram Bot Token and AI API Key for security before sending to frontend
    const maskedSettings = {
      ...settings,
      telegramBotToken: settings.telegramBotToken ? "••••••••••••••••" : "",
      aiApiKey: settings.aiApiKey ? "••••••••••••••••" : "",
    };

    return NextResponse.json({ data: maskedSettings });
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings — Save global configurations (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Validate body schema using settings Zod validator
    const validated = settingsSchema.parse(body);

    // Secure Bot Token encryption / preservation
    const existing = await getSiteSettings();
    if (validated.telegramBotToken === "••••••••••••••••" || validated.telegramBotToken === "__MASKED__") {
      validated.telegramBotToken = existing.telegramBotToken;
    } else if (validated.telegramBotToken) {
      const { encrypt } = await import("@/lib/encryption");
      validated.telegramBotToken = encrypt(validated.telegramBotToken);
    } else {
      validated.telegramBotToken = "";
    }

    // Secure AI API Key encryption / preservation
    if (validated.aiApiKey === "••••••••••••••••" || validated.aiApiKey === "__MASKED__") {
      validated.aiApiKey = existing.aiApiKey;
    } else if (validated.aiApiKey) {
      const { encrypt } = await import("@/lib/encryption");
      validated.aiApiKey = encrypt(validated.aiApiKey);
    } else {
      validated.aiApiKey = "";
    }

    const updated = await updateSiteSettings(validated);

    // Log setting change
    await logActivity(
      session.user.id,
      "SETTING_CHANGE",
      `Updated site settings (countdown: ${validated.downloadCountdown})`,
      request
    );

    return NextResponse.json({
      message: "Settings updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/settings error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
