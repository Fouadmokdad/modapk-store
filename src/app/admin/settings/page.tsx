"use client";

// =============================================================================
// Admin Settings Control Panel — Premium Dashboard Layout
// =============================================================================
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteSettings } from "@/lib/settings";

const sections = [
  { id: "general", label: "⚙️ General", desc: "Global site titles and primary contact coordinates" },
  { id: "seo", label: "🔍 SEO Config", desc: "Site metadata canonicalization and alternates defaults" },
  { id: "homepage", label: "🏠 Homepage", desc: "Configure visibility toggles for homepage app categories" },
  { id: "downloads", label: "⬇️ Downloads", desc: "Download countdown duration limits" },
  { id: "ads", label: "📢 Ads Settings", desc: "Configure responsive Google AdSense or mirror banner placeholder placements" },
  { id: "legal", label: "⚖️ Legal & Footer", desc: "Safety warnings, global disclaimers, and footer copyrights" },
  { id: "socials", label: "📱 Social Networks", desc: "Site connection urls for social media feeds" },
  { id: "telegram", label: "📢 Telegram", desc: "Configure Telegram channel auto-posting, bot tokens, and content layouts" },
  { id: "ai", label: "✨ AI Assistant", desc: "Configure custom OpenAI/Gemini credentials and models for description rewrites" },
];

