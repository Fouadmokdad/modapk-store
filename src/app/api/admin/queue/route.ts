// =============================================================================
// Admin Queue Health Endpoint
// =============================================================================
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getQueueHealth } from "@/lib/queue/backgroundJobQueue";
import { createApiResponse, createApiError } from "@/lib/error-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return createApiError("Unauthorized", 401);
    }

    const health = getQueueHealth();
    return createApiResponse(health);
  } catch (error: any) {
    return createApiError(error.message || "Failed to retrieve queue health", 500);
  }
}
