"use client";

// =============================================================================
// Telegram Template Manager — Live Preview Settings Dashboard
// =============================================================================

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  renderTelegramTemplate, 
  generateTelegramButtons,
  DEFAULT_TEMPLATE_SETTINGS, 
  cleanHashtag,
  TelegramTemplateSettings 
} from "@/lib/telegram/telegramTemplates";

const SAMPLE_APP = {
  appName: "spotify-premium",
  appTitleEn: "Spotify Premium",
  appTitleAr: "سبوتيفاي بريميوم",
  slug: "spotify-premium",
  categoryNameEn: "Music",
  tags: ["Music", "Streaming", "Premium"],
  releaseType: "MOD",
  modFeatures: ["Premium Unlocked", "No Ads", "Unlimited Skips", "Offline Download"],
  versionName: "v9.1.46",
  apkSize: "85 MB",
  androidRequirement: "7.0+",
  changelogEn: "Updated to latest version\nImproved streaming performance\nFixed stability issues on Android 14",
  changelogAr: "تم التحديث لآخر إصدار\nتحسين أداء البث الموسيقي\nإصلاح مشاكل الاستقرار",
  developer: "Spotify Ltd.",
  downloadCount: 15430,
  publishedAt: new Date().toISOString(),
};

const HELPER_VARIABLES = [
  { token: "{title}", desc: "App Title (Stylized)" },
  { token: "{version}", desc: "Version Name (v1.0)" },
  { token: "{size}", desc: "APK File Size (80 MB)" },
  { token: "{android}", desc: "Android Requirement (5.0+)" },
  { token: "{category}", desc: "Category with Emoji" },
  { token: "{date}", desc: "Publish/Update Date" },
  { token: "{modFeatures}", desc: "Bulletpoints of MOD Features" },
  { token: "{changelog}", desc: "Bulletpoints of Changelog" },
  { token: "{developer}", desc: "App Developer Name" },
  { token: "{downloads}", desc: "Downloads Format (15K)" },
  { token: "{hashtags}", desc: "Hashtags Block" },
  { token: "{footer}", desc: "Footer Text block" }
];

