"use client";

// =============================================================================
// Admin Apps List Page — Fully Defensive & Hardened Edition
// =============================================================================
import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import type { AppCardData } from "@/types/app";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { normalizeApp, DEFAULT_APP_THEME } from "@/lib/error-utils";

type AppStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

const DEFAULT_STATUS_STYLE = {
  bg: "hsl(0 0% 50% / 0.1)",
  text: "hsl(0 0% 50%)",
  label: "Unknown"
};

const statusColors: Record<AppStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 50%)", label: "Draft" },
  PUBLISHED: { bg: "hsl(142 71% 45% / 0.1)", text: "hsl(142 71% 45%)", label: "Published" },
  HIDDEN: { bg: "hsl(0 0% 50% / 0.1)", text: "hsl(0 0% 50%)", label: "Hidden" },
};

export default function AdminAppsPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (statusFilter) params.set("status", statusFilter);
      if (typeFilter) params.set("type", typeFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/apps?${params}`);
      if (!res.ok) {
        throw new Error(`Server returned status code ${res.status}`);
      }
      const json = await res.json();
      if (json && json.success === false) {
        throw new Error(json.error || json.message || "Failed to fetch apps");
      }
      const rawData = Array.isArray(json?.data) ? json.data : [];
      const normalizedData = rawData.filter(Boolean).map(normalizeApp).filter(Boolean);

      setApps(normalizedData);
      setTotalPages(json?.meta?.totalPages || 1);
    } catch (err: any) {
      console.error("Failed to fetch apps:", err);
      setError(err?.message || "An unexpected error occurred while fetching apps.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, typeFilter, search]);

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
        <CustomSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          options={[
            { value: "", label: "All Status" },
            { value: "DRAFT", label: "Draft" },
            { value: "PUBLISHED", label: "Published" },
            { value: "HIDDEN", label: "Hidden" },
          ]}
          className="w-full sm:w-40"
        />
        {/* Type filter */}
        <CustomSelect
          value={typeFilter}
          onChange={(val) => { setTypeFilter(val); setPage(1); }}
          options={[
            { value: "", label: "All Types" },
            { value: "APP", label: "Apps" },
            { value: "GAME", label: "Games" },
          ]}
          className="w-full sm:w-40"
        />
        {/* Rows per page */}
        <CustomSelect
          value={String(limit)}
          onChange={(val) => { setLimit(Number(val)); setPage(1); }}
          options={[
            { value: "10", label: "10 rows" },
            { value: "20", label: "20 rows" },
            { value: "50", label: "50 rows" },
            { value: "100", label: "100 rows" },
          ]}
          className="w-full sm:w-32"
        />
      </div>

      {/* Apps Table */}
      <div
        className="rounded-2xl"
        style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}
      >
        {error ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl mb-4">
              ⚠️
            </div>
            <h3 className="text-sm font-semibold mb-1 text-red-400">Failed to Load Applications</h3>
            <p className="text-xs max-w-md mb-6 leading-relaxed" style={{ color: "hsl(var(--color-text-secondary))" }}>
              {error}
            </p>
            <button
              onClick={() => fetchApps()}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
              style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
            >
              🔄 Retry Fetch
            </button>
          </div>
        ) : loading ? (
          <div className="p-8 space-y-4">
            {(Array.isArray(apps) ? [...Array(5)] : []).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : (Array.isArray(apps) ? apps : []).length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-lg mb-2" style={{ color: "hsl(var(--color-text-secondary))" }}>No apps found</p>
            <Link href="/admin/apps/new" className="text-sm font-medium" style={{ color: "hsl(142 71% 45%)" }}>
              + Add your first app
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--color-border))" }}>
            {(Array.isArray(apps) ? apps : []).filter(Boolean).map((app) => {
              const title = typeof app?.title === "object" 
                ? (app.title?.en || app.title?.ar || "Untitled") 
                : String(app?.title || "Untitled");
              const status = (app?.status as AppStatus) || "DRAFT";
              const statusStyle = statusColors[status] || DEFAULT_STATUS_STYLE;

              return (
                <div
                  key={app?.id || Math.random().toString()}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 transition-all first:rounded-t-2xl last:rounded-b-2xl hover:bg-[hsl(var(--color-bg-secondary)/0.4)]"
                >
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ background: "hsl(var(--color-bg-tertiary))" }}>
                      {app?.iconUrl ? (
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
                          style={{ background: statusStyle?.bg ?? DEFAULT_STATUS_STYLE.bg, color: statusStyle?.text ?? DEFAULT_STATUS_STYLE.text }}
                        >
                          {statusStyle?.label ?? DEFAULT_STATUS_STYLE.label}
                        </span>
                        <span
                          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium"
                          style={{ background: "hsl(var(--color-bg-tertiary))", color: "hsl(var(--color-text-tertiary))" }}
                        >
                          {app?.type || "APP"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                        {app?.category && <span>{(app.category?.name?.en) || "Uncategorized"}</span>}
                        {app?.versions?.[0] && <span>v{app.versions[0]?.versionName || "Latest"}</span>}
                        <span>⬇ {(app?.downloadCount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t border-neutral-800/40 pt-3 sm:border-0 sm:pt-0">
                    {/* Status toggle */}
                    <CustomSelect
                      value={status}
                      onChange={(val) => handleStatusChange(app?.id, val as AppStatus)}
                      options={[
                        { value: "DRAFT", label: "Draft" },
                        { value: "PUBLISHED", label: "Publish" },
                        { value: "HIDDEN", label: "Hide" },
                      ]}
                      className="w-28"
                    />

                    <Link
                      href={`/admin/apps/${app?.id || ""}`}
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
                      onClick={() => handleDelete(app?.id, title)}
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
