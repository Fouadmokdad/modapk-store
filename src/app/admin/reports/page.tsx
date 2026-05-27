"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Report {
  id: string;
  appId: string;
  app: {
    title: { en: string; ar: string };
    slug: string;
  };
  type: "BROKEN_LINK" | "COPYRIGHT";
  reporterName: string | null;
  reporterEmail: string | null;
  message: string;
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED";
  adminNotes: string | null;
  createdAt: string;
}

const statusColors: Record<Report["status"], React.CSSProperties> = {
  PENDING: { background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 50%)", border: "1px solid hsl(38 92% 50% / 0.2)" },
  REVIEWED: { background: "hsl(200 90% 40% / 0.1)", color: "hsl(200 90% 45%)", border: "1px solid hsl(200 90% 45% / 0.2)" },
  RESOLVED: { background: "hsl(142 71% 45% / 0.1)", color: "hsl(142 71% 45%)", border: "1px solid hsl(142 71% 45% / 0.2)" },
  DISMISSED: { background: "hsl(240 5% 50% / 0.15)", color: "hsl(240 5% 60%)", border: "1px solid hsl(240 5% 60% / 0.2)" },
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Edit states
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editStatus, setEditStatus] = useState<Report["status"]>("PENDING");
  const [editNotes, setEditNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);

    try {
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      setReports(json.data || []);
    } catch (err) {
      console.error("Failed to load admin reports:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenEdit = (report: Report) => {
    setEditingReport(report);
    setEditStatus(report.status);
    setEditNotes(report.adminNotes || "");
  };

  const handleCloseEdit = () => {
    setEditingReport(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/reports?id=${editingReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: editStatus,
          adminNotes: editNotes || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update report");
      }

      // Reload
      fetchReports();
      handleCloseEdit();
    } catch (err) {
      console.error(err);
      alert("Failed to update report");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--color-text-primary))" }}>
            📢 Reports Management
          </h1>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Review, investigate, and resolve broken link reports and copyright/DMCA issues filed by users.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="card-flat p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2.5">
          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-xs py-2 px-3.5 w-40 rounded-xl"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending ⏳</option>
              <option value="REVIEWED">Reviewed 🔍</option>
              <option value="RESOLVED">Resolved ✅</option>
              <option value="DISMISSED">Dismissed 📁</option>
            </select>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input text-xs py-2 px-3.5 w-40 rounded-xl"
            >
              <option value="">All Types</option>
              <option value="BROKEN_LINK">Broken Link 🔗</option>
              <option value="COPYRIGHT">Copyright / DMCA 🛡️</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchReports}
          className="btn-secondary py-2 px-4 text-xs rounded-xl"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Reports grid/table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-[96px] rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 card-flat">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(var(--color-text-primary))" }}>
            All Clear!
          </h3>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            No user reports matched the selected query.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleOpenEdit(report)}
              className="card-flat p-4 border transition-all cursor-pointer hover:border-accent/40 hover:-translate-y-0.5"
              style={{ borderColor: "hsl(var(--color-border))" }}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider"
                    style={{
                      background: report.type === "BROKEN_LINK" ? "hsl(200 90% 40% / 0.1)" : "hsl(0 84% 60% / 0.1)",
                      color: report.type === "BROKEN_LINK" ? "hsl(200 90% 45%)" : "hsl(0 84% 60%)",
                      border: report.type === "BROKEN_LINK" ? "1px solid hsl(200 90% 45% / 0.2)" : "1px solid hsl(0 84% 60% / 0.2)",
                    }}
                  >
                    {report.type === "BROKEN_LINK" ? "🔗 Broken Link" : "🛡️ Copyright / DMCA"}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    in {report.app?.title.en || "Unknown App"}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md"
                  style={statusColors[report.status]}
                >
                  {report.status}
                </span>
              </div>

              <p className="text-xs line-clamp-2 mb-3" style={{ color: "hsl(var(--color-text-primary))" }}>
                {report.message}
              </p>

              <div className="flex justify-between items-center text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                <div>
                  {report.reporterName && <span>By: {report.reporterName}</span>}
                  {report.reporterEmail && <span className="ml-2">({report.reporterEmail})</span>}
                </div>
                <span>{new Date(report.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editing Dialog Modal overlay */}
      {editingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleCloseEdit} />

          <div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-card p-6 shadow-2xl transition-all zoom-in"
            style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}
          >
            <button
              onClick={handleCloseEdit}
              className="absolute top-4 right-4 btn-ghost p-2 rounded-xl text-lg hover:bg-white/5"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(var(--color-text-primary))" }}>
              📝 Investigate Report
            </h2>
            <p className="text-xs mb-5" style={{ color: "hsl(var(--color-text-tertiary))" }}>
              Report ID: {editingReport.id}
            </p>

            <div className="space-y-4 mb-6">
              {/* Context info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border text-xs" style={{ background: "hsl(var(--color-bg-secondary))", borderColor: "hsl(var(--color-border))" }}>
                <div>
                  <p className="text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>Target App</p>
                  <p className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    {editingReport.app?.title.en}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>Report Type</p>
                  <p className="font-semibold capitalize" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    {editingReport.type.replace("_", " ").toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>Reporter</p>
                  <p className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    {editingReport.reporterName || "Anonymous"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>Contact</p>
                  <p className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    {editingReport.reporterEmail || "None"}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Reporter Message
                </p>
                <div className="p-3 rounded-xl text-xs leading-relaxed max-h-36 overflow-y-auto border"
                  style={{ background: "hsl(var(--color-bg-primary))", borderColor: "hsl(var(--color-border))", color: "hsl(var(--color-text-primary))" }}>
                  {editingReport.message}
                </div>
              </div>
            </div>

            {/* Editing actions form */}
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Select status */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Action Status
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] as Report["status"][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setEditStatus(st)}
                      className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${
                        editStatus === st ? "btn-primary border-transparent text-white" : "btn-ghost"
                      }`}
                      style={{
                        background: editStatus === st ? "var(--gradient-brand)" : "transparent",
                        borderColor: editStatus === st ? "transparent" : "hsl(var(--color-border))",
                        color: editStatus === st ? "white" : "hsl(var(--color-text-tertiary))",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Resolution Notes (Admin Only)
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className="input py-2 px-3 text-xs rounded-xl h-20 resize-none"
                  placeholder="Details of investigation or actions taken (e.g. replaced broken link)..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={updating}
                  className="btn-secondary flex-1 py-3 text-xs rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary flex-1 py-3 text-xs rounded-xl font-bold text-white glow-pulse"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {updating ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
