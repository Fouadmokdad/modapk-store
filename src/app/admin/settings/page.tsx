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
        </div>
      </div>
    </form>
  );
}
