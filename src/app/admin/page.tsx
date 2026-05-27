"use client";

// =============================================================================
// Admin Dashboard — Home Page with Advanced Analytics
// =============================================================================
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface AnalyticsData {
  totalApps: number;
  publishedApps: number;
  draftApps: number;
  pendingReports: number;
  totalDownloads: number;
  totalViews: number;
  views: number;
  downloads: number;
  conversionRate: string;
  topViewed: Array<{ title: { en: string; ar: string }; slug: string; iconUrl: string | null; count: number }>;
  topDownloaded: Array<{ title: { en: string; ar: string }; slug: string; iconUrl: string | null; count: number }>;
  recentDownloads: Array<{
    id: string;
    createdAt: string;
    userAgent: string | null;
    app: { title: { en: string; ar: string }; slug: string };
    version: { versionName: string } | null;
  }>;
  browserBreakdown: Array<{ name: string; value: number }>;
  osBreakdown: Array<{ name: string; value: number }>;
}

function StatsCard({
  label,
  value,
  icon,
  color,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div
        className="rounded-2xl p-5 transition-all card-hover border"
        style={{
          background: "hsl(var(--color-bg-card))",
          borderColor: "hsl(var(--color-border))",
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${color}12`, color }}
          >
            {icon}
          </div>
        </div>
        <div
          className="text-2xl font-bold mb-0.5"
          style={{ color: "hsl(var(--color-text-primary))" }}
        >
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div
          className="text-xs font-semibold"
          style={{ color: "hsl(var(--color-text-secondary))" }}
        >
          {label}
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30d"); // 7d, 30d, all

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const statsCards = [
    {
      label: "Total Apps",
      value: data?.totalApps ?? 0,
      color: "hsl(142 71% 45%)",
      href: "/admin/apps",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        </svg>
      ),
    },
    {
      label: "Published Apps",
      value: data?.publishedApps ?? 0,
      color: "hsl(206 100% 50%)",
      href: "/admin/apps?status=PUBLISHED",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      label: "Draft Folders",
      value: data?.draftApps ?? 0,
      color: "hsl(38 92% 50%)",
      href: "/admin/apps?status=DRAFT",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      label: "Pending Reports",
      value: data?.pendingReports ?? 0,
      color: "hsl(0 84% 60%)",
      href: "/admin/reports",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--color-text-primary))" }}>
            Admin Dashboard
          </h1>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Real-time insights and usage analytics across your bilingual publishing platform.
          </p>
        </div>

        {/* Date Filter selector */}
        <div className="flex bg-card rounded-xl p-1 border" style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}>
          {[
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "all", label: "All Time" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setRange(item.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                range === item.value
                  ? "bg-accent text-white"
                  : "text-[hsl(var(--color-text-secondary))] hover:text-[hsl(var(--color-text-primary))]"
              }`}
              style={{
                background: range === item.value ? "var(--gradient-brand)" : "transparent",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div key={card.label} className={loading ? "skeleton rounded-2xl h-[120px]" : ""}>
            {!loading && <StatsCard {...card} />}
          </div>
        ))}
      </div>

      {/* Analytical Aggregates Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Views range */}
        <div className="card-flat p-5 border text-center" style={{ borderColor: "hsl(var(--color-border))" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Views in Selected Range
          </p>
          <h3 className="text-3xl font-extrabold text-gradient">
            {loading ? "..." : (data?.views ?? 0).toLocaleString()}
          </h3>
        </div>
        {/* Total Downloads range */}
        <div className="card-flat p-5 border text-center" style={{ borderColor: "hsl(var(--color-border))" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Downloads in Selected Range
          </p>
          <h3 className="text-3xl font-extrabold text-gradient">
            {loading ? "..." : (data?.downloads ?? 0).toLocaleString()}
          </h3>
        </div>
        {/* Conversion Rate range */}
        <div className="card-flat p-5 border text-center" style={{ borderColor: "hsl(var(--color-border))" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            View-to-Download Conversion
          </p>
          <h3 className="text-3xl font-extrabold text-gradient">
            {loading ? "..." : `${data?.conversionRate ?? "0.0"}%`}
          </h3>
        </div>
      </div>

      {/* Top lists - Grid Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Viewed Apps */}
        <div className="card-flat p-5 border" style={{ borderColor: "hsl(var(--color-border))" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
            📈 Top Viewed Apps (This Range)
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-[48px] rounded-xl" />)}
            </div>
          ) : !data?.topViewed.length ? (
            <div className="text-center py-6 text-xs text-[hsl(var(--color-text-tertiary))]">
              No viewing data recorded in this period.
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.topViewed.map((app) => (
                <div key={app.slug} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">📱</div>
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate" style={{ color: "hsl(var(--color-text-secondary))" }}>
                      {app.title.en}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-accent))" }}>
                    {app.count.toLocaleString()} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Downloaded Apps */}
        <div className="card-flat p-5 border" style={{ borderColor: "hsl(var(--color-border))" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
            📥 Top Downloaded Apps (This Range)
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-[48px] rounded-xl" />)}
            </div>
          ) : !data?.topDownloaded.length ? (
            <div className="text-center py-6 text-xs text-[hsl(var(--color-text-tertiary))]">
              No download events recorded in this period.
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.topDownloaded.map((app) => (
                <div key={app.slug} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">📱</div>
                      )}
                    </div>
                    <span className="text-xs font-semibold truncate" style={{ color: "hsl(var(--color-text-secondary))" }}>
                      {app.title.en}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg animate-pulse" style={{ background: "hsl(var(--color-accent-soft))", color: "hsl(var(--color-accent))" }}>
                    {app.count.toLocaleString()} loads
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Demographics breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Operating Systems */}
        <div className="card-flat p-5 border" style={{ borderColor: "hsl(var(--color-border))" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
            🤖 Operating System Demographics
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-[28px] rounded-lg" />)}
            </div>
          ) : !data?.osBreakdown.length ? (
            <div className="text-center py-6 text-xs text-[hsl(var(--color-text-tertiary))]">
              No client telemetry available.
            </div>
          ) : (
            <div className="space-y-3">
              {data.osBreakdown.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>{item.name}</span>
                    <span className="font-bold text-gradient">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: "var(--gradient-brand)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Browsers */}
        <div className="card-flat p-5 border" style={{ borderColor: "hsl(var(--color-border))" }}>
          <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
            🌐 Browser Demographics
          </h3>
          {loading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-[28px] rounded-lg" />)}
            </div>
          ) : !data?.browserBreakdown.length ? (
            <div className="text-center py-6 text-xs text-[hsl(var(--color-text-tertiary))]">
              No client telemetry available.
            </div>
          ) : (
            <div className="space-y-3">
              {data.browserBreakdown.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>{item.name}</span>
                    <span className="font-bold text-gradient">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: "var(--gradient-brand)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent downloads table */}
      <div className="card-flat p-5 border" style={{ borderColor: "hsl(var(--color-border))" }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
          📋 Recent Download Events Log
        </h3>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-[40px] rounded-xl" />)}
          </div>
        ) : !data?.recentDownloads.length ? (
          <div className="text-center py-10 text-xs text-[hsl(var(--color-text-tertiary))]">
            No download events recorded in history yet.
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b" style={{ borderColor: "hsl(var(--color-border) / 0.5)", color: "hsl(var(--color-text-tertiary))" }}>
                  <th className="pb-2.5 font-bold">App Name</th>
                  <th className="pb-2.5 font-bold">Version</th>
                  <th className="pb-2.5 font-bold">Client OS</th>
                  <th className="pb-2.5 font-bold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDownloads.map((event) => {
                  let clientOs = "Unknown";
                  if (event.userAgent?.includes("Android")) clientOs = "Android 🤖";
                  else if (event.userAgent?.includes("Windows")) clientOs = "Windows 💻";
                  else if (event.userAgent?.includes("iPhone") || event.userAgent?.includes("iPad")) clientOs = "iOS 📱";
                  else if (event.userAgent?.includes("Macintosh")) clientOs = "macOS 🖥️";
                  else if (event.userAgent?.includes("Linux")) clientOs = "Linux 🐧";

                  return (
                    <tr key={event.id} className="border-b last:border-0" style={{ borderColor: "hsl(var(--color-border) / 0.3)" }}>
                      <td className="py-3 font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                        {event.app?.title.en}
                      </td>
                      <td className="py-3 text-[hsl(var(--color-text-tertiary))]">
                        {event.version?.versionName ? `v${event.version.versionName}` : "—"}
                      </td>
                      <td className="py-3" style={{ color: "hsl(var(--color-text-secondary))" }}>
                        {clientOs}
                      </td>
                      <td className="py-3 text-right" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                        {new Date(event.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
          Quick Operational Shortcuts
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Add New App", href: "/admin/apps/new", emoji: "➕" },
            { label: "Fetch Google Play", href: "/admin/apps/fetch", emoji: "🔍" },
            { label: "Categories Admin", href: "/admin/categories", emoji: "📁" },
            { label: "User Support Claims", href: "/admin/reports", emoji: "⚠️" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all card-hover border"
              style={{
                background: "hsl(var(--color-bg-card))",
                borderColor: "hsl(var(--color-border))",
                color: "hsl(var(--color-text-primary))",
              }}
            >
              <span className="text-base">{action.emoji}</span>
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
