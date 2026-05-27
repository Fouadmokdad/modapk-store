// =============================================================================
// Activity Logger Utility — Tracks admin actions with audit logs
// =============================================================================
import { db } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Logs an administrative action to the database.
 */
export async function logActivity(
  adminId: string,
  action: "LOGIN" | "LOGOUT" | "APP_CREATE" | "APP_EDIT" | "APP_DELETE" | "VERSION_CREATE" | "VERSION_EDIT" | "VERSION_DELETE" | "SETTING_CHANGE" | "ADMIN_CREATE" | "ADMIN_EDIT" | "ADMIN_DELETE" | "PASSWORD_CHANGE",
  details?: string,
  req?: Request
) {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (req) {
      ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      userAgent = req.headers.get("user-agent");
    } else {
      try {
        const headerList = await headers();
        ipAddress = headerList.get("x-forwarded-for") || headerList.get("x-real-ip");
        userAgent = headerList.get("user-agent");
      } catch {
        // Fallback if headers() cannot be called (e.g. static rendering phase or non-request context)
      }
    }

    // Clean IP list if multiple proxy IPs exist
    if (ipAddress && ipAddress.includes(",")) {
      ipAddress = ipAddress.split(",")[0].trim();
    }

    await db.adminActivityLog.create({
      data: {
        adminId,
        action,
        details,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
