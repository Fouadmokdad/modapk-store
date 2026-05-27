"use client";

// =============================================================================
// Telegram Enterprise Platform — Premium Admin Dashboard
// Phase 2: Full SaaS-grade automation platform
// =============================================================================

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  renderTelegramTemplate,
  DEFAULT_TEMPLATE_SETTINGS,
  cleanHashtag,
  TelegramTemplateSettings,
} from "@/lib/telegram/telegramTemplates";

// ── Component Imports ─────────────────────────────────────────────────────────
import { TelegramPreview } from "@/components/admin/telegram/TelegramPreview";
import { TelegramPresetGallery } from "@/components/admin/telegram/TelegramPresetGallery";
import { TelegramAIPanel } from "@/components/admin/telegram/TelegramAIPanel";
import { TelegramBlockEditor } from "@/components/admin/telegram/TelegramBlockEditor";
import { TelegramButtonDesigner } from "@/components/admin/telegram/TelegramButtonDesigner";
import { TelegramAnalytics } from "@/components/admin/telegram/TelegramAnalytics";
import { TelegramChannelManager } from "@/components/admin/telegram/TelegramChannelManager";

// ─── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_APP = {
  appName: "spotify-premium",
  appTitleEn: "Spotify Premium",
  appTitleAr: "سبوتيفاي بريميوم",
  slug: "spotify-premium",
  categoryNameEn: "Music",
  tags: ["Music", "Streaming", "Premium"],
  releaseType: "MOD",
  modFeatures: ["Premium Unlocked", "No Ads", "Unlimited Skips", "Offline Download", "HiFi Audio"],
  versionName: "v9.1.46",
  apkSize: "85 MB",
  androidRequirement: "7.0+",
  changelogEn: "Updated to latest version\nImproved streaming performance\nFixed stability issues on Android 14",
  developer: "Spotify Ltd.",
  downloadCount: 15430,
  publishedAt: new Date().toISOString(),
};

// ─── Navigation Sections ───────────────────────────────────────────────────────
type Section =
  | "template"
  | "blocks"
  | "presets"
  | "buttons"
  | "layout"
  | "hashtags"
  | "emojis"
  | "ai"
  | "analytics"
  | "channels";

interface NavSection {
  id: Section;
  label: string;
  icon: string;
  group: "editor" | "design" | "tools" | "insights";
  badge?: string;
}

const NAV_SECTIONS: NavSection[] = [
  // Editor
  { id: "template", label: "Template Editor", icon: "✏️", group: "editor" },
  { id: "blocks", label: "Block Editor", icon: "⬡", group: "editor", badge: "DnD" },
  { id: "presets", label: "Preset Gallery", icon: "🎨", group: "editor", badge: "10" },
  // Design
  { id: "buttons", label: "Button Designer", icon: "🔘", group: "design" },
  { id: "layout", label: "Layout Controls", icon: "⚙️", group: "design" },
  { id: "hashtags", label: "Hashtags", icon: "#️⃣", group: "design" },
  { id: "emojis", label: "Emojis", icon: "😊", group: "design" },
  // Tools
  { id: "ai", label: "AI Engine", icon: "🤖", group: "tools", badge: "NEW" },
  // Insights
  { id: "analytics", label: "Analytics", icon: "📊", group: "insights" },
  { id: "channels", label: "Channels", icon: "📡", group: "insights" },
];

const GROUP_LABELS: Record<string, string> = {
  editor: "Content Editor",
  design: "Design & Format",
  tools: "AI Tools",
  insights: "Insights & Management",
};

const VARIABLE_TOKENS = [
  { token: "{title}", color: "#22c55e" },
  { token: "{version}", color: "#3b82f6" },
  { token: "{size}", color: "#f59e0b" },
  { token: "{android}", color: "#10b981" },
  { token: "{category}", color: "#8b5cf6" },
  { token: "{date}", color: "#06b6d4" },
  { token: "{modFeatures}", color: "#f43f5e" },
  { token: "{changelog}", color: "#84cc16" },
  { token: "{developer}", color: "#a78bfa" },
  { token: "{downloads}", color: "#fb923c" },
  { token: "{hashtags}", color: "#38bdf8" },
  { token: "{footer}", color: "#e879f9" },
];

