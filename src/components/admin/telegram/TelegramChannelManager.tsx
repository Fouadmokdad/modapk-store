"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

/* ─────────────────────────── KEYFRAMES ─────────────────────────── */
const KEYFRAMES = `
@keyframes tcm-slide-up {
  from { opacity: 0; transform: translateY(40px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)   scale(1);    }
}
@keyframes tcm-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes tcm-spin {
  to { transform: rotate(360deg); }
}
@keyframes tcm-pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0.5); }
  50%       { box-shadow: 0 0 0 6px rgba(52,211,153,0); }
}
@keyframes tcm-pulse-red {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
  50%       { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
}
@keyframes tcm-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
`;

/* ─────────────────────────── TYPES ─────────────────────────── */
type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

interface ChannelStats {
  postsSent: number;
  successRate: number;
  lastPost: string;
}

interface TelegramChannel {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  enabled: boolean;
  avatar: string;
  color: string;
  subscribers: number;
  scheduleTime: string;
  scheduleDays: DayKey[];
  timezone: string;
  permissions: {
    canSendMessages: boolean;
    canSendMedia: boolean;
    canEditMessages: boolean;
    canDeleteMessages: boolean;
  };
  stats: ChannelStats;
}

type TestStatus = "idle" | "loading" | "success" | "error";

/* ─────────────────────────── CONSTANTS ─────────────────────────── */
const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMEZONES = [
  "UTC", "UTC+1", "UTC+2", "UTC+3", "UTC+4", "UTC+5",
  "UTC+5:30", "UTC+6", "UTC+7", "UTC+8", "UTC+9", "UTC+10",
  "UTC-5", "UTC-6", "UTC-7", "UTC-8",
];

const CHANNEL_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#14b8a6",
];

const DEFAULT_CHANNEL: TelegramChannel = {
  id: "ch-1",
  name: "MOD APK Updates",
  botToken: "7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  chatId: "-1001234567890",
  enabled: true,
  avatar: "M",
  color: "#6366f1",
  subscribers: 48_320,
  scheduleTime: "09:00",
  scheduleDays: ["Mon", "Wed", "Fri"],
  timezone: "UTC+3",
  permissions: {
    canSendMessages: true,
    canSendMedia: true,
    canEditMessages: false,
    canDeleteMessages: false,
  },
  stats: {
    postsSent: 1_247,
    successRate: 98.4,
    lastPost: "2 hours ago",
  },
};

/* ─────────────────────────── HELPERS ─────────────────────────── */
function formatSubscribers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

function randomId() {
  return "ch-" + Math.random().toString(36).slice(2, 9);
}

