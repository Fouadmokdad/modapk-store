"use client";

// =============================================================================
// Security Logs Page — View Activity Logs (SUPER_ADMIN and ADMIN only)
// =============================================================================
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    name: string;
    email: string;
    role: string;
  };
}

export default function SecurityLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "25");
    if (search.trim()) params.set("q", search.trim());
    if (actionFilter) params.set("action", actionFilter);

    try {
      const res = await fetch(`/api/admin/activity-logs?${params}`);
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Access Denied. You do not have permission to view security logs.");
          return;
        }
        throw new Error("Failed to load activity logs");
      }
      const json = await res.json();
      setLogs(json.data || []);
      setTotalPages(json.meta?.totalPages || 1);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
        setError("Access Denied. Only SUPER_ADMIN and ADMIN accounts can view security logs.");
        setLoading(false);
      } else {
        fetchLogs();
      }
    }
  }, [status, session, fetchLogs]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (status === "authenticated" && !error) {
        setPage(1);
        fetchLogs();
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search, actionFilter, status, error]);

  const getActionBadgeStyle = (action: string) => {
    if (action.includes("CREATE")) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (action.includes("DELETE")) return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (action.includes("EDIT") || action.includes("CHANGE")) return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    if (action === "LOGIN") return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
    if (action === "LOGOUT") return "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20";
    return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
  };

  if (loading && page === 1) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="card-glass border border-white/10 p-6 rounded-3xl space-y-4">
          <div className="skeleton h-10 w-full rounded-xl" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-glass p-8 text-center max-w-lg mx-auto rounded-3xl border border-white/10 mt-12 shadow-2xl">
        <div className="text-5xl mb-4">🛡️</div>
        <h2 className="text-xl font-bold mb-3 text-white">Access Restricted</h2>
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">{error}</p>
        <Link href="/admin" className="btn-primary py-2.5 px-6 rounded-xl font-bold text-sm inline-block">
          Go back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>📋</span> Security & Activity Logs
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Audit trail of administrator actions, login events, and setting changes.
        </p>
      </div>

      {/* Filter panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5 w-full md:w-80 focus-within:border-emerald-500/30 transition-all duration-300">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-500 shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs or admins..."
            className="flex-1 bg-transparent border-none outline-none text-xs px-2.5 text-white placeholder-neutral-500 min-w-0"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-xs text-neutral-500 hover:text-white shrink-0 cursor-pointer">✕</button>
          )}
        </div>

        {/* Action Filter */}
        <CustomSelect
          value={actionFilter}
          onChange={(val) => setActionFilter(val)}
          options={[
            { value: "", label: "All Actions" },
            { value: "LOGIN", label: "LOGIN" },
            { value: "LOGOUT", label: "LOGOUT" },
            { value: "APP_CREATE", label: "APP CREATE" },
            { value: "APP_EDIT", label: "APP EDIT" },
            { value: "APP_DELETE", label: "APP DELETE" },
            { value: "VERSION_CREATE", label: "VERSION CREATE" },
            { value: "SETTING_CHANGE", label: "SETTINGS CHANGE" },
            { value: "ADMIN_CREATE", label: "ADMIN CREATE" },
            { value: "ADMIN_EDIT", label: "ADMIN EDIT" },
            { value: "ADMIN_DELETE", label: "ADMIN DELETE" },
            { value: "PASSWORD_CHANGE", label: "PASSWORD CHANGE" },
          ]}
          className="w-full md:w-48 shrink-0"
        />
      </div>

      {/* Grid Table */}
      <div className="card-glass border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.01] to-purple-500/[0.01] pointer-events-none" />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 bg-white/[0.01]">
                <th className="px-6 py-4">Admin</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-500">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                    {/* Admin details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{log.admin.name}</span>
                        <span className="text-[10px] text-neutral-400">{log.admin.email}</span>
                      </div>
                    </td>

                    {/* Action badge */}
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Details */}
                    <td className="px-6 py-4 text-xs text-neutral-300 max-w-sm truncate" title={log.details || ""}>
                      {log.details || "—"}
                    </td>

                    {/* IP & User Agent */}
                    <td className="px-6 py-4 text-xs text-neutral-300">
                      <div className="flex flex-col">
                        <span>{log.ipAddress || "—"}</span>
                        <span className="text-[9px] text-neutral-500 truncate max-w-[150px]" title={log.userAgent || ""}>
                          {log.userAgent || ""}
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 text-xs text-neutral-300">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary py-2 px-3.5 text-xs disabled:opacity-30 rounded-xl font-bold cursor-pointer"
          >
            ← Previous
          </button>
          <span className="text-xs text-neutral-400 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-secondary py-2 px-3.5 text-xs disabled:opacity-30 rounded-xl font-bold cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
