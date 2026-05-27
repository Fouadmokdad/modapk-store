// =============================================================================
// Fetch from Google Play Store API
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchAppFromPlayStore, mapPlayStoreToAppDraft } from "@/lib/playstore";
import { fetchPlayStoreSchema } from "@/lib/validators";

/**
 * POST /api/fetch — Fetch app metadata from Google Play (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packageName } = fetchPlayStoreSchema.parse(body);

    // Fetch from Play Store
    const playStoreData = await fetchAppFromPlayStore(packageName);

    // Map to our app draft format
    const draft = mapPlayStoreToAppDraft(playStoreData);

    return NextResponse.json({
      data: {
        raw: playStoreData,
        draft,
      },
    });
  } catch (error) {
    console.error("POST /api/fetch error:", error);

    const message =
      error instanceof Error ? error.message : "Failed to fetch from Play Store";

    // Distinguish validation errors from fetch errors
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json(
        { error: "Invalid package name format", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
