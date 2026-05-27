// =============================================================================
// Check Package Name API Route
// =============================================================================
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createApiResponse, createApiError } from "@/lib/error-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const packageName = searchParams.get("packageName")?.trim();
    const excludeId = searchParams.get("excludeId") || undefined;

    if (!packageName) {
      return createApiResponse({ exists: false });
    }

    const app = await db.app.findFirst({
      where: {
        packageName,
        NOT: excludeId ? { id: excludeId } : undefined,
      },
      select: { id: true, slug: true, title: true },
    });

    return createApiResponse({ exists: !!app, app });
  } catch (error) {
    return createApiError("Failed to check package name", 500);
  }
}
