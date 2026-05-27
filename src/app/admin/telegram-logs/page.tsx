"use client";

// =============================================================================
// Telegram Auto Posting Logs — Admin Panel Page (Dark Glassmorphism UI)
// =============================================================================

import React, { useEffect, useState, useCallback } from "react";

interface TelegramLog {
  id: string;
  appId: string | null;
  appName: string;
  versionName: string | null;
  status: "PENDING" | "POSTED" | "FAILED";
  retryCount: number;
  payload: {
    text: string;
    photoUrl: string | null;
    reply_markup?: {
      inline_keyboard: Array<Array<{ text: string; url: string }>>;
    };
  } | null;
  telegramResponse: any;
  errorDetails: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<TelegramLog["status"], React.CSSProperties> = {
  POSTED: { background: "hsl(142 71% 45% / 0.1)", color: "hsl(142 71% 45%)", border: "1px solid hsl(142 71% 45% / 0.2)" },
  PENDING: { background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 50%)", border: "1px solid hsl(38 92% 50% / 0.2)" },
  FAILED: { background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)", border: "1px solid hsl(0 84% 60% / 0.2)" },
};

export default function TelegramLogsPage() {
  const [logs, setLogs] = useState<TelegramLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal / Detail states
  const [selectedLog, setSelectedLog] = useState<TelegramLog | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);

  const fetchLogs = useCallback(async (pageNum: number = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/telegram-logs?page=${pageNum}&limit=15`);
      const json = await res.json();
      if (res.ok && json.data) {
        setLogs(json.data);
        setPage(json.meta.page);
        setTotalPages(json.meta.totalPages);
        setTotalItems(json.meta.total);
      }
    } catch (err) {
      console.error("Failed to fetch Telegram logs:", err);
      showToast(false, "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(page);
  }, [fetchLogs, page]);

  const showToast = (success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRetry = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    setActioningId(logId);
    try {
      const res = await fetch(`/api/admin/telegram-logs/${logId}/retry`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(true, "Post queued for retry successfully.");
        // Refresh logs list after a short delay to let worker run
        setTimeout(() => fetchLogs(page), 1500);
      } else {
        showToast(false, data.error || "Failed to trigger retry.");
      }
    } catch (err: any) {
      showToast(false, err.message || "Failed to contact API.");
    } finally {
      setActioningId(null);
    }
  };

  const handleDelete = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    
    setActioningId(logId);
    try {
      const res = await fetch(`/api/admin/telegram-logs?id=${logId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(true, "Log deleted successfully.");
        fetchLogs(page);
      } else {
        showToast(false, data.error || "Failed to delete log.");
      }
    } catch (err: any) {
      showToast(false, err.message || "Failed to contact API.");
    } finally {
      setActioningId(null);
    }
  };

