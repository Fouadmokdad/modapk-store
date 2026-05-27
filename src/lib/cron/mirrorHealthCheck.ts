// =============================================================================
// Cron Module — Mirror Health Engine
// =============================================================================
import { db } from "../db";

export type MirrorHealthStatus = "HEALTHY" | "DEAD" | "SLOW" | "REDIRECT_BROKEN" | "REMOVED";

const DELETION_KEYWORDS = [
  "file has been removed",
  "file no longer exists",
  "deleted",
  "invalid or deleted file",
  "copyright infringement",
  "violation of our terms",
  "file not found",
  "not found",
  "malware",
  "dangerous",
  "suspended",
  "no longer available",
];

/**
 * Pings a mirror URL to check its status, response codes, and content safety.
 */
export async function checkMirrorUrlHealth(url: string): Promise<MirrorHealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  const startTime = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "MODAPKStoreMirrorBot/1.1 (+https://modapkstore.com/mirror-bot; safety-verified)",
        "Accept": "*/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;

    if (res.status === 404 || res.status === 410) {
      return "REMOVED";
    }

    if (res.status === 403 || res.status === 401) {
      return "DEAD"; // Forbidden by anti-bot or access revoked
    }

    if (!res.ok) {
      return "REDIRECT_BROKEN";
    }

    // Check response content if it's an HTML landing page
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const body = await res.text();
      const lowerBody = body.toLowerCase();

      for (const keyword of DELETION_KEYWORDS) {
        if (lowerBody.includes(keyword)) {
          return "REMOVED";
        }
      }
    }

    // If fetch took longer than 4.5 seconds, label it as SLOW
    if (duration > 4500) {
      return "SLOW";
    }

    return "HEALTHY";
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      return "SLOW"; // Or DEAD if it timed out completely
    }
    return "DEAD";
  }
}

/**
 * Iterates through all DownloadMirror records, checks health, and updates the database.
 */
export async function runMirrorHealthChecker(): Promise<{ total: number; healthy: number; dead: number }> {
  console.log("[MirrorHealthCheck] Starting mirror health verification cron job...");
  
  const mirrors = await db.downloadMirror.findMany();
  let healthyCount = 0;
  let deadCount = 0;

  for (const mirror of mirrors) {
    const targetUrl = mirror.downloadUrl || mirror.url || "";
    const status = await checkMirrorUrlHealth(targetUrl);
    
    if (status === "HEALTHY") {
      healthyCount++;
    } else {
      deadCount++;
    }

    await db.downloadMirror.update({
      where: { id: mirror.id },
      data: {
        health: status,
        healthStatus: status,
        lastCheckedAt: new Date(),
      },
    });

    console.log(`[MirrorHealthCheck] Checked ${mirror.hostName || mirror.host} link (${mirror.id}) -> Status: ${status}`);
  }

  console.log(`[MirrorHealthCheck] Finished checker. Healthy: ${healthyCount}, Inactive/Dead: ${deadCount}`);
  return { total: mirrors.length, healthy: healthyCount, dead: deadCount };
}
