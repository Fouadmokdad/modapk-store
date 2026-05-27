// =============================================================================
// Settings API — Public Site Configurations Route
// =============================================================================
import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";

/**
 * GET /api/settings — Public site configurations for public pages
 */
export async function GET() {
  try {
    const settings = await getSiteSettings();
    
    // Selectively expose only public-safe parameters
    return NextResponse.json({
      data: {
        siteTitle: settings.siteTitle,
        siteDescription: settings.siteDescription,
        downloadCountdown: settings.downloadCountdown,
        socialLinks: settings.socialLinks,
        disclaimer: settings.disclaimer,
        footerText: settings.footerText,
        homepageFeatured: settings.homepageFeatured,
        maintenanceMode: settings.maintenanceMode,
        adsSettings: settings.adsSettings,
      },
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch public site configurations" },
      { status: 500 }
    );
  }
}