  const inputStyle = {
    background: "hsl(var(--color-bg-secondary))",
    color: "hsl(var(--color-text-primary))",
    border: "1px solid hsl(var(--color-border))",
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--color-text-primary))" }}>
            📢 Telegram Posting Logs
          </h1>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Monitor automated channel updates, review formatted messages, and trigger manual retries for failed posts.
          </p>
        </div>

        <button
          onClick={() => fetchLogs(page)}
          className="btn-secondary py-2 px-4 text-xs rounded-xl flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          🔄 Refresh Logs
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl text-xs font-bold transition-all border flex items-center gap-2 animate-slide-up ${
            toast.success
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}
        >
          <span>{toast.success ? "✅" : "❌"}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Logs Table Area */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 card-flat">
          <div className="text-4xl mb-3">💬</div>
          <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(var(--color-text-primary))" }}>
            No logs recorded yet
          </h3>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Enable auto posting and publish an app/version to see posting logs here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="card-flat p-4 border transition-all cursor-pointer hover:border-accent/40 hover:-translate-y-0.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              style={{ borderColor: "hsl(var(--color-border))" }}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-sm" style={{ color: "hsl(var(--color-text-primary))" }}>
                    {log.appName}
                  </span>
                  {log.versionName && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400">
                      v{log.versionName}
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  <span>Posted: {new Date(log.createdAt).toLocaleString()}</span>
                  <span>•</span>
                  <span>Retries: {log.retryCount}/3</span>
                  {log.errorDetails && (
                    <>
                      <span>•</span>
                      <span className="text-red-400 font-medium truncate max-w-[250px] sm:max-w-[400px]">
                        Err: {log.errorDetails}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0">
                <span
                  className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider text-center"
                  style={statusColors[log.status]}
                >
                  {log.status}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleRetry(log.id, e)}
                    disabled={actioningId === log.id}
                    title="Retry Post"
                    className="p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/5 text-neutral-300 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => handleDelete(log.id, e)}
                    disabled={actioningId === log.id}
                    title="Delete Log"
                    className="p-2 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-red-500/10 text-red-400 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 text-xs">
              <span className="text-neutral-400">
                Showing page <strong className="text-white">{page}</strong> of <strong className="text-white">{totalPages}</strong> ({totalItems} logs)
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 disabled:opacity-30 hover:bg-white/5 transition-all cursor-pointer text-white font-medium"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 disabled:opacity-30 hover:bg-white/5 transition-all cursor-pointer text-white font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Payload Details Modal Overlay */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />

          <div
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all zoom-in flex flex-col max-h-[85vh]"
            style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}
          >
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-neutral-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                Inspect Telegram Payload
              </h2>
              <p className="text-xs text-neutral-400">
                Log ID: {selectedLog.id} • Status: <strong className="uppercase" style={{ color: statusColors[selectedLog.status].color }}>{selectedLog.status}</strong>
              </p>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Media Preview if photoUrl exists */}
              {selectedLog.payload?.photoUrl && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Attached Image</h4>
                  <div className="rounded-xl overflow-hidden max-w-[200px] border border-white/10 bg-white/5 shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedLog.payload.photoUrl}
                      alt="App Thumbnail"
                      className="w-full h-auto object-cover max-h-[200px]"
                    />
                  </div>
                </div>
              )}

              {/* Message text */}
              <div>
                <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Message HTML Body</h4>
                <pre
                  className="p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-x-auto border text-emerald-400 bg-black/40"
                  style={{ borderColor: "hsl(var(--color-border))" }}
                  dangerouslySetInnerHTML={{ __html: selectedLog.payload?.text || "<i>No text content</i>" }}
                />
              </div>

              {/* Inline buttons preview */}
              {selectedLog.payload?.reply_markup?.inline_keyboard && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Inline Keyboard Preview</h4>
                  <div className="flex flex-wrap gap-2.5 p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                    {selectedLog.payload.reply_markup.inline_keyboard.map((row, rIdx) => (
                      <div key={rIdx} className="flex flex-wrap gap-2 w-full">
                        {row.map((btn, bIdx) => (
                          <a
                            key={bIdx}
                            href={btn.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 min-w-[120px] text-center py-2 px-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-semibold text-xs border border-blue-500/20 transition-all truncate"
                          >
                            {btn.text}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* API Response or Error */}
              {(selectedLog.telegramResponse || selectedLog.errorDetails) && (
                <div>
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {selectedLog.status === "FAILED" ? "Error Details" : "Telegram API Response"}
                  </h4>
                  <pre
                    className={`p-4 rounded-xl text-[11px] font-mono whitespace-pre-wrap overflow-x-auto border ${
                      selectedLog.status === "FAILED" ? "bg-red-500/5 text-red-400" : "bg-white/[0.02] text-neutral-300"
                    }`}
                    style={{ borderColor: "hsl(var(--color-border))" }}
                  >
                    {selectedLog.status === "FAILED"
                      ? selectedLog.errorDetails
                      : JSON.stringify(selectedLog.telegramResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-secondary py-2.5 px-5 text-xs rounded-xl font-bold cursor-pointer"
              >
                Close
              </button>
              
              <button
                type="button"
                disabled={actioningId === selectedLog.id}
                onClick={(e) => {
                  handleRetry(selectedLog.id, e);
                  setSelectedLog(null);
                }}
                className="btn-primary py-2.5 px-5 text-xs rounded-xl font-bold text-white cursor-pointer glow-pulse"
                style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
              >
                🔄 Retry Post Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