/* ─────────────────────────── COMPONENT ─────────────────────────── */
export function TelegramChannelManager() {
  /* inject keyframes once */
  useEffect(() => {
    const id = "tcm-keyframes";
    if (!document.getElementById(id)) {
      const s = document.createElement("style");
      s.id = id;
      s.textContent = KEYFRAMES;
      document.head.appendChild(s);
    }
  }, []);

  /* state */
  const [channels, setChannels] = useState<TelegramChannel[]>([DEFAULT_CHANNEL]);
  const [selectedId, setSelectedId] = useState<string>(DEFAULT_CHANNEL.id);
  const [showModal, setShowModal] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>("idle");
  const [testMessage, setTestMessage] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [checkingPerms, setCheckingPerms] = useState(false);

  /* new channel form */
  const [newName, setNewName] = useState("");
  const [newToken, setNewToken] = useState("");
  const [newChatId, setNewChatId] = useState("");
  const [newShowToken, setNewShowToken] = useState(false);

  const selected = channels.find((c) => c.id === selectedId) ?? null;

  /* update selected channel field */
  const updateChannel = useCallback(
    (patch: Partial<TelegramChannel>) =>
      setChannels((prev) =>
        prev.map((c) => (c.id === selectedId ? { ...c, ...patch } : c))
      ),
    [selectedId]
  );

  /* test connection */
  const handleTest = async () => {
    if (!selected) return;
    setTestStatus("loading");
    setTestMessage("");
    try {
      const res = await fetch("/api/admin/telegram-settings/test-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: selected.botToken, chatId: selected.chatId }),
      });
      if (res.ok) {
        setTestStatus("success");
        setTestMessage("Connection successful! Test message delivered.");
      } else {
        const data = await res.json().catch(() => ({}));
        setTestStatus("error");
        setTestMessage(data?.message ?? "Connection failed. Check token & Chat ID.");
      }
    } catch {
      setTestStatus("error");
      setTestMessage("Network error. Verify credentials and try again.");
    }
  };

  /* check permissions (mock) */
  const handleCheckPerms = async () => {
    setCheckingPerms(true);
    await new Promise((r) => setTimeout(r, 1800));
    updateChannel({
      permissions: {
        canSendMessages: true,
        canSendMedia: true,
        canEditMessages: Math.random() > 0.5,
        canDeleteMessages: Math.random() > 0.5,
      },
    });
    setCheckingPerms(false);
  };

  /* add channel */
  const handleAddChannel = () => {
    if (!newName.trim() || !newToken.trim() || !newChatId.trim()) return;
    const color = CHANNEL_COLORS[channels.length % CHANNEL_COLORS.length];
    const ch: TelegramChannel = {
      id: randomId(),
      name: newName.trim(),
      botToken: newToken.trim(),
      chatId: newChatId.trim(),
      enabled: true,
      avatar: newName.trim()[0].toUpperCase(),
      color,
      subscribers: Math.floor(Math.random() * 50_000),
      scheduleTime: "10:00",
      scheduleDays: ["Mon", "Fri"],
      timezone: "UTC",
      permissions: {
        canSendMessages: false,
        canSendMedia: false,
        canEditMessages: false,
        canDeleteMessages: false,
      },
      stats: { postsSent: 0, successRate: 0, lastPost: "Never" },
    };
    setChannels((prev) => [...prev, ch]);
    setSelectedId(ch.id);
    setShowModal(false);
    setNewName("");
    setNewToken("");
    setNewChatId("");
  };

  /* delete channel */
  const handleDelete = () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setChannels((prev) => prev.filter((c) => c.id !== selectedId));
    setSelectedId(channels.find((c) => c.id !== selectedId)?.id ?? "");
    setDeleteConfirm(false);
  };

  /* toggle schedule day */
  const toggleDay = (day: DayKey) => {
    if (!selected) return;
    const days = selected.scheduleDays.includes(day)
      ? selected.scheduleDays.filter((d) => d !== day)
      : [...selected.scheduleDays, day];
    updateChannel({ scheduleDays: days });
  };

  /* ─── STYLES ─── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s: Record<string, any> = {
    root: {
      display: "flex",
      flexDirection: "column",
      gap: 24,
      minHeight: "100%",
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 0 4px",
    },
    headerTitle: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    headerIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
    },
    h1: {
      fontSize: 22,
      fontWeight: 700,
      color: "#f1f5f9",
      margin: 0,
      letterSpacing: "-0.3px",
    },
    subtitle: {
      fontSize: 13,
      color: "#64748b",
      marginTop: 2,
    },
    addBtn: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 20px",
      borderRadius: 12,
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      border: "none",
      color: "#fff",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
      transition: "opacity 0.2s, transform 0.15s",
    },
    twoCol: {
      display: "grid",
      gridTemplateColumns: "300px 1fr",
      gap: 20,
      alignItems: "start",
    },
    /* left panel */
    leftPanel: {
      background: "rgba(15,23,42,0.6)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(99,102,241,0.15)",
      borderRadius: 20,
      overflow: "hidden",
    },
    leftHeader: {
      padding: "16px 20px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: 12,
      fontWeight: 600,
      color: "#64748b",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
    channelList: {
      padding: "8px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    },
    channelCard: (active: boolean, color: string): React.CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 14,
      cursor: "pointer",
      border: `1.5px solid ${active ? color + "55" : "transparent"}`,
      background: active
        ? `linear-gradient(135deg, ${color}18, ${color}08)`
        : "transparent",
      transition: "all 0.2s ease",
      position: "relative",
    }),
    avatar: (color: string): React.CSSProperties => ({
      width: 42,
      height: 42,
      borderRadius: 12,
      background: `linear-gradient(135deg,${color},${color}bb)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 18,
      fontWeight: 700,
      color: "#fff",
      flexShrink: 0,
      boxShadow: `0 4px 12px ${color}44`,
    }),
    channelInfo: {
      flex: 1,
      minWidth: 0,
    },
    channelName: {
      fontSize: 14,
      fontWeight: 600,
      color: "#e2e8f0",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    channelMeta: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 3,
    },
    statusDot: (enabled: boolean): React.CSSProperties => ({
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: enabled ? "#34d399" : "#475569",
      animation: enabled ? "tcm-pulse-green 2s infinite" : "none",
    }),
    statusText: (enabled: boolean): React.CSSProperties => ({
      fontSize: 11,
      color: enabled ? "#34d399" : "#475569",
      fontWeight: 500,
    }),
    subCount: {
      fontSize: 11,
      color: "#64748b",
    },
    addChannelBtn: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "12px 14px",
      margin: "8px",
      borderRadius: 14,
      background: "rgba(99,102,241,0.08)",
      border: "1.5px dashed rgba(99,102,241,0.3)",
      color: "#818cf8",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      width: "calc(100% - 16px)",
      transition: "all 0.2s",
    },
    /* stats row in channel card */
    statsRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 6,
      padding: "0 8px 10px",
      marginTop: -2,
    },
    statChip: {
      background: "rgba(255,255,255,0.04)",
      borderRadius: 8,
      padding: "6px 8px",
      textAlign: "center" as const,
    },
    statVal: {
      fontSize: 12,
      fontWeight: 700,
      color: "#c7d2fe",
    },
    statLabel: {
      fontSize: 10,
      color: "#475569",
      marginTop: 1,
    },
    /* right panel */
    rightPanel: {
      background: "rgba(15,23,42,0.6)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(99,102,241,0.15)",
      borderRadius: 20,
      overflow: "hidden",
    },
    panelHeader: {
      padding: "20px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    panelTitle: {
      fontSize: 16,
      fontWeight: 700,
      color: "#f1f5f9",
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    toggleWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    toggleLabel: {
      fontSize: 13,
      color: "#94a3b8",
    },
    toggle: (on: boolean): React.CSSProperties => ({
      width: 44,
      height: 24,
      borderRadius: 12,
      background: on
        ? "linear-gradient(135deg,#34d399,#10b981)"
        : "rgba(71,85,105,0.6)",
      border: "none",
      cursor: "pointer",
      position: "relative",
      transition: "background 0.3s",
      boxShadow: on ? "0 0 10px rgba(52,211,153,0.4)" : "none",
    }),
    toggleThumb: (on: boolean): React.CSSProperties => ({
      position: "absolute",
      top: 3,
      left: on ? 23 : 3,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "#fff",
      transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    }),
    panelBody: {
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    },
    section: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: "#64748b",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      paddingBottom: 10,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    fieldRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    label: {
      fontSize: 12,
      fontWeight: 600,
      color: "#94a3b8",
      letterSpacing: "0.04em",
    },
    inputWrap: {
      position: "relative",
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: 12,
      background: "rgba(15,23,42,0.8)",
      border: "1px solid rgba(99,102,241,0.2)",
      color: "#e2e8f0",
      fontSize: 14,
      outline: "none",
      transition: "border-color 0.2s",
      boxSizing: "border-box" as const,
    },
    inputPr: {
      paddingRight: 44,
    },
    eyeBtn: {
      position: "absolute",
      right: 12,
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: "#64748b",
      cursor: "pointer",
      padding: 2,
      display: "flex",
      alignItems: "center",
      fontSize: 16,
    },
    testRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap" as const,
    },
    testBtn: (status: TestStatus): React.CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 20px",
      borderRadius: 12,
      border: "none",
      cursor: status === "loading" ? "not-allowed" : "pointer",
      fontWeight: 600,
      fontSize: 14,
      transition: "all 0.2s",
      background:
        status === "success"
          ? "linear-gradient(135deg,#34d399,#10b981)"
          : status === "error"
          ? "linear-gradient(135deg,#f87171,#ef4444)"
          : "linear-gradient(135deg,#6366f1,#8b5cf6)",
      color: "#fff",
      boxShadow:
        status === "success"
          ? "0 4px 14px rgba(52,211,153,0.4)"
          : status === "error"
          ? "0 4px 14px rgba(239,68,68,0.4)"
          : "0 4px 14px rgba(99,102,241,0.35)",
      opacity: status === "loading" ? 0.7 : 1,
    }),
    spinner: {
      width: 14,
      height: 14,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: "#fff",
      borderRadius: "50%",
      animation: "tcm-spin 0.7s linear infinite",
      display: "inline-block",
    },
    testMsg: (status: TestStatus): React.CSSProperties => ({
      fontSize: 13,
      color:
        status === "success" ? "#34d399" : status === "error" ? "#f87171" : "#64748b",
      fontWeight: 500,
    }),
    /* schedule */
    scheduleGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14,
    },
    daysRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: 6,
    },
    dayPill: (active: boolean): React.CSSProperties => ({
      padding: "5px 12px",
      borderRadius: 20,
      border: `1.5px solid ${active ? "#6366f1" : "rgba(99,102,241,0.2)"}`,
      background: active
        ? "linear-gradient(135deg,#6366f199,#8b5cf699)"
        : "rgba(15,23,42,0.5)",
      color: active ? "#e0e7ff" : "#475569",
      fontWeight: 600,
      fontSize: 12,
      cursor: "pointer",
      transition: "all 0.2s",
      userSelect: "none",
    }),
    /* permissions */
    permGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 10,
    },
    permItem: (on: boolean): React.CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 14px",
      borderRadius: 12,
      background: on
        ? "rgba(52,211,153,0.08)"
        : "rgba(15,23,42,0.5)",
      border: `1px solid ${on ? "rgba(52,211,153,0.25)" : "rgba(255,255,255,0.05)"}`,
      transition: "all 0.3s",
    }),
    permCheck: (on: boolean): React.CSSProperties => ({
      width: 18,
      height: 18,
      borderRadius: 5,
      border: `2px solid ${on ? "#34d399" : "#475569"}`,
      background: on ? "#34d399" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      color: "#0f172a",
      fontWeight: 700,
      flexShrink: 0,
      transition: "all 0.2s",
    }),
    permLabel: {
      fontSize: 13,
      color: "#94a3b8",
      fontWeight: 500,
    },
    checkPermsBtn: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 18px",
      borderRadius: 12,
      background: "rgba(99,102,241,0.15)",
      border: "1px solid rgba(99,102,241,0.3)",
      color: "#818cf8",
      fontWeight: 600,
      fontSize: 13,
      cursor: "pointer",
      transition: "all 0.2s",
      alignSelf: "flex-start" as const,
    },
    /* delete */
    deleteRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      paddingTop: 8,
      borderTop: "1px solid rgba(239,68,68,0.1)",
    },
    deleteBtn: (confirm: boolean): React.CSSProperties => ({
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 18px",
      borderRadius: 12,
      border: confirm ? "none" : "1px solid rgba(239,68,68,0.3)",
      cursor: "pointer",
      background: confirm
        ? "linear-gradient(135deg,#ef4444,#dc2626)"
        : "rgba(239,68,68,0.1)",
      color: confirm ? "#fff" : "#f87171",
      fontWeight: 600,
      fontSize: 13,
      transition: "all 0.25s",
      boxShadow: confirm ? "0 4px 14px rgba(239,68,68,0.4)" : "none",
    }),
    deleteHint: {
      fontSize: 12,
      color: "#475569",
    },
    /* empty state */
    emptyState: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "80px 40px",
      gap: 14,
      color: "#475569",
      textAlign: "center" as const,
    },
    emptyIcon: { fontSize: 48, opacity: 0.4 },
    emptyText: { fontSize: 15, fontWeight: 600, color: "#64748b" },
    /* modal overlay */
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      zIndex: 1000,
      animation: "tcm-fade-in 0.2s ease",
      padding: "0 0 0 0",
    },
    modal: {
      width: "100%",
      maxWidth: 520,
      background: "linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,27,75,0.98))",
      backdropFilter: "blur(40px)",
      border: "1px solid rgba(99,102,241,0.3)",
      borderBottom: "none",
      borderRadius: "24px 24px 0 0",
      padding: "32px",
      animation: "tcm-slide-up 0.35s cubic-bezier(0.34,1.2,0.64,1)",
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 700,
      color: "#f1f5f9",
      marginBottom: 24,
      display: "flex",
      alignItems: "center",
      gap: 10,
    },
    modalFields: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      marginBottom: 24,
    },
    modalActions: {
      display: "flex",
      gap: 12,
    },
    cancelBtn: {
      flex: 1,
      padding: "12px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.1)",
      color: "#94a3b8",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      transition: "all 0.2s",
    },
    submitBtn: {
      flex: 1,
      padding: "12px",
      borderRadius: 12,
      background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
      border: "none",
      color: "#fff",
      fontWeight: 600,
      fontSize: 14,
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(99,102,241,0.4)",
      transition: "all 0.2s",
    },
    activeIndicator: (color: string): React.CSSProperties => ({
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      width: 3,
      height: 24,
      borderRadius: "0 3px 3px 0",
      background: color,
      boxShadow: `0 0 8px ${color}`,
    }),
  };

  /* ─── RENDER ─── */
  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTitle}>
          <div style={s.headerIcon}>✈️</div>
          <div>
            <h1 style={s.h1}>Telegram Channel Manager</h1>
            <p style={s.subtitle}>
              {channels.length} channel{channels.length !== 1 ? "s" : ""} configured
            </p>
          </div>
        </div>
        <button
          style={s.addBtn}
          onClick={() => setShowModal(true)}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLButtonElement).style.opacity = "1")
          }
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
          Add Channel
        </button>
      </div>

      {/* Two-column layout */}
      <div style={s.twoCol}>
        {/* ── LEFT: Channel List ── */}
        <div style={s.leftPanel}>
          <div style={s.leftHeader}>Channels</div>
          <div style={s.channelList}>
            {channels.map((ch) => (
              <div key={ch.id}>
                <div
                  style={s.channelCard(ch.id === selectedId, ch.color)}
                  onClick={() => {
                    setSelectedId(ch.id);
                    setTestStatus("idle");
                    setTestMessage("");
                    setDeleteConfirm(false);
                    setShowToken(false);
                  }}
                >
                  {ch.id === selectedId && (
                    <div style={s.activeIndicator(ch.color)} />
                  )}
                  <div style={s.avatar(ch.color)}>{ch.avatar}</div>
                  <div style={s.channelInfo}>
                    <div style={s.channelName}>{ch.name}</div>
                    <div style={s.channelMeta}>
                      <div style={s.statusDot(ch.enabled)} />
                      <span style={s.statusText(ch.enabled)}>
                        {ch.enabled ? "Active" : "Disabled"}
                      </span>
                      <span style={{ color: "#334155", fontSize: 10 }}>·</span>
                      <span style={s.subCount}>
                        {formatSubscribers(ch.subscribers)} subs
                      </span>
                    </div>
                  </div>
                </div>
                {/* Stats mini row */}
                <div style={s.statsRow}>
                  {[
                    { val: ch.stats.postsSent.toLocaleString(), lbl: "Posts" },
                    { val: ch.stats.successRate + "%", lbl: "Success" },
                    { val: ch.stats.lastPost, lbl: "Last Post" },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} style={s.statChip}>
                      <div style={s.statVal}>{val}</div>
                      <div style={s.statLabel}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            style={s.addChannelBtn}
            onClick={() => setShowModal(true)}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(99,102,241,0.15)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(99,102,241,0.5)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(99,102,241,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                "rgba(99,102,241,0.3)";
            }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            Add Channel
          </button>
        </div>

        {/* ── RIGHT: Config Panel ── */}
        <div style={s.rightPanel}>
          {!selected ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>📡</div>
              <div style={s.emptyText}>Select a channel to configure</div>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div style={s.panelHeader}>
                <div style={s.panelTitle}>
                  <div
                    style={{
                      ...s.avatar(selected.color),
                      width: 36,
                      height: 36,
                      fontSize: 15,
                      borderRadius: 10,
                    }}
                  >
                    {selected.avatar}
                  </div>
                  {selected.name}
                </div>
                <div style={s.toggleWrap}>
                  <span style={s.toggleLabel}>
                    {selected.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <button
                    style={s.toggle(selected.enabled)}
                    onClick={() => updateChannel({ enabled: !selected.enabled })}
                    aria-label="Toggle channel"
                  >
                    <div style={s.toggleThumb(selected.enabled)} />
                  </button>
                </div>
              </div>

              <div style={s.panelBody}>
                {/* ── Basic Config ── */}
                <div style={s.section}>
                  <div style={s.sectionTitle}>Basic Configuration</div>

                  <div style={s.field}>
                    <label style={s.label}>Channel Name</label>
                    <input
                      style={s.input}
                      value={selected.name}
                      onChange={(e) => updateChannel({ name: e.target.value })}
                      placeholder="e.g. MOD APK Updates"
                    />
                  </div>

                  <div style={s.fieldRow}>
                    <div style={s.field}>
                      <label style={s.label}>Bot Token</label>
                      <div style={s.inputWrap}>
                        <input
                          style={{ ...s.input, ...s.inputPr }}
                          type={showToken ? "text" : "password"}
                          value={selected.botToken}
                          onChange={(e) => updateChannel({ botToken: e.target.value })}
                          placeholder="1234567890:AAAA..."
                        />
                        <button
                          style={s.eyeBtn}
                          onClick={() => setShowToken((p) => !p)}
                          tabIndex={-1}
                        >
                          {showToken ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>

                    <div style={s.field}>
                      <label style={s.label}>Chat ID</label>
                      <input
                        style={s.input}
                        value={selected.chatId}
                        onChange={(e) => updateChannel({ chatId: e.target.value })}
                        placeholder="-1001234567890"
                      />
                    </div>
                  </div>

                  {/* Test connection */}
                  <div style={s.testRow}>
                    <button
                      style={s.testBtn(testStatus)}
                      onClick={handleTest}
                      disabled={testStatus === "loading"}
                    >
                      {testStatus === "loading" ? (
                        <><div style={s.spinner} /> Testing...</>
                      ) : testStatus === "success" ? (
                        <>✅ Connected</>
                      ) : testStatus === "error" ? (
                        <>❌ Failed</>
                      ) : (
                        <>🔌 Test Connection</>
                      )}
                    </button>
                    {testMessage && (
                      <span style={s.testMsg(testStatus)}>{testMessage}</span>
                    )}
                  </div>
                </div>

                {/* ── Posting Schedule ── */}
                <div style={s.section}>
                  <div style={s.sectionTitle}>Posting Schedule</div>

                  <div style={s.scheduleGrid}>
                    <div style={s.field}>
                      <label style={s.label}>Post Time</label>
                      <input
                        style={s.input}
                        type="time"
                        value={selected.scheduleTime}
                        onChange={(e) =>
                          updateChannel({ scheduleTime: e.target.value })
                        }
                      />
                    </div>
                    <div style={s.field}>
                      <label style={s.label}>Timezone</label>
                      <select
                        style={{
                          ...s.input,
                          appearance: "none" as const,
                          cursor: "pointer",
                        }}
                        value={selected.timezone}
                        onChange={(e) =>
                          updateChannel({ timezone: e.target.value })
                        }
                      >
                        {TIMEZONES.map((tz) => (
                          <option
                            key={tz}
                            value={tz}
                            style={{ background: "#0f172a" }}
                          >
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Active Days</label>
                    <div style={s.daysRow}>
                      {DAYS.map((day) => (
                        <button
                          key={day}
                          style={s.dayPill(selected.scheduleDays.includes(day))}
                          onClick={() => toggleDay(day)}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Bot Permissions ── */}
                <div style={s.section}>
                  <div
                    style={{
                      ...s.sectionTitle,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Bot Permissions</span>
                    <button
                      style={s.checkPermsBtn}
                      onClick={handleCheckPerms}
                      disabled={checkingPerms}
                    >
                      {checkingPerms ? (
                        <><div style={s.spinner} /> Checking...</>
                      ) : (
                        <>🔍 Check Permissions</>
                      )}
                    </button>
                  </div>

                  <div style={s.permGrid}>
                    {(
                      [
                        ["canSendMessages", "Can Send Messages"],
                        ["canSendMedia", "Can Send Media"],
                        ["canEditMessages", "Can Edit Messages"],
                        ["canDeleteMessages", "Can Delete Messages"],
                      ] as [keyof TelegramChannel["permissions"], string][]
                    ).map(([key, label]) => (
                      <div
                        key={key}
                        style={s.permItem(selected.permissions[key])}
                      >
                        <div style={s.permCheck(selected.permissions[key])}>
                          {selected.permissions[key] ? "✓" : ""}
                        </div>
                        <span style={s.permLabel}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Danger Zone ── */}
                <div style={s.deleteRow}>
                  <button
                    style={s.deleteBtn(deleteConfirm)}
                    onClick={handleDelete}
                    onMouseLeave={() =>
                      setTimeout(() => setDeleteConfirm(false), 2000)
                    }
                  >
                    🗑️ {deleteConfirm ? "Confirm Delete" : "Delete Channel"}
                  </button>
                  {deleteConfirm && (
                    <span style={s.deleteHint}>
                      Click again to permanently remove this channel
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Add Channel Modal ── */}
      {showModal && (
        <div
          style={s.overlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div style={s.modal}>
            <div style={s.modalTitle}>
              <span style={{ fontSize: 24 }}>📡</span>
              Add New Channel
            </div>

            <div style={s.modalFields}>
              <div style={s.field}>
                <label style={s.label}>Channel Name</label>
                <input
                  style={s.input}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Gaming MODs"
                  autoFocus
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Bot Token</label>
                <div style={s.inputWrap}>
                  <input
                    style={{ ...s.input, ...s.inputPr }}
                    type={newShowToken ? "text" : "password"}
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="7123456789:AAHxxx..."
                  />
                  <button
                    style={s.eyeBtn}
                    onClick={() => setNewShowToken((p) => !p)}
                    tabIndex={-1}
                  >
                    {newShowToken ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div style={s.field}>
                <label style={s.label}>Chat ID</label>
                <input
                  style={s.input}
                  value={newChatId}
                  onChange={(e) => setNewChatId(e.target.value)}
                  placeholder="-1001234567890"
                />
              </div>
            </div>

            <div style={s.modalActions}>
              <button
                style={s.cancelBtn}
                onClick={() => setShowModal(false)}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.08)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.05)")
                }
              >
                Cancel
              </button>
              <button
                style={{
                  ...s.submitBtn,
                  opacity:
                    !newName.trim() || !newToken.trim() || !newChatId.trim()
                      ? 0.5
                      : 1,
                  cursor:
                    !newName.trim() || !newToken.trim() || !newChatId.trim()
                      ? "not-allowed"
                      : "pointer",
                }}
                onClick={handleAddChannel}
                disabled={
                  !newName.trim() || !newToken.trim() || !newChatId.trim()
                }
              >
                ➕ Add Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
