"use client";

// =============================================================================
// Admin Apps List Page
// =============================================================================
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AppCardData } from "@/types/app";

type AppStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

const statusColors: Record<AppStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 50%)", label: "Draft" },
  PUBLISHED: { bg: "hsl(142 71% 45% / 0.1)", text: "hsl(142 71% 45%)", label: "Published" },
  HIDDEN: { bg: "hsl(0 0% 50% / 0.1)", text: "hsl(0 0% 50%)", label: "Hidden" },
};

export default function AdminAppsPage() {
  const [apps, setApps] = useState<AppCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/apps?${params}`);
      const json = await res.json();
      setApps(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch apps:", error);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, search]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const handleStatusChange = async (appId: string, newStatus: AppStatus) => {
    try {
      await fetch(`/api/apps/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchApps();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleDelete = async (appId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await fetch(`/api/apps/${appId}`, { method: "DELETE" });
      fetchApps();
    } catch (error) {
      console.error("Failed to delete app:", error);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
            Apps
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>
            Manage your MOD APK listings
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link
            href="/admin/apps/fetch"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "hsl(var(--color-bg-secondary))",
              color: "hsl(var(--color-text-primary))",
              border: "1px solid hsl(var(--color-border))",
            }}
          >
            🔍 Fetch from Play Store
          </Link>
          <Link
            href="/admin/apps/new"
            className="w-full sm:w-auto text-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
          >
            + Add New App
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3"
        style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}
      >
        {/* Search */}
        <input
          type="text"
          placeholder="Search by name or package..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: "hsl(var(--color-bg-secondary))",
            color: "hsl(var(--color-text-primary))",
            border: "1px solid hsl(var(--color-border))",
          }}
        />
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            background: "hsl(var(--color-bg-secondary))",
            color: "hsl(var(--color-text-primary))",
            border: "1px solid hsl(var(--color-border))",
          }}
        >
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="HIDDEN">Hidden</option>
        </select>
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            background: "hsl(var(--color-bg-secondary))",
            color: "hsl(var(--color-text-primary))",
            border: "1px solid hsl(var(--color-border))",
          }}
        >
          <option value="">All Types</option>
          <option value="APP">Apps</option>
          <option value="GAME">Games</option>
        </select>
      </div>

      {/* Apps Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}
      >
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg mb-2" style={{ color: "hsl(var(--color-text-secondary))" }}>No apps found</p>
            <Link href="/admin/apps/new" className="text-sm font-medium" style={{ color: "hsl(142 71% 45%)" }}>
              + Add your first app
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--color-border))" }}>
            {apps.map((app) => {
              const title = typeof app.title === "object" ? (app.title as Record<string, string>).en : String(app.title);
              const status = (app as unknown as { status: AppStatus }).status || "DRAFT";
              const statusStyle = statusColors[status];

              return (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-all"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--color-bg-secondary) / 0.5)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: "hsl(var(--color-bg-tertiary))" }}>
                      {app.iconUrl ? (
                        <Image src={app.iconUrl} alt={title} width={48} height={48} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg">📱</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-semibold truncate" style={{ color: "hsl(var(--color-text-primary))" }}>
                          {title}
                        </h3>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
                          style={{ background: statusStyle.bg, color: statusStyle.text }}
                        >
                          {statusStyle.label}
                        </span>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: "hsl(var(--color-bg-tertiary))", color: "hsl(var(--color-text-tertiary))" }}
                        >
                          {app.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                        {app.category && <span>{(app.category.name as Record<string, string>).en}</span>}
                        {app.versions?.[0] && <span>v{app.versions[0].versionName}</span>}
                        <span>⬇ {app.downloadCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-neutral-800/40 pt-3 sm:border-0 sm:pt-0">
                    {/* Status toggle */}
                    <select
                      value={status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value as AppStatus)}
                      className="px-2 py-1.5 rounded-lg text-xs outline-none cursor-pointer"
                      style={{
                        background: "hsl(var(--color-bg-secondary))",
                        color: "hsl(var(--color-text-secondary))",
                        border: "1px solid hsl(var(--color-border))",
                      }}
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Publish</option>
                      <option value="HIDDEN">Hide</option>
                    </select>

                    <Link
                      href={`/admin/apps/${app.id}`}
                      className="p-2 rounded-lg transition-all"
                      title="Edit"
                      style={{ color: "hsl(var(--color-text-secondary))" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--color-bg-tertiary))"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </Link>

                    <button
                      onClick={() => handleDelete(app.id, title)}
                      className="p-2 rounded-lg transition-all"
                      title="Delete"
                      style={{ color: "hsl(0 84% 60%)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(0 84% 60% / 0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center gap-2 px-5 py-4"
            style={{ borderTop: "1px solid hsl(var(--color-border))" }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
              style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))" }}
            >
              ← Prev
            </button>
            <span className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40 transition-all"
              style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))" }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