export default function TelegramTemplatePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<TelegramTemplateSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // App Selection & Live Preview
  const [appsList, setAppsList] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [previewData, setPreviewData] = useState<any>(SAMPLE_APP);
  const [renderedPreview, setRenderedPreview] = useState("");
  const [emojiJsonError, setEmojiJsonError] = useState("");
  
  // Test send state
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // JSON Import/Export file ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch settings & apps list on mount
  useEffect(() => {
    // Fetch template settings
    fetch("/api/admin/telegram-settings")
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
        console.error("Failed to load telegram settings:", err);
        setError("Failed to fetch settings.");
        setLoading(false);
      });

    // Fetch apps list for selector
    fetch("/api/apps?limit=50")
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data) {
          setAppsList(json.data);
        }
      })
      .catch((err) => console.error("Failed to load apps:", err));
  }, [router]);

  // Handle live preview rendering on any state change
  useEffect(() => {
    if (settings) {
      const rendered = renderTelegramTemplate(previewData, settings);
      setRenderedPreview(rendered);
    }
  }, [settings, previewData]);

  // Load real app details for preview
  const handleAppChange = async (appId: string) => {
    setSelectedAppId(appId);
    if (!appId) {
      setPreviewData(SAMPLE_APP);
      return;
    }
    
    try {
      const res = await fetch(`/api/apps/${appId}`);
      const json = await res.json();
      if (res.ok && json.data) {
        const app = json.data;
        const latestVersion = app.versions?.[0] || null;
        
        const modFeaturesArray = app.modFeatures && Array.isArray(app.modFeatures)
          ? app.modFeatures.map((f: any) => f.en || f.ar || "")
          : [];

        const tagsArray = app.tags?.map((t: any) => t.tag?.name?.en || t.tag?.slug).filter(Boolean) || [];

        setPreviewData({
          appName: app.slug,
          appTitleEn: app.title?.en || "",
          appTitleAr: app.title?.ar || "",
          slug: app.slug,
          categoryNameEn: app.category?.name?.en || "",
          tags: tagsArray,
          releaseType: app.releaseType,
          modFeatures: modFeaturesArray,
          versionName: latestVersion?.versionName || "v1.0.0",
          apkSize: latestVersion?.apkSize || latestVersion?.size || "50 MB",
          androidRequirement: latestVersion?.androidRequirement || latestVersion?.minAndroid || "5.0+",
          changelogEn: latestVersion?.changelog?.en || "",
          changelogAr: latestVersion?.changelog?.ar || "",
          developer: app.developer || "Unknown Developer",
          downloadCount: app.downloadCount ?? 0,
          publishedAt: app.publishedAt || new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Failed to load app data for preview:", err);
      setError("Failed to fetch real app details.");
    }
  };

  const updateSetting = (key: keyof TelegramTemplateSettings, value: any) => {
    setSettings((prev) => {
      if (!prev) return null;
      return { ...prev, [key]: value };
    });
  };

  const handleEmojiChange = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      setEmojiJsonError("");
      updateSetting("categoryEmojis", parsed);
    } catch (err) {
      setEmojiJsonError("Invalid JSON format.");
    }
  };

  const insertVariable = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !settings) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newValue = before + token + after;
    
    updateSetting("template", newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + token.length;
    }, 0);
  };

  // Dispatch a live test post to Telegram using settings + previewData
  const handleSendTestPost = async () => {
    if (!settings) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/telegram-settings/test-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          appData: previewData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: "Test post successfully sent to Telegram channel!" });
      } else {
        setTestResult({ success: false, message: data.error || "Failed to dispatch test post." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Network error." });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/telegram-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save settings");
      }
      setSuccess("Telegram posting template settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update configurations.");
    } finally {
      setSaving(false);
    }
  };

  // Export Settings as JSON
  const handleExportJSON = () => {
    if (!settings) return;
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `telegram_template_settings.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Settings from JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        // Verify key parameters exist
        if (json && typeof json.template === "string") {
          setSettings(json);
          showToast(true, "Configurations imported successfully!");
        } else {
          showToast(false, "Invalid settings file format.");
        }
      } catch (err) {
        showToast(false, "Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset file selector
  };

  const [toastMessage, setToastMessage] = useState<{ success: boolean; message: string } | null>(null);
  const showToast = (success: boolean, message: string) => {
    setToastMessage({ success, message });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Validate limits & variables
  const warnings: string[] = [];
  const charLength = renderedPreview.length;
  
  // Warning checks
  if (settings) {
    if (settings.enabled) {
      // 1024 cap if image, 4096 if text
      if (settings.showTitle && charLength > 1024) {
        warnings.push(`⚠️ Telegram caption exceeds 1024 character limit with app image attached (Current: ${charLength}). It might be cut off or fail.`);
      } else if (charLength > 4096) {
        warnings.push(`⚠️ Telegram message text exceeds 4096 character limit (Current: ${charLength}). Post will fail.`);
      }

      // Check missing variables
      const checkVar = (toggle: boolean, token: string) => {
        if (toggle && !settings.template.includes(token)) {
          warnings.push(`💡 Switch "${token.replace(/{|}/g, "")}" is checked but token "${token}" is missing in the template text.`);
        }
      };
      
      checkVar(settings.showTitle, "{title}");
      checkVar(settings.showVersion, "{version}");
      checkVar(settings.showSize, "{size}");
      checkVar(settings.showAndroid, "{android}");
      checkVar(settings.showCategory, "{category}");
      checkVar(settings.showDate, "{date}");
      checkVar(settings.showModFeatures, "{modFeatures}");
      checkVar(settings.showChangelog, "{changelog}");
      checkVar(settings.showHashtags, "{hashtags}");
      checkVar(settings.showFooter, "{footer}");

      if (!settings.downloadButtonText.trim()) {
        warnings.push("⚠️ Download button text is empty.");
      }
      if (!settings.websiteButtonText.trim()) {
        warnings.push("⚠️ Website button text is empty.");
      }
    }
  }

  const inputStyle = {
    background: "hsl(var(--color-bg-secondary))",
    color: "hsl(var(--color-text-primary))",
    border: "1px solid hsl(var(--color-border))",
  };

  if (loading || !settings) {
    return (
      <div className="max-w-6xl space-y-6">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-[500px] rounded-2xl" />
          <div className="skeleton h-[500px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--color-text-primary))" }}>
            📢 Telegram Template Settings
          </h1>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Design a custom bilingual post structure, choose layouts, category emojis, and view live results.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.02] border border-white/10 hover:bg-white/5 text-neutral-300 cursor-pointer"
          >
            📤 Export JSON
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.02] border border-white/10 hover:bg-white/5 text-neutral-300 cursor-pointer"
          >
            📥 Import JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportJSON}
            accept=".json"
            className="hidden"
          />

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all glow-pulse cursor-pointer"
            style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </div>
      </div>

      {/* API Toasts */}
      {success && (
        <div className="mb-4 p-3.5 rounded-xl text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3.5 rounded-xl text-xs bg-red-500/10 text-red-400 border border-red-500/20">
          {error}
        </div>
      )}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl text-xs font-bold transition-all border flex items-center gap-2 animate-slide-up ${
            toastMessage.success
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-red-500/10 text-red-400 border-red-500/30"
          }`}
        >
          <span>{toastMessage.success ? "✅" : "❌"}</span>
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Template Configurator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Section 1: Template Editor */}
          <div className="card-flat p-5 border space-y-4" style={{ borderColor: "hsl(var(--color-border))" }}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Template Designer</h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-400">Template Mode:</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => updateSetting("enabled", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Code TextArea */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold mb-1 text-neutral-300">Layout Structure</label>
                <textarea
                  id="template-textarea"
                  ref={textareaRef}
                  value={settings.template}
                  rows={12}
                  onChange={(e) => updateSetting("template", e.target.value)}
                  className="w-full p-4 rounded-xl text-xs font-mono outline-none border focus:border-accent resize-y bg-black/40 text-emerald-400"
                  style={{ borderColor: "hsl(var(--color-border))" }}
                  placeholder="Design your Telegram template..."
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>HTML Formatting tags supported (b, i, code, a)</span>
                  <span>{charLength} characters</span>
                </div>
              </div>

              {/* Variable Tokens Helper */}
              <div className="sm:col-span-1 space-y-1.5 bg-white/[0.01] p-3 rounded-xl border border-white/5 max-h-[300px] overflow-y-auto">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Tokens Helper</span>
                {HELPER_VARIABLES.map((v) => (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => insertVariable(v.token)}
                    title={v.desc}
                    className="w-full text-left px-2 py-1.5 rounded bg-white/[0.02] hover:bg-emerald-500/10 hover:text-emerald-400 text-[10px] font-mono border border-white/5 truncate transition-all cursor-pointer text-neutral-300"
                  >
                    {v.token}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Layout Options & Selectors */}
          <div className="card-flat p-5 border space-y-4" style={{ borderColor: "hsl(var(--color-border))" }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Layout Options</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-neutral-300">Title Font Style</label>
                <select
                  value={settings.titleStyle}
                  onChange={(e) => updateSetting("titleStyle", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="normal">Normal Text</option>
                  <option value="uppercase">UPPERCASE TEXT</option>
                  <option value="bold">Bold Text <b></b></option>
                  <option value="premium">🔥 Bold Premium Uppercase 🔥</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-neutral-300">Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSetting("dateFormat", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="long">May 27, 2026</option>
                  <option value="short">27 May 2026</option>
                  <option value="relative">Relative (2 hours ago / today)</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { key: "showTitle", label: "Show Title" },
                { key: "showVersion", label: "Show Version" },
                { key: "showSize", label: "Show Size" },
                { key: "showAndroid", label: "Show Android" },
                { key: "showCategory", label: "Show Category" },
                { key: "showDate", label: "Show Date" },
                { key: "showModFeatures", label: "Show MOD Specs" },
                { key: "showChangelog", label: "Show Changelog" },
                { key: "showHashtags", label: "Show Hashtags" },
                { key: "showFooter", label: "Show Footer" },
              ].map((sw) => (
                <label
                  key={sw.key}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!(settings as any)[sw.key]}
                    onChange={(e) => updateSetting(sw.key as any, e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500"
                  />
                  <span className="text-[11px] text-neutral-300 font-medium">{sw.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Button Texts, Custom Footer and Hashtags */}
          <div className="card-flat p-5 border space-y-4" style={{ borderColor: "hsl(var(--color-border))" }}>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Footer & Inline Keyboard Config</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-neutral-300">Download Button Text</label>
                <input
                  type="text"
                  value={settings.downloadButtonText}
                  onChange={(e) => updateSetting("downloadButtonText", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-neutral-300">Website Button Text</label>
                <input
                  type="text"
                  value={settings.websiteButtonText}
                  onChange={(e) => updateSetting("websiteButtonText", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-neutral-300">Footer Text Block ({`{footer}`})</label>
              <textarea
                value={settings.footerText || ""}
                rows={2}
                onChange={(e) => updateSetting("footerText", e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs outline-none border focus:border-accent resize-none bg-black/10 text-neutral-200"
                style={{ borderColor: "hsl(var(--color-border))" }}
                placeholder="🚀 Join our channel for more mods!"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-neutral-300">Custom Hashtags Template ({`{hashtags}`})</label>
              <input
                type="text"
                value={settings.hashtagsTemplate || ""}
                onChange={(e) => updateSetting("hashtagsTemplate", e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                style={inputStyle}
                placeholder="e.g. #{title} #{category} #Premium #MODAPK"
              />
              <p className="text-[10px] text-neutral-500 mt-1">Leave empty to auto-generate from tags and app parameters.</p>
            </div>
          </div>

          {/* Section 4: Emoji Manager */}
          <div className="card-flat p-5 border space-y-4" style={{ borderColor: "hsl(var(--color-border))" }}>
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Category Emoji Manager</h3>
              {emojiJsonError && <span className="text-[10px] text-red-400 font-bold">{emojiJsonError}</span>}
            </div>
            
            <div>
              <textarea
                defaultValue={JSON.stringify(settings.categoryEmojis, null, 2)}
                rows={6}
                onChange={(e) => handleEmojiChange(e.target.value)}
                className="w-full p-3.5 rounded-xl text-xs font-mono outline-none border resize-y bg-black/40 text-blue-400"
                style={{ borderColor: "hsl(var(--color-border))" }}
                placeholder='{\n  "CategoryName": "Emoji"\n}'
              />
              <p className="text-[10px] text-neutral-500 mt-1">Specify key-value pairs matching Category Names (e.g. "Music": "🎵") to associate emojis in posts.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telegram Mobile Preview Card */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-8">
          {/* Preview Selector */}
          <div className="card-flat p-4 border flex flex-col gap-3" style={{ borderColor: "hsl(var(--color-border))" }}>
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Select App for Preview</h3>
            
            <select
              value={selectedAppId}
              onChange={(e) => handleAppChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
              style={inputStyle}
            >
              <option value="">✨ Use Sample App (Spotify Premium)</option>
              {appsList.map((app) => (
                <option key={app.id} value={app.id}>
                  📦 {app.title.en} ({app.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Warnings List */}
          {warnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 space-y-1">
              <h4 className="text-[11px] font-extrabold uppercase tracking-wider mb-1">Configuration Warnings</h4>
              {warnings.map((w, idx) => (
                <p key={idx} className="text-[10px] leading-relaxed">{w}</p>
              ))}
            </div>
          )}

          {/* Live Mobile Frame */}
          <div className="rounded-[40px] border-[12px] border-neutral-800 bg-neutral-950 p-4 shadow-2xl relative overflow-hidden aspect-[9/18] flex flex-col">
            {/* Speaker & Camera notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-6 bg-neutral-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-12 h-1 bg-neutral-800 rounded-full" />
            </div>

            {/* Telegram App Header Mockup */}
            <div className="pt-6 pb-2.5 px-3 bg-neutral-900/90 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-white text-xs">◀</span>
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center font-bold text-blue-400 text-xs">
                  MA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight">ModAPK Channel</h4>
                  <p className="text-[9px] text-neutral-400">14,235 subscribers</p>
                </div>
              </div>
              <span className="text-neutral-400 text-xs">⋮</span>
            </div>

            {/* Chat Body container */}
            <div 
              className="flex-1 overflow-y-auto p-3 space-y-4 relative"
              style={{
                backgroundImage: `radial-gradient(circle at 10px 10px, rgba(255,255,255,0.015) 12%, transparent 0)`,
                backgroundSize: "20px 20px"
              }}
            >
              {/* Message bubble card */}
              <div className="bg-neutral-900/90 rounded-2xl border border-white/5 shadow-md max-w-[90%] float-left overflow-hidden">
                {/* Photo Preview if enabled */}
                {settings.showTitle && (previewData.iconUrl || previewData.headerImageUrl) && (
                  <div className="w-full max-h-[160px] overflow-hidden border-b border-white/5 bg-black/20 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewData.iconUrl || previewData.headerImageUrl}
                      alt="Thumbnail Preview"
                      className="w-full h-auto object-cover min-h-[120px]"
                    />
                  </div>
                )}

                {/* Message Body Text */}
                <div className="p-3.5 text-xs text-neutral-100 leading-relaxed whitespace-pre-wrap font-sans">
                  <span dangerouslySetInnerHTML={{ __html: renderedPreview || "<i>Message text is empty...</i>" }} />
                </div>
                
                {/* Footer bar */}
                <div className="px-3 pb-1 text-right text-[9px] text-neutral-500">
                  11:58 AM
                </div>
              </div>

              {/* Inline Buttons Keyboard mockup */}
              <div className="clear-both pt-1.5 max-w-[90%]">
                <div className="flex gap-2">
                  <div className="flex-1 py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] text-center truncate">
                    {settings.downloadButtonText || "⬇️ DOWNLOAD MOD"}
                  </div>
                  <div className="flex-1 py-2 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[10px] text-center truncate">
                    {settings.websiteButtonText || "🌐 VISIT PAGE"}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Post Action Area */}
            <div className="pt-2 border-t border-white/5 bg-neutral-950 shrink-0">
              <button
                type="button"
                disabled={sendingTest}
                onClick={handleSendTestPost}
                className="w-full py-2.5 rounded-2xl text-xs font-bold text-white transition-all bg-blue-600 hover:bg-blue-500 disabled:opacity-50 cursor-pointer text-center"
              >
                {sendingTest ? "Dispatching Test Post..." : "✈️ Send Test Post to Telegram"}
              </button>
              
              {testResult && (
                <div
                  className={`mt-2 p-2.5 rounded-xl text-[10px] text-center ${
                    testResult.success
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
