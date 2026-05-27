// =============================================================================
// Telegram Template Settings API — GET & POST Configuration (admin only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";
import { DEFAULT_TEMPLATE_SETTINGS } from "@/lib/telegram/telegramTemplates";
import { z } from "zod";

const telegramSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  template: z.string().min(1, "Template body cannot be empty"),
  downloadButtonText: z.string().min(1, "Download button text is required"),
  websiteButtonText: z.string().min(1, "Website button text is required"),
  showTitle: z.boolean().default(true),
  showVersion: z.boolean().default(true),
  showSize: z.boolean().default(true),
  showAndroid: z.boolean().default(true),
  showCategory: z.boolean().default(true),
  showDate: z.boolean().default(true),
  showModFeatures: z.boolean().default(true),
  showChangelog: z.boolean().default(false),
  showHashtags: z.boolean().default(true),
  showFooter: z.boolean().default(true),
  titleStyle: z.enum(["normal", "uppercase", "bold", "premium"]).default("premium"),
  dateFormat: z.enum(["long", "short", "relative", "hidden"]).default("long"),
  footerText: z.string().nullable().optional().default(""),
  hashtagsTemplate: z.string().nullable().optional().default(""),
  categoryEmojis: z.any().optional(),
  parseMode: z.string().default("HTML"),
});

/**
 * GET /api/admin/telegram-settings — Retrieve settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await db.telegramSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      // Create defaults
      settings = await db.telegramSettings.create({
        data: {
          id: "global",
          ...DEFAULT_TEMPLATE_SETTINGS,
          categoryEmojis: DEFAULT_TEMPLATE_SETTINGS.categoryEmojis as any,
        },
      });
    }

    return NextResponse.json({ data: settings });
  } catch (error: any) {
    console.error("GET /api/admin/telegram-settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch template settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/telegram-settings — Update settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:settings")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = telegramSettingsSchema.parse(body);

    const updated = await db.telegramSettings.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        ...validated,
        categoryEmojis: validated.categoryEmojis as any,
      },
      update: {
        ...validated,
        categoryEmojis: validated.categoryEmojis as any,
      },
    });

    await logActivity(
      session.user.id,
      "SETTING_CHANGE",
      `Updated Telegram posting template configuration`,
      request
    );

    return NextResponse.json({
      message: "Template settings saved successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("POST /api/admin/telegram-settings error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to save template settings" },
      { status: 500 }
    );
  }
}