export default function AdminSettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Settings Form State
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Telegram test connection states
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    if (!settings?.telegramChatId) {
      setConnectionResult({ success: false, message: "Chat ID is required to test connection." });
      return;
    }
    setTestingConnection(true);
    setConnectionResult(null);
    try {
      const res = await fetch("/api/admin/telegram-logs/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: settings.telegramBotToken,
          chatId: settings.telegramChatId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConnectionResult({ success: true, message: "Connection successful! Test message sent to Telegram." });
      } else {
        setConnectionResult({ success: false, message: data.error || "Failed to connect. Verify your Bot Token and Chat ID." });
      }
    } catch (err: any) {
      setConnectionResult({ success: false, message: err.message || "Network error. Please try again." });
    } finally {
      setTestingConnection(false);
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => {
        if (res.status === 401) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json && json.data) {
          setSettings(json.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        setError("Failed to fetch settings from API.");
        setLoading(false);
      });
  }, [router]);

  // Unsaved Changes warning handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const updateSetting = (updater: (prev: SiteSettings) => SiteSettings) => {
    if (!settings) return;
    setSettings(updater(settings));
    setHasUnsavedChanges(true);
    setError("");
    setSuccess("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const json = await res.json();

      if (!res.ok) {
        if (json.details && Array.isArray(json.details)) {
          const errors = json.details.map((d: any) => `${d.path.join(".")}: ${d.message}`).join(" | ");
          throw new Error(errors || "Validation failed");
        }
        throw new Error(json.error || "Failed to save settings");
      }

      setSuccess("Settings updated successfully!");
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setError(err.message || "Failed to update configurations");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    background: "hsl(var(--color-bg-secondary))",
    color: "hsl(var(--color-text-primary))",
    border: "1px solid hsl(var(--color-border))",
  };

  if (loading) {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="skeleton h-[300px] rounded-2xl md:col-span-1" />
          <div className="skeleton h-[500px] rounded-2xl md:col-span-3" />
        </div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <form onSubmit={handleSave} className="max-w-5xl">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
            Site Settings
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>
            Configure global variables, layouts, and countdown values dynamically
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          {hasUnsavedChanges && (
            <span className="text-xs font-semibold text-amber-500 animate-pulse">
              ⚠️ Unsaved changes
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all glow-pulse w-full sm:w-auto text-center"
            style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl text-sm" style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)" }}>
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3.5 rounded-xl text-sm" style={{ background: "hsl(142 71% 45% / 0.1)", color: "hsl(142 71% 45%)" }}>
          {success}
        </div>
      )}

      {/* Main Grid split */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div
          className="rounded-2xl p-3 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible no-scrollbar md:col-span-1 border shrink-0"
          style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}
        >
          {sections.map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                background: activeSection === sec.id ? "hsl(142 71% 45% / 0.1)" : "transparent",
                color: activeSection === sec.id ? "hsl(142 71% 45%)" : "hsl(var(--color-text-secondary))",
              }}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Configurations Dashboard Area */}
        <div
          className="rounded-2xl p-6 md:col-span-3 border space-y-6"
          style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
              {sections.find((s) => s.id === activeSection)?.label}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--color-text-tertiary))" }}>
              {sections.find((s) => s.id === activeSection)?.desc}
            </p>
          </div>

          <hr style={{ borderColor: "hsl(var(--color-border))" }} />

          {/* ============ GENERAL ============ */}
          {activeSection === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Site Title (English) *</label>
                  <input
                    type="text"
                    value={settings.siteTitle.en}
                    required
                    onChange={(e) => updateSetting((prev) => ({ ...prev, siteTitle: { ...prev.siteTitle, en: e.target.value } }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Site Title (Arabic) *</label>
                  <input
                    type="text"
                    value={settings.siteTitle.ar}
                    required
                    dir="rtl"
                    onChange={(e) => updateSetting((prev) => ({ ...prev, siteTitle: { ...prev.siteTitle, ar: e.target.value } }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Contact Email *</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  required
                  onChange={(e) => updateSetting((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Maintenance Mode</label>
                <label className="flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => updateSetting((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    Enable global platform maintenance screen block
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ============ SEO ============ */}
          {activeSection === "seo" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Site Canonical URL *</label>
                <input
                  type="url"
                  value={settings.siteUrl}
                  required
                  onChange={(e) => updateSetting((prev) => ({ ...prev, siteUrl: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Default Description (English) *</label>
                <textarea
                  value={settings.siteDescription.en}
                  required
                  rows={3}
                  onChange={(e) => updateSetting((prev) => ({ ...prev, siteDescription: { ...prev.siteDescription, en: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Default Description (Arabic) *</label>
                <textarea
                  value={settings.siteDescription.ar}
                  required
                  rows={3}
                  dir="rtl"
                  onChange={(e) => updateSetting((prev) => ({ ...prev, siteDescription: { ...prev.siteDescription, ar: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* ============ HOMEPAGE ============ */}
          {activeSection === "homepage" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                Homepage Section Visibility
              </label>

              <div className="space-y-3 mt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepageFeatured.showTrending}
                    onChange={(e) => updateSetting((prev) => ({
                      ...prev,
                      homepageFeatured: { ...prev.homepageFeatured, showTrending: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    Show "Trending This Week" horizontal feed
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepageFeatured.showLatest}
                    onChange={(e) => updateSetting((prev) => ({
                      ...prev,
                      homepageFeatured: { ...prev.homepageFeatured, showLatest: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    Show "Latest MOD APKs" card grid
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.homepageFeatured.showCategories}
                    onChange={(e) => updateSetting((prev) => ({
                      ...prev,
                      homepageFeatured: { ...prev.homepageFeatured, showCategories: e.target.checked }
                    }))}
                    className="w-4 h-4 rounded accent-green-500"
                  />
                  <span className="text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    Show "Browse Categories" chips directory
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* ============ DOWNLOADS ============ */}
          {activeSection === "downloads" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Download Countdown Duration (seconds) *
                </label>
                <input
                  type="number"
                  value={settings.downloadCountdown}
                  required
                  min={1}
                  max={60}
                  onChange={(e) => updateSetting((prev) => ({ ...prev, downloadCountdown: parseInt(e.target.value) || 10 }))}
                  className="w-full max-w-[200px] px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
                <p className="text-[10px] mt-1.5" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  Enter countdown seconds before showing direct link buttons (between 1 and 60 seconds).
                </p>
              </div>
            </div>
          )}

          {/* ============ ADS SETTINGS ============ */}
          {activeSection === "ads" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Before Countdown Ad Code / Placement
                </label>
                <textarea
                  value={settings.adsSettings?.beforeCountdown || ""}
                  rows={4}
                  onChange={(e) => updateSetting((prev) => ({
                    ...prev,
                    adsSettings: { ...(prev.adsSettings || { beforeCountdown: "", afterCountdown: "", sidebar: "" }), beforeCountdown: e.target.value }
                  }))}
                  placeholder="Paste Google AdSense responsive ad unit code or image banner HTML..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y font-mono text-xs"
                  style={inputStyle}
                />
                <p className="text-[10px] mt-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  This ad slot will be displayed at the top of the download container, directly above the countdown progress ring.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  After Countdown Ad Code / Placement
                </label>
                <textarea
                  value={settings.adsSettings?.afterCountdown || ""}
                  rows={4}
                  onChange={(e) => updateSetting((prev) => ({
                    ...prev,
                    adsSettings: { ...(prev.adsSettings || { beforeCountdown: "", afterCountdown: "", sidebar: "" }), afterCountdown: e.target.value }
                  }))}
                  placeholder="Paste Google AdSense responsive ad unit code or image banner HTML..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y font-mono text-xs"
                  style={inputStyle}
                />
                <p className="text-[10px] mt-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  This ad slot will be displayed below the countdown progress ring and action buttons.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Sidebar / Mobile Banner Ad Code
                </label>
                <textarea
                  value={settings.adsSettings?.sidebar || ""}
                  rows={4}
                  onChange={(e) => updateSetting((prev) => ({
                    ...prev,
                    adsSettings: { ...(prev.adsSettings || { beforeCountdown: "", afterCountdown: "", sidebar: "" }), sidebar: e.target.value }
                  }))}
                  placeholder="Paste Google AdSense vertical/responsive ad unit code..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y font-mono text-xs"
                  style={inputStyle}
                />
                <p className="text-[10px] mt-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  This ad slot is displayed on sidebar sections or responsive mobile layouts of countdown/download screens.
                </p>
              </div>
            </div>
          )}

          {/* ============ LEGAL ============ */}
          {activeSection === "legal" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Global Disclaimer (English) *</label>
                <textarea
                  value={settings.disclaimer.en}
                  required
                  rows={3}
                  onChange={(e) => updateSetting((prev) => ({ ...prev, disclaimer: { ...prev.disclaimer, en: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Global Disclaimer (Arabic) *</label>
                <textarea
                  value={settings.disclaimer.ar}
                  required
                  rows={3}
                  dir="rtl"
                  onChange={(e) => updateSetting((prev) => ({ ...prev, disclaimer: { ...prev.disclaimer, ar: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Footer Copyright Text (English) *</label>
                <input
                  type="text"
                  value={settings.footerText.en}
                  required
                  onChange={(e) => updateSetting((prev) => ({ ...prev, footerText: { ...prev.footerText, en: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Footer Copyright Text (Arabic) *</label>
                <input
                  type="text"
                  value={settings.footerText.ar}
                  required
                  dir="rtl"
                  onChange={(e) => updateSetting((prev) => ({ ...prev, footerText: { ...prev.footerText, ar: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* ============ SOCIALS ============ */}
          {activeSection === "socials" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Twitter URL</label>
                <input
                  type="url"
                  value={settings.socialLinks.twitter}
                  onChange={(e) => updateSetting((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                  }))}
                  placeholder="https://twitter.com/..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Facebook URL</label>
                <input
                  type="url"
                  value={settings.socialLinks.facebook}
                  onChange={(e) => updateSetting((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, facebook: e.target.value }
                  }))}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>GitHub URL</label>
                <input
                  type="url"
                  value={settings.socialLinks.github}
                  onChange={(e) => updateSetting((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, github: e.target.value }
                  }))}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
          )}

          {/* ============ TELEGRAM ============ */}
          {activeSection === "telegram" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                <div>
                  <h3 className="text-sm font-semibold text-white">Enable Telegram Auto Posting</h3>
                  <p className="text-xs text-neutral-400">Instantly post new apps and versions to your channel on publish</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.telegramEnabled}
                    onChange={(e) => updateSetting((prev) => ({ ...prev, telegramEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-neutral-300">Telegram Bot Token</label>
                  <input
                    type="password"
                    value={settings.telegramBotToken || ""}
                    placeholder="Paste bot token from @BotFather"
                    onChange={(e) => updateSetting((prev) => ({ ...prev, telegramBotToken: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono text-xs"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-neutral-300">Channel / Group Chat ID</label>
                  <input
                    type="text"
                    value={settings.telegramChatId || ""}
                    placeholder="e.g. -100XXXXXXXXXX or @channel_username"
                    onChange={(e) => updateSetting((prev) => ({ ...prev, telegramChatId: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestConnection}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 cursor-pointer disabled:opacity-50"
                >
                  {testingConnection ? "Testing Connection..." : "🔌 Test Telegram Connection"}
                </button>
              </div>

              {connectionResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs transition-all ${
                    connectionResult.success
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  <span className="font-semibold">{connectionResult.success ? "Success:" : "Error:"}</span> {connectionResult.message}
                </div>
              )}

              <hr style={{ borderColor: "hsl(var(--color-border))" }} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-neutral-300">Post Mode</label>
                  <select
                    value={settings.telegramPostMode}
                    onChange={(e) => updateSetting((prev) => ({ ...prev, telegramPostMode: e.target.value as any }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  >
                    <option value="INSTANT">⚡ Instant (Post immediately on publish)</option>
                    <option value="SCHEDULED">⏰ Scheduled (Save pending, post later)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-neutral-300">Default Hashtags</label>
                  <input
                    type="text"
                    value={settings.telegramDefaultHashtags || ""}
                    placeholder="#MODAPK #Premium #Android"
                    onChange={(e) => updateSetting((prev) => ({ ...prev, telegramDefaultHashtags: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Content Toggles</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramIncludeImage}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramIncludeImage: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Include App Image</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramIncludeModFeatures}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramIncludeModFeatures: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Include MOD Features</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramIncludeDownloadButton}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramIncludeDownloadButton: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Include Download Button</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramIncludeVersionInfo}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramIncludeVersionInfo: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Include Version Info</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramIncludeApkSize}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramIncludeApkSize: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Include APK Size</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramIncludeChangelog}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramIncludeChangelog: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Include Changelog</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Advanced Settings</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramSilentPost}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramSilentPost: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Silent Posts (No sound notifications)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <input
                      type="checkbox"
                      checked={settings.telegramPinPost}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, telegramPinPost: e.target.checked }))}
                      className="w-4 h-4 rounded accent-emerald-500"
                    />
                    <span className="text-xs text-neutral-300">Auto-pin important posts</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ============ AI ASSISTANT ============ */}
          {activeSection === "ai" && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  AI Provider Mode *
                </label>
                <select
                  value={settings.aiProvider || "AUTO"}
                  required
                  onChange={(e) => updateSetting((prev) => ({ ...prev, aiProvider: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="AUTO">🤖 Auto Fallback (Try active keys sequentially)</option>
                  <option value="GEMINI">Google Gemini API</option>
                  <option value="GROQ">Groq API (Ultra Fast)</option>
                  <option value="OPENAI">OpenAI API (ChatGPT)</option>
                  <option value="OPENROUTER">OpenRouter API</option>
                </select>
                <p className="text-[10px] mt-1.5" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  When set to Auto, the backend will sequentially fall back through your keys: Gemini ➔ Groq ➔ OpenAI ➔ OpenRouter.
                </p>
              </div>

              <hr style={{ borderColor: "hsl(var(--color-border))" }} />

              {/* Gemini Section */}
              {(settings.aiProvider === "AUTO" || settings.aiProvider === "GEMINI") && (
                <div className="space-y-4 p-4 rounded-xl border border-dashed" style={{ borderColor: "hsl(var(--color-border))" }}>
                  <h3 className="text-xs font-bold text-sky-400">Google Gemini API</h3>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Gemini API Key</label>
                    <input
                      type="password"
                      value={settings.aiGeminiKey || ""}
                      placeholder={settings.aiGeminiKey ? "••••••••••••••••" : "Paste your Gemini API Key..."}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiGeminiKey: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono text-xs"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Gemini Model</label>
                    <input
                      type="text"
                      value={settings.aiGeminiModel || ""}
                      placeholder="gemini-1.5-flash-latest"
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiGeminiModel: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Groq Section */}
              {(settings.aiProvider === "AUTO" || settings.aiProvider === "GROQ") && (
                <div className="space-y-4 p-4 rounded-xl border border-dashed" style={{ borderColor: "hsl(var(--color-border))" }}>
                  <h3 className="text-xs font-bold text-amber-400">Groq API</h3>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Groq API Key</label>
                    <input
                      type="password"
                      value={settings.aiGroqKey || ""}
                      placeholder={settings.aiGroqKey ? "••••••••••••••••" : "Paste your Groq API Key (gsk_...)"}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiGroqKey: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono text-xs"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Groq Model</label>
                    <input
                      type="text"
                      value={settings.aiGroqModel || ""}
                      placeholder="llama-3.3-70b-versatile"
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiGroqModel: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* OpenAI Section */}
              {(settings.aiProvider === "AUTO" || settings.aiProvider === "OPENAI") && (
                <div className="space-y-4 p-4 rounded-xl border border-dashed" style={{ borderColor: "hsl(var(--color-border))" }}>
                  <h3 className="text-xs font-bold text-emerald-400">OpenAI API</h3>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>OpenAI API Key</label>
                    <input
                      type="password"
                      value={settings.aiOpenAiKey || ""}
                      placeholder={settings.aiOpenAiKey ? "••••••••••••••••" : "Paste your OpenAI API Key (sk-...)"}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiOpenAiKey: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono text-xs"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>OpenAI Model</label>
                    <input
                      type="text"
                      value={settings.aiOpenAiModel || ""}
                      placeholder="gpt-4o-mini"
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiOpenAiModel: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}

              {/* OpenRouter Section */}
              {(settings.aiProvider === "AUTO" || settings.aiProvider === "OPENROUTER") && (
                <div className="space-y-4 p-4 rounded-xl border border-dashed" style={{ borderColor: "hsl(var(--color-border))" }}>
                  <h3 className="text-xs font-bold text-purple-400">OpenRouter API</h3>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>OpenRouter API Key</label>
                    <input
                      type="password"
                      value={settings.aiOpenRouterKey || ""}
                      placeholder={settings.aiOpenRouterKey ? "••••••••••••••••" : "Paste your OpenRouter API Key (sk-or-...)"}
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiOpenRouterKey: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none font-mono text-xs"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>OpenRouter Model</label>
                    <input
                      type="text"
                      value={settings.aiOpenRouterModel || ""}
                      placeholder="openrouter/free"
                      onChange={(e) => updateSetting((prev) => ({ ...prev, aiOpenRouterModel: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
