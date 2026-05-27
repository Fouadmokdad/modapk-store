// =============================================================================
// Analytics API — Calculates aggregates, conversion rates, and client breakdowns
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Simple, fast user-agent parser
function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: "Unknown", os: "Unknown" };

  let browser = "Other";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";
  else if (ua.includes("Opera")) browser = "Opera";

  let os = "Other";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux") && !ua.includes("Android")) os = "Linux";

  return { browser, os };
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authorize Admin
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d"; // 7d, 30d, all

    // 2. Define Date Thresholds
    let dateFilter = {};
    if (range === "7d") {
      dateFilter = { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (range === "30d") {
      dateFilter = { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    // 3. Fetch Site Totals & Range Counts in Parallel
    const [
      totalAppsCount,
      publishedAppsCount,
      draftAppsCount,
      pendingReportsCount,
      totalDownloadsCount,
      totalViewsCount,
      viewsRangeCount,
      downloadsRangeCount,
    ] = await Promise.all([
      db.app.count(),
      db.app.count({ where: { status: "PUBLISHED" } }),
      db.app.count({ where: { status: "DRAFT" } }),
      db.report.count({ where: { status: "PENDING" } }),
      db.downloadEvent.count(),
      db.pageView.count(),
      db.pageView.count({ where: dateFilter }),
      db.downloadEvent.count({ where: dateFilter }),
    ]);

    // 4. Fetch Top Viewed Apps for Date Range
    const topViewedGroups = await db.pageView.groupBy({
      by: ["appId"],
      where: dateFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    // Fetch details for viewed apps
    const topViewedApps = await Promise.all(
      topViewedGroups.map(async (group) => {
        const app = await db.app.findUnique({
          where: { id: group.appId },
          select: { title: true, slug: true, iconUrl: true },
        });
        return {
          ...app,
          count: group._count.id,
        };
      })
    );

    // 5. Fetch Top Downloaded Apps for Date Range
    const topDownloadedGroups = await db.downloadEvent.groupBy({
      by: ["appId"],
      where: dateFilter,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    // Fetch details for downloaded apps
    const topDownloadedApps = await Promise.all(
      topDownloadedGroups.map(async (group) => {
        const app = await db.app.findUnique({
          where: { id: group.appId },
          select: { title: true, slug: true, iconUrl: true },
        });
        return {
          ...app,
          count: group._count.id,
        };
      })
    );

    // 6. Fetch Recent Download Events (Last 10)
    const recentDownloads = await db.downloadEvent.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        app: {
          select: {
            title: true,
            slug: true,
          },
        },
        version: {
          select: {
            versionName: true,
          },
        },
      },
    });

    // 7. Calculate User Agent OS & Browser Breakdown
    const userAgents = await db.pageView.findMany({
      where: dateFilter,
      select: { userAgent: true },
      take: 500, // Process last 500 for representation
    });

    const browserStats: Record<string, number> = {};
    const osStats: Record<string, number> = {};

    userAgents.forEach((entry) => {
      const { browser, os } = parseUserAgent(entry.userAgent);
      browserStats[browser] = (browserStats[browser] || 0) + 1;
      osStats[os] = (osStats[os] || 0) + 1;
    });

    // Format stats for frontend graphs
    const browserBreakdown = Object.entries(browserStats).map(([name, count]) => ({
      name,
      value: Math.round((count / Math.max(1, userAgents.length)) * 100),
    }));

    const osBreakdown = Object.entries(osStats).map(([name, count]) => ({
      name,
      value: Math.round((count / Math.max(1, userAgents.length)) * 100),
    }));

    // 7.5. Mobile App Analytics Additions (Bilingual safe, perfectly backwards compatible)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const downloadsLastWeek = await db.downloadEvent.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyCounts: Record<string, number> = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = days[d.getDay()];
      dailyCounts[label] = 0;
    }

    downloadsLastWeek.forEach(event => {
      const label = days[event.createdAt.getDay()];
      if (dailyCounts[label] !== undefined) {
        dailyCounts[label]++;
      }
    });

    const downloadsByDay = Object.entries(dailyCounts).map(([label, value]) => ({
      label,
      value,
    }));

    const recentAppsList = await db.app.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        iconUrl: true,
        status: true,
        createdAt: true,
      },
    });

    const recentApps = recentAppsList.map(app => ({
      id: app.id,
      name: typeof app.title === "object" && app.title !== null ? (app.title as any).en || (app.title as any).ar || "" : "",
      icon: app.iconUrl,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
    }));

    // 8. Yield Consolidated Response JSON (perfectly backwards-compatible)
    return NextResponse.json({
      data: {
        totalApps: totalAppsCount,
        publishedApps: publishedAppsCount,
        draftApps: draftAppsCount,
        pendingReports: pendingReportsCount,
        totalDownloads: totalDownloadsCount,
        totalViews: totalViewsCount,
        views: viewsRangeCount,
        downloads: downloadsRangeCount,
        conversionRate: viewsRangeCount > 0 ? ((downloadsRangeCount / viewsRangeCount) * 100).toFixed(1) : "0.0",
        topViewed: topViewedApps.filter(Boolean),
        topDownloaded: topDownloadedApps.filter(Boolean),
        recentDownloads,
        browserBreakdown,
        osBreakdown,
        downloadsByDay,
        recentApps,
      },
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}