const LAYOUT_TOGGLES = [
  { key: "showTitle", label: "Title", icon: "📱" },
  { key: "showVersion", label: "Version", icon: "🏷️" },
  { key: "showSize", label: "APK Size", icon: "📦" },
  { key: "showAndroid", label: "Android", icon: "🤖" },
  { key: "showCategory", label: "Category", icon: "📂" },
  { key: "showDate", label: "Date", icon: "📅" },
  { key: "showModFeatures", label: "MOD Features", icon: "✨" },
  { key: "showChangelog", label: "Changelog", icon: "📋" },
  { key: "showHashtags", label: "Hashtags", icon: "#️⃣" },
  { key: "showFooter", label: "Footer", icon: "📌" },
];

// ─── Main Page Component ───────────────────────────────────────────────────────
export default function TelegramEnterprisePage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveBarRef = useRef<HTMLDivElement>(null);

  // Core state
  const [settings, setSettings] = useState<TelegramTemplateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("template");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Preview state
  const [appsList, setAppsList] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [previewData, setPreviewData] = useState<any>(SAMPLE_APP);
  const [renderedPreview, setRenderedPreview] = useState("");

  // UI state
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "connected" | "error">("unknown");
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [emojiJsonError, setEmojiJsonError] = useState("");

  // Fetch on mount
  useEffect(() => {
    fetch("/api/admin/telegram-settings")
      .then((r) => { if (r.status === 401) { router.push("/admin/login"); return null; } return r.json(); })
      .then((j) => { setSettings(j?.data || DEFAULT_TEMPLATE_SETTINGS); setLoading(false); })
      .catch(() => { setSettings(DEFAULT_TEMPLATE_SETTINGS); setLoading(false); });

    fetch("/api/apps?limit=100")
      .then((r) => r.json())
      .then((j) => { if (j?.data) setAppsList(j.data); })
      .catch(() => {});
  }, [router]);

  // Live preview
  useEffect(() => {
    if (settings) setRenderedPreview(renderTelegramTemplate(previewData, settings));
  }, [settings, previewData]);

  const updateSetting = useCallback((key: keyof TelegramTemplateSettings, value: any) => {
    setSettings((prev) => prev ? { ...prev, [key]: value } : null);
    setHasUnsaved(true);
  }, []);

  const showToast = useCallback((success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/telegram-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      showToast(true, "✅ Settings saved successfully!");
      setHasUnsaved(false);
    } catch (err: any) {
      showToast(false, err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestPost = async () => {
    if (!settings) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/telegram-settings/test-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, appData: previewData }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: "Test post sent! ✅" });
        setConnectionStatus("connected");
      } else {
        setTestResult({ success: false, message: data.error || "Failed to send." });
        setConnectionStatus("error");
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Network error." });
      setConnectionStatus("error");
    } finally {
      setSendingTest(false);
    }
  };

  const insertVariable = (token: string) => {
    const ta = textareaRef.current;
    if (!ta || !settings) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const newVal = ta.value.substring(0, s) + token + ta.value.substring(e);
    updateSetting("template", newVal);
    setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + token.length; }, 0);
  };

  const handleAppChange = async (appId: string) => {
    setSelectedAppId(appId);
    if (!appId) { setPreviewData(SAMPLE_APP); return; }
    try {
      const res = await fetch(`/api/apps/${appId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        const app = json.data;
        const lv = app.versions?.[0] || null;
        setPreviewData({
          appName: app.slug, appTitleEn: app.title?.en || "", appTitleAr: app.title?.ar || "",
          slug: app.slug, categoryNameEn: app.category?.name?.en || "",
          tags: app.tags?.map((t: any) => t.tag?.name?.en || t.tag?.slug).filter(Boolean) || [],
          releaseType: app.releaseType,
          modFeatures: Array.isArray(app.modFeatures) ? app.modFeatures.map((f: any) => f.en || f.ar || "") : [],
          versionName: lv?.versionName || "v1.0.0", apkSize: lv?.apkSize || lv?.size || "50 MB",
          androidRequirement: lv?.androidRequirement || lv?.minAndroid || "5.0+",
          changelogEn: lv?.changelog?.en || "", developer: app.developer || "Unknown Developer",
          downloadCount: app.downloadCount ?? 0, publishedAt: app.publishedAt || new Date().toISOString(),
          iconUrl: app.iconUrl, headerImageUrl: app.headerImageUrl,
        });
      }
    } catch { /* silent */ }
  };

  const handleExportJSON = () => {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "telegram_settings.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        if (json?.template) { setSettings(json); setHasUnsaved(true); showToast(true, "Settings imported!"); }
        else showToast(false, "Invalid settings file.");
      } catch { showToast(false, "Failed to parse JSON."); }
    };
    reader.readAsText(file); e.target.value = "";
  };

  const handleEmojiChange = (value: string) => {
    try { const p = JSON.parse(value); setEmojiJsonError(""); updateSetting("categoryEmojis", p); }
    catch { setEmojiJsonError("Invalid JSON format."); }
  };

  const charLength = renderedPreview.length;
  const warnings: string[] = [];
  if (settings?.enabled) {
    if (charLength > 1024) warnings.push(`Caption exceeds 1024 chars (${charLength})`);
    if (!settings.downloadButtonText?.trim()) warnings.push("Download button text is empty.");
  }

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (loading || !settings) {
    return (
      <div style={P.loadingRoot}>
        <style>{`
          @keyframes enterprise-spin { to { transform: rotate(360deg); } }
          @keyframes enterprise-pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }
          @keyframes enterprise-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        `}</style>
        <div style={P.loadingCard}>
          <div style={P.loadingIcon}>
            <TgIcon size={28} />
          </div>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 600 }}>Loading Platform...</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#229ed9", animation: `enterprise-pulse 1.2s ease ${i * 0.3}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groups = ["editor", "design", "tools", "insights"] as const;

  return (
    <div style={P.root}>
      <style>{`
        @keyframes enterprise-slide-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes enterprise-glow { 0%,100%{box-shadow:0 0 15px rgba(34,158,217,0.2)} 50%{box-shadow:0 0 30px rgba(34,158,217,0.5)} }
        @keyframes enterprise-spin { to{transform:rotate(360deg)} }
        @keyframes enterprise-border { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        @keyframes enterprise-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .ent-nav-item:hover { background: rgba(255,255,255,0.04) !important; }
        .ent-nav-item:hover .ent-nav-text { color: rgba(255,255,255,0.9) !important; }
        .ent-token:hover { filter: brightness(1.3); transform: scale(1.05); }
        .ent-save-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .ent-secondary:hover { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.9) !important; }
        .ent-toggle-row:hover { background: rgba(255,255,255,0.03) !important; }
        .ent-section-content { animation: enterprise-slide-up 0.25s ease; }
      `}</style>

      {/* ── Premium Header ──────────────────────────────────────────────────────── */}
      <header style={P.header}>
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: -40, left: 80, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(34,158,217,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -20, right: 200, width: 150, height: 150, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={P.headerLeft}>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={P.collapseBtn}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div style={P.headerIconWrap}>
            <TgIcon size={22} />
          </div>
          <div>
            <div style={P.headerBreadcrumb}>Settings / Integrations</div>
            <h1 style={P.headerTitle}>Telegram Automation</h1>
          </div>
          {/* Status badge */}
          <div style={{
            ...P.statusBadge,
            background: connectionStatus === "connected" ? "rgba(34,197,94,0.1)" : connectionStatus === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
            borderColor: connectionStatus === "connected" ? "rgba(34,197,94,0.3)" : connectionStatus === "error" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)",
            color: connectionStatus === "connected" ? "#4ade80" : connectionStatus === "error" ? "#f87171" : "rgba(255,255,255,0.35)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: connectionStatus === "connected" ? "#4ade80" : connectionStatus === "error" ? "#f87171" : "rgba(255,255,255,0.25)", boxShadow: connectionStatus === "connected" ? "0 0 6px #4ade80" : "none" }} />
            {connectionStatus === "connected" ? "Connected" : connectionStatus === "error" ? "Error" : "Not Tested"}
          </div>
        </div>

        <div style={P.headerRight}>
          {/* Master Toggle */}
          <div style={P.masterToggle}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Auto Posting</span>
            <PillToggle checked={settings.enabled} onChange={(v) => updateSetting("enabled", v)} accent="#22c55e" />
          </div>

          <button type="button" onClick={() => fileInputRef.current?.click()} className="ent-secondary" style={P.btnSec}>📥</button>
          <button type="button" onClick={handleExportJSON} className="ent-secondary" style={P.btnSec}>📤</button>
          <input type="file" ref={fileInputRef} onChange={handleImportJSON} accept=".json" style={{ display: "none" }} />

          <button
            type="button"
            disabled={sendingTest}
            onClick={handleSendTestPost}
            className="ent-secondary"
            style={{ ...P.btnSec, paddingLeft: 12, paddingRight: 12 }}
          >
            {sendingTest ? <SpinnerIcon /> : "✈️"} Test Post
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="ent-save-btn"
            style={{ ...P.btnPrimary, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? <><SpinnerIcon /> Saving...</> : <>{hasUnsaved ? "💾 Save*" : "💾 Save"}</>}
          </button>
        </div>
      </header>

      {/* ── Warnings Banner ─────────────────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div style={P.warningBanner}>
          ⚠️ {warnings.join(" · ")}
        </div>
      )}

      {/* ── 3-Column Layout ─────────────────────────────────────────────────────── */}
      <div style={P.layout}>

        {/* ── LEFT: Navigation Sidebar ─────────────────────────────────────────── */}
        <aside style={{ ...P.sidebar, width: sidebarCollapsed ? 64 : 220, transition: "width 0.25s ease" }}>
          {groups.map((group) => {
            const items = NAV_SECTIONS.filter(s => s.group === group);
            return (
              <div key={group} style={{ marginBottom: 4 }}>
                {!sidebarCollapsed && (
                  <div style={P.navGroupLabel}>{GROUP_LABELS[group]}</div>
                )}
                {items.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className="ent-nav-item"
                      onClick={() => setActiveSection(item.id)}
                      title={sidebarCollapsed ? item.label : undefined}
                      style={{
                        ...P.navItem,
                        background: isActive ? "rgba(34,158,217,0.12)" : "transparent",
                        borderColor: isActive ? "rgba(34,158,217,0.3)" : "transparent",
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      {!sidebarCollapsed && (
                        <span className="ent-nav-text" style={{ ...P.navItemText, color: isActive ? "#4fc3f7" : "rgba(255,255,255,0.5)", flex: 1, textAlign: "left" }}>
                          {item.label}
                        </span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(34,158,217,0.2)", color: "#4fc3f7", fontWeight: 800, letterSpacing: "0.05em" }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </aside>

        {/* ── MIDDLE: Main Editor Area ─────────────────────────────────────────── */}
        <main style={P.mainPanel}>
          <div className="ent-section-content" key={activeSection}>

            {/* ── SECTION: Template Editor ──────────────────────────────────────── */}
            {activeSection === "template" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="✏️" title="Template Editor" desc="Write your Telegram post using HTML formatting and dynamic variables" />

                {/* Token chips */}
                <div style={P.tokenBar}>
                  <span style={P.tokenBarLabel}>INSERT VARIABLE →</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {VARIABLE_TOKENS.map(v => (
                      <button
                        key={v.token}
                        type="button"
                        className="ent-token"
                        onClick={() => insertVariable(v.token)}
                        style={{ ...P.tokenChip, borderColor: v.color + "40", color: v.color, background: v.color + "10", transition: "all 0.15s ease" }}
                      >
                        {v.token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor */}
                <div style={P.editorWrap}>
                  <div style={P.editorTopBar}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e" }} />
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
                    </div>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>template.html</span>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: charLength > 1024 ? "#f87171" : charLength > 800 ? "#fbbf24" : "#4ade80" }}>
                        {charLength} chars
                      </span>
                      <button
                        type="button"
                        onClick={() => { updateSetting("template", DEFAULT_TEMPLATE_SETTINGS.template); }}
                        style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", background: "none", border: "none", cursor: "pointer" }}
                      >
                        ↺ Reset
                      </button>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    value={settings.template}
                    onChange={(e) => updateSetting("template", e.target.value)}
                    rows={18}
                    style={P.monacoEditor}
                    spellCheck={false}
                    placeholder="Design your Telegram post template..."
                  />
                  <div style={P.editorFooter}>
                    HTML tags supported: &lt;b&gt; &lt;i&gt; &lt;code&gt; &lt;a href="..."&gt;
                  </div>
                </div>
              </div>
            )}

            {/* ── SECTION: Block Editor ─────────────────────────────────────────── */}
            {activeSection === "blocks" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="⬡" title="Block Editor" desc="Drag and drop content blocks to reorder your post structure" />
                <TelegramBlockEditor onTemplateChange={(t) => updateSetting("template", t)} />
              </div>
            )}

            {/* ── SECTION: Preset Gallery ───────────────────────────────────────── */}
            {activeSection === "presets" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="🎨" title="Template Presets" desc="Apply a professionally designed template preset with one click" />
                <TelegramPresetGallery
                  onApply={(patch) => {
                    setSettings((prev) => prev ? { ...prev, ...patch } : null);
                    setHasUnsaved(true);
                    showToast(true, "✅ Preset applied! Save to keep changes.");
                  }}
                  currentSettings={settings}
                />
              </div>
            )}

            {/* ── SECTION: Button Designer ──────────────────────────────────────── */}
            {activeSection === "buttons" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="🔘" title="Button Designer" desc="Customize your Telegram inline keyboard buttons" />
                <TelegramButtonDesigner
                  downloadButtonText={settings.downloadButtonText}
                  websiteButtonText={settings.websiteButtonText}
                  onDownloadChange={(v) => updateSetting("downloadButtonText", v)}
                  onWebsiteChange={(v) => updateSetting("websiteButtonText", v)}
                />
              </div>
            )}

            {/* ── SECTION: Layout Controls ──────────────────────────────────────── */}
            {activeSection === "layout" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="⚙️" title="Layout Controls" desc="Control which content sections appear in your post" />

                <Card>
                  <CardTitle>Typography</CardTitle>
                  <div style={P.twoCol}>
                    <div>
                      <label style={P.fieldLabel}>Title Style</label>
                      <select value={settings.titleStyle} onChange={(e) => updateSetting("titleStyle", e.target.value)} style={P.selectField}>
                        <option value="normal">Normal Text</option>
                        <option value="uppercase">UPPERCASE TEXT</option>
                        <option value="bold">Bold Text</option>
                        <option value="premium">🔥 Bold Premium Uppercase 🔥</option>
                      </select>
                    </div>
                    <div>
                      <label style={P.fieldLabel}>Date Format</label>
                      <select value={settings.dateFormat} onChange={(e) => updateSetting("dateFormat", e.target.value)} style={P.selectField}>
                        <option value="long">May 27, 2026</option>
                        <option value="short">27 May 2026</option>
                        <option value="relative">Relative (2 hours ago)</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card>
                  <CardTitle>Content Blocks Visibility</CardTitle>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {LAYOUT_TOGGLES.map((t) => (
                      <label key={t.key} className="ent-toggle-row" style={P.toggleRow}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{t.icon}</span>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{t.label}</span>
                        </div>
                        <PillToggle
                          checked={!!(settings as any)[t.key]}
                          onChange={(v) => updateSetting(t.key as any, v)}
                          accent="#3b82f6"
                        />
                      </label>
                    ))}
                  </div>
                </Card>

                <Card>
                  <CardTitle>Footer Block</CardTitle>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <label style={P.fieldLabel}>Enable Footer</label>
                    <PillToggle checked={settings.showFooter} onChange={(v) => updateSetting("showFooter", v)} accent="#e879f9" />
                  </div>
                  <textarea
                    value={settings.footerText || ""}
                    onChange={(e) => updateSetting("footerText", e.target.value)}
                    rows={3}
                    style={{ ...P.monacoEditor, fontSize: 13, minHeight: 80 }}
                    placeholder="🚀 Join our channel for more premium MODs!"
                    disabled={!settings.showFooter}
                  />
                </Card>
              </div>
            )}

            {/* ── SECTION: Hashtags ─────────────────────────────────────────────── */}
            {activeSection === "hashtags" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="#️⃣" title="Hashtag Engine" desc="Auto-generate or customize hashtags for each post" />
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <CardTitle>Hashtag Configuration</CardTitle>
                    <PillToggle checked={settings.showHashtags} onChange={(v) => updateSetting("showHashtags", v)} accent="#38bdf8" />
                  </div>

                  <div style={{ padding: "12px 14px", background: "rgba(34,158,217,0.06)", border: "1px solid rgba(34,158,217,0.15)", borderRadius: 10, display: "flex", gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 16 }}>💡</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                      Leave template empty to <strong style={{ color: "rgba(255,255,255,0.85)" }}>auto-generate</strong> from app title, category, and tags.
                      Use <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3 }}>#&#123;title&#125;</code> and{" "}
                      <code style={{ fontFamily: "monospace", background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3 }}>#&#123;category&#125;</code> as dynamic tokens.
                    </span>
                  </div>

                  <label style={P.fieldLabel}>Custom Hashtag Template</label>
                  <input
                    type="text"
                    value={settings.hashtagsTemplate || ""}
                    onChange={(e) => updateSetting("hashtagsTemplate", e.target.value)}
                    style={P.inputField}
                    placeholder="#{title} #{category} #Premium #MODAPK"
                    disabled={!settings.showHashtags}
                  />

                  {settings.showHashtags && (
                    <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>Preview</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(settings.hashtagsTemplate
                          ? settings.hashtagsTemplate
                            .replace(/{title}/g, cleanHashtag(previewData.appTitleEn))
                            .replace(/{category}/g, cleanHashtag(previewData.categoryNameEn || ""))
                          : `#${cleanHashtag(previewData.appTitleEn)} #${cleanHashtag(previewData.categoryNameEn || "")} #MODAPK`
                        ).split(/\s+/).filter(Boolean).map((tag, i) => (
                          <span key={i} style={{ padding: "3px 10px", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 100, color: "#38bdf8", fontSize: 12, fontWeight: 600 }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* ── SECTION: Emojis ───────────────────────────────────────────────── */}
            {activeSection === "emojis" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="😊" title="Category Emojis" desc="Map categories to emojis for dynamic post formatting" />
                <Card>
                  <CardTitle>Emoji Map (JSON)</CardTitle>
                  {emojiJsonError && (
                    <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 12, marginBottom: 10 }}>
                      ⚠️ {emojiJsonError}
                    </div>
                  )}
                  <textarea
                    defaultValue={JSON.stringify(settings.categoryEmojis, null, 2)}
                    onChange={(e) => handleEmojiChange(e.target.value)}
                    rows={10}
                    style={{ ...P.monacoEditor, color: "#60a5fa" }}
                    placeholder={'{\n  "Music": "🎵",\n  "Games": "🎮"\n}'}
                  />
                </Card>

                <Card>
                  <CardTitle>Current Emoji Map</CardTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
                    {Object.entries(
                      typeof settings.categoryEmojis === "string"
                        ? (() => { try { return JSON.parse(settings.categoryEmojis); } catch { return {}; } })()
                        : (settings.categoryEmojis || {})
                    ).map(([cat, emoji]) => (
                      <div key={cat} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                        <span style={{ fontSize: 22 }}>{emoji as string}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{cat}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* ── SECTION: AI Engine ────────────────────────────────────────────── */}
            {activeSection === "ai" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="🤖" title="AI Content Engine" desc="Generate, optimize, and transform your Telegram posts with AI" />
                <TelegramAIPanel
                  currentTemplate={settings.template}
                  onApply={(newTemplate) => { updateSetting("template", newTemplate); showToast(true, "✅ AI content applied to editor!"); setActiveSection("template"); }}
                />
              </div>
            )}

            {/* ── SECTION: Analytics ────────────────────────────────────────────── */}
            {activeSection === "analytics" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="📊" title="Analytics Dashboard" desc="Monitor your Telegram posting performance and engagement" />
                <TelegramAnalytics />
              </div>
            )}

            {/* ── SECTION: Channels ─────────────────────────────────────────────── */}
            {activeSection === "channels" && (
              <div style={P.sectionWrap}>
                <SectionHeader icon="📡" title="Channel Management" desc="Configure and manage your Telegram bot channels" />
                <TelegramChannelManager />
              </div>
            )}

          </div>
        </main>

        {/* ── RIGHT: Live Preview Panel ─────────────────────────────────────────── */}
        <aside style={P.previewPanel}>
          {/* App Selector */}
          <div style={P.previewSelectorCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Live Preview</span>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px #22c55e" }} />
            </div>
            <select
              value={selectedAppId}
              onChange={(e) => handleAppChange(e.target.value)}
              style={P.selectField}
            >
              <option value="">✨ Sample: Spotify Premium</option>
              {appsList.map((app) => (
                <option key={app.id} value={app.id}>📦 {app.title.en}</option>
              ))}
            </select>
          </div>

          {/* Multi-Device Preview */}
          <TelegramPreview
            renderedText={renderedPreview}
            downloadButtonText={settings.downloadButtonText}
            websiteButtonText={settings.websiteButtonText}
            appImageUrl={previewData.iconUrl || previewData.headerImageUrl}
          />

          {/* Test Post Button */}
          <button
            type="button"
            disabled={sendingTest}
            onClick={handleSendTestPost}
            style={{ ...P.testPostBtn, opacity: sendingTest ? 0.7 : 1 }}
          >
            {sendingTest ? <><SpinnerIcon /> Sending...</> : <><TgIcon size={15} /> Send Test Post</>}
          </button>

          {testResult && (
            <div style={{
              padding: "10px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: "center",
              background: testResult.success ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${testResult.success ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
              color: testResult.success ? "#4ade80" : "#f87171",
            }}>
              {testResult.message}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[
              { val: charLength, label: "Chars", color: charLength > 1024 ? "#f87171" : "#4ade80" },
              { val: renderedPreview.split("\n").length, label: "Lines", color: "#4fc3f7" },
              { val: charLength > 1024 ? "⚠️ Long" : "✓ OK", label: "Image", color: charLength > 1024 ? "#f87171" : "#4ade80" },
            ].map((s) => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {/* ── Sticky Save Bar (shows when unsaved changes) ────────────────────────── */}
      {hasUnsaved && (
        <div style={P.saveBar} ref={saveBarRef}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fbbf24", boxShadow: "0 0 8px #fbbf24" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>You have unsaved changes</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => { setHasUnsaved(false); window.location.reload(); }}
              className="ent-secondary"
              style={{ ...P.btnSec, padding: "7px 14px" }}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="ent-save-btn"
              style={{ ...P.btnPrimary, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? <><SpinnerIcon /> Saving...</> : "💾 Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ─────────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          ...P.globalToast,
          background: "rgba(10,14,20,0.97)",
          borderColor: toast.success ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
          animation: "enterprise-slide-up 0.3s ease",
        }}>
          <span style={{ fontSize: 16 }}>{toast.success ? "✅" : "❌"}</span>
          <span style={{ color: toast.success ? "#4ade80" : "#f87171", fontSize: 13 }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.95)", margin: 0, letterSpacing: "-0.02em" }}>{title}</h2>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0, lineHeight: 1.4 }}>{desc}</p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 20, marginBottom: 16 }}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
      {children}
    </div>
  );
}

function PillToggle({ checked, onChange, accent }: { checked: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{ width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer", background: checked ? accent : "rgba(255,255,255,0.1)", padding: 0, position: "relative", transition: "background 0.2s ease, box-shadow 0.2s ease", flexShrink: 0, boxShadow: checked ? `0 0 10px ${accent}50` : "none" }}
      role="switch"
      aria-checked={checked}
    >
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left 0.2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
    </button>
  );
}

function TgIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.265 2.428a2.048 2.048 0 0 0-2.078-.324L2.266 9.339a2.043 2.043 0 0 0 .104 3.819l3.931 1.236 2.305 6.94c.171.513.737.793 1.25.622l2.787-.929a1.024 1.024 0 0 0 .606-.544l1.52-3.04 5.254 4.42a2.053 2.053 0 0 0 3.273-1.14L23.98 4.528a2.05 2.05 0 0 0-1.715-2.1z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ animation: "enterprise-spin 0.8s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ─── Page Styles ──────────────────────────────────────────────────────────────
const P: Record<string, React.CSSProperties> = {
  loadingRoot: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" },
  loadingCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 64px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, backdropFilter: "blur(20px)" },
  loadingIcon: { width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 0 40px rgba(34,158,217,0.4)" },

  root: { display: "flex", flexDirection: "column", gap: 0, maxWidth: "100%", minHeight: "calc(100vh - 64px)" },

  // Header
  header: { position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 24px", background: "rgba(255,255,255,0.018)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(12px)", flexWrap: "wrap", overflow: "hidden", marginBottom: 0 },
  headerLeft: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  headerRight: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  collapseBtn: { padding: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "rgba(255,255,255,0.5)", cursor: "pointer", display: "flex", alignItems: "center" },
  headerIconWrap: { width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", boxShadow: "0 6px 20px rgba(34,158,217,0.35)", flexShrink: 0 },
  headerBreadcrumb: { fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 500, letterSpacing: "0.05em" },
  headerTitle: { fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.95)", margin: 0, letterSpacing: "-0.02em" },
  statusBadge: { display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 100, fontSize: 11, fontWeight: 600, border: "1px solid", letterSpacing: "0.02em" },
  masterToggle: { display: "flex", alignItems: "center", gap: 8, padding: "7px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10 },
  btnSec: { padding: "7px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s ease" },
  btnPrimary: { padding: "8px 18px", background: "linear-gradient(135deg, #229ed9, #0088cc)", border: "none", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(34,158,217,0.35)", letterSpacing: "-0.01em", transition: "all 0.15s ease" },

  // Warning
  warningBanner: { padding: "10px 24px", background: "rgba(251,191,36,0.07)", borderBottom: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 12, fontWeight: 500 },

  // 3-col layout
  layout: { display: "grid", gridTemplateColumns: "auto 1fr 360px", flex: 1 },

  // Sidebar
  sidebar: { borderRight: "1px solid rgba(255,255,255,0.05)", padding: "16px 8px", display: "flex", flexDirection: "column", gap: 2, background: "rgba(0,0,0,0.15)", overflowY: "auto", minHeight: "calc(100vh - 120px)" },
  navGroupLabel: { fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "10px 10px 6px", marginTop: 8 },
  navItem: { display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, border: "1px solid", cursor: "pointer", transition: "all 0.15s ease", width: "100%", textAlign: "left" },
  navItemText: { fontSize: 12, fontWeight: 600, transition: "color 0.15s ease" },

  // Main panel
  mainPanel: { padding: "28px 28px 60px", overflow: "auto" },
  sectionWrap: { display: "flex", flexDirection: "column", maxWidth: 860 },

  // Preview panel
  previewPanel: { borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "16px 16px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto", background: "rgba(0,0,0,0.1)", position: "sticky", top: 0, height: "calc(100vh - 80px)" },
  previewSelectorCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 },

  // Template editor
  tokenBar: { display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, marginBottom: 16, flexWrap: "wrap" },
  tokenBarLabel: { fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", whiteSpace: "nowrap", paddingTop: 5 },
  tokenChip: { padding: "4px 10px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 11, fontFamily: "monospace", fontWeight: 700, display: "inline-block" },
  editorWrap: { borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.5)" },
  editorTopBar: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "rgba(0,0,0,0.3)", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  monacoEditor: { width: "100%", background: "transparent", color: "#86efac", fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace", fontSize: 12.5, lineHeight: 1.7, border: "none", outline: "none", resize: "vertical", padding: "16px", display: "block", boxSizing: "border-box", caretColor: "#22c55e" },
  editorFooter: { padding: "7px 16px", background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.04)", fontSize: 10, color: "rgba(255,255,255,0.25)" },

  // Form elements
  fieldLabel: { display: "block", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 },
  inputField: { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.85)", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  selectField: { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.85)", fontSize: 13, padding: "10px 14px", outline: "none", cursor: "pointer", boxSizing: "border-box" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, cursor: "pointer", transition: "background 0.15s ease" },

  // Preview
  testPostBtn: { width: "100%", padding: "12px", background: "linear-gradient(135deg, #229ed9, #0088cc)", border: "none", borderRadius: 12, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 20px rgba(34,158,217,0.3)", letterSpacing: "-0.01em", transition: "all 0.2s ease" },

  // Save bar
  saveBar: { position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 28px", background: "rgba(10,14,20,0.97)", borderTop: "1px solid rgba(251,191,36,0.25)", backdropFilter: "blur(20px)", boxShadow: "0 -8px 32px rgba(0,0,0,0.5)", animation: "enterprise-slide-up 0.3s ease" },

  // Toast
  globalToast: { position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 14, border: "1px solid", boxShadow: "0 20px 60px rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" },
};
