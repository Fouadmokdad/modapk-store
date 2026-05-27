import React, { useState, useEffect } from "react";

interface Version {
  id: string;
  versionName: string;
  versionCode: string | null;
  apkSize: string | null;
  androidRequirement: string | null;
  changelog: { en: string; ar: string } | null;
  modInfo: { en: string; ar: string } | null;
  isLatest: boolean;
  createdAt: string;
  downloadMirrors?: Mirror[];
}

interface Mirror {
  id: string;
  versionId: string;
  hostName: string;
  downloadUrl: string;
  redirectEnabled: boolean;
  priority: number;
  healthStatus: string;
  clickCount: number;
}

interface VersionsManagerProps {
  appId: string;
}

export function VersionsManager({ appId }: VersionsManagerProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Version form states
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [editingVersionId, setEditingVersionId] = useState<string | null>(null);
  const [versionForm, setVersionForm] = useState({
    versionName: "",
    versionCode: "",
    apkSize: "",
    androidRequirement: "",
    changelogEn: "",
    changelogAr: "",
    modInfoEn: "",
    modInfoAr: "",
    isLatest: false,
  });

  // Mirror form states
  const [showMirrorForm, setShowMirrorForm] = useState<string | null>(null); // versionId
  const [editingMirrorId, setEditingMirrorId] = useState<string | null>(null);
  const [mirrorForm, setMirrorForm] = useState({
    hostName: "",
    downloadUrl: "",
    redirectEnabled: true,
    priority: 0,
    healthStatus: "HEALTHY",
  });

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/apps/${appId}/versions`);
      const json = await res.json();
      if (res.ok) {
        setVersions(json.data || []);
      } else {
        setError(json.error || "Failed to load versions");
      }
    } catch {
      setError("Failed to fetch versions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [appId]);

  // Alert helpers
  const triggerSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  // Auto detect host from URL
  const handleUrlChange = (url: string) => {
    let host = "";
    if (url.includes("mediafire.com")) host = "MediaFire";
    else if (url.includes("mega.nz")) host = "Mega";
    else if (url.includes("drive.google.com")) host = "Google Drive";
    else if (url.includes("dropbox.com")) host = "Dropbox";
    else if (url.includes("apkadmin.com")) host = "APKAdmin";
    else if (url.includes("direct") || url.includes("cdn")) host = "Direct CDN";

    setMirrorForm((prev) => ({
      ...prev,
      downloadUrl: url,
      hostName: prev.hostName || host,
    }));
  };

  // Version CRUD
  const handleVersionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      versionName: versionForm.versionName,
      versionCode: versionForm.versionCode || null,
      apkSize: versionForm.apkSize || null,
      androidRequirement: versionForm.androidRequirement || null,
      changelog: {
        en: versionForm.changelogEn,
        ar: versionForm.changelogAr,
      },
      modInfo: {
        en: versionForm.modInfoEn,
        ar: versionForm.modInfoAr,
      },
      isLatest: versionForm.isLatest,
    };

    try {
      const url = editingVersionId
        ? `/api/apps/${appId}/versions/${editingVersionId}`
        : `/api/apps/${appId}/versions`;
      const method = editingVersionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (res.ok) {
        triggerSuccess(editingVersionId ? "Version updated successfully" : "Version created successfully");
        setShowVersionForm(false);
        setEditingVersionId(null);
        resetVersionForm();
        fetchVersions();
      } else {
        triggerError(json.error || "Failed to save version");
      }
    } catch {
      triggerError("Network error while saving version");
    }
  };

  const resetVersionForm = () => {
    setVersionForm({
      versionName: "",
      versionCode: "",
      apkSize: "",
      androidRequirement: "",
      changelogEn: "",
      changelogAr: "",
      modInfoEn: "",
      modInfoAr: "",
      isLatest: false,
    });
  };

  const startEditVersion = (v: Version) => {
    setEditingVersionId(v.id);
    setVersionForm({
      versionName: v.versionName,
      versionCode: v.versionCode || "",
      apkSize: v.apkSize || "",
      androidRequirement: v.androidRequirement || "",
      changelogEn: v.changelog?.en || "",
      changelogAr: v.changelog?.ar || "",
      modInfoEn: v.modInfo?.en || "",
      modInfoAr: v.modInfo?.ar || "",
      isLatest: v.isLatest,
    });
    setShowVersionForm(true);
  };

  const handleDeleteVersion = async (vId: string) => {
    if (!confirm("Are you sure you want to delete this version? All mirrors and downloads linked to it will be lost.")) return;

    try {
      const res = await fetch(`/api/apps/${appId}/versions/${vId}`, { method: "DELETE" });
      if (res.ok) {
        triggerSuccess("Version deleted successfully");
        fetchVersions();
      } else {
        const json = await res.json();
        triggerError(json.error || "Failed to delete version");
      }
    } catch {
      triggerError("Network error while deleting version");
    }
  };

  // Mirror CRUD
  const handleMirrorSubmit = async (e: React.FormEvent, versionId: string) => {
    e.preventDefault();
    setError("");

    try {
      const url = editingMirrorId
        ? `/api/apps/${appId}/versions/${versionId}/mirrors/${editingMirrorId}`
        : `/api/apps/${appId}/versions/${versionId}/mirrors`;
      const method = editingMirrorId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mirrorForm),
      });

      const json = await res.json();
      if (res.ok) {
        triggerSuccess(editingMirrorId ? "Mirror updated successfully" : "Mirror added successfully");
        setShowMirrorForm(null);
        setEditingMirrorId(null);
        resetMirrorForm();
        fetchVersions();
      } else {
        triggerError(json.error || "Failed to save mirror");
      }
    } catch {
      triggerError("Network error while saving mirror");
    }
  };

  const resetMirrorForm = () => {
    setMirrorForm({
      hostName: "",
      downloadUrl: "",
      redirectEnabled: true,
      priority: 0,
      healthStatus: "HEALTHY",
    });
  };

  const startEditMirror = (m: Mirror) => {
    setEditingMirrorId(m.id);
    setMirrorForm({
      hostName: m.hostName,
      downloadUrl: m.downloadUrl,
      redirectEnabled: m.redirectEnabled,
      priority: m.priority,
      healthStatus: m.healthStatus,
    });
    setShowMirrorForm(m.versionId);
  };

  const handleDeleteMirror = async (versionId: string, mId: string) => {
    if (!confirm("Are you sure you want to delete this mirror?")) return;

    try {
      const res = await fetch(`/api/apps/${appId}/versions/${versionId}/mirrors/${mId}`, { method: "DELETE" });
      if (res.ok) {
        triggerSuccess("Mirror deleted successfully");
        fetchVersions();
      } else {
        const json = await res.json();
        triggerError(json.error || "Failed to delete mirror");
      }
    } catch {
      triggerError("Network error while deleting mirror");
    }
  };

  const toggleLatest = async (v: Version) => {
    try {
      const res = await fetch(`/api/apps/${appId}/versions/${v.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionName: v.versionName,
          versionCode: v.versionCode,
          apkSize: v.apkSize,
          androidRequirement: v.androidRequirement,
          changelog: v.changelog,
          modInfo: v.modInfo,
          isLatest: !v.isLatest,
        }),
      });
      if (res.ok) {
        triggerSuccess(`Marked ${v.versionName} as latest`);
        fetchVersions();
      } else {
        const json = await res.json();
        triggerError(json.error || "Failed to toggle latest status");
      }
    } catch {
      triggerError("Network error while toggling latest status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notices */}
      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)" }}>
          ❌ {error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl text-sm" style={{ background: "hsl(142 71% 45% / 0.1)", color: "hsl(142 71% 45%)" }}>
          ✅ {success}
        </div>
      )}

      {/* Header and Version Add Button */}
      <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
        <div>
          <h3 className="text-lg font-bold text-white">App Versions & Download Gate Mirrors</h3>
          <p className="text-xs text-neutral-400">Manage separate app updates, changelogs, size metadata, anti-bot settings, and external mirror configurations.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetVersionForm();
            setEditingVersionId(null);
            setShowVersionForm(!showVersionForm);
          }}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:opacity-90 flex items-center gap-1.5"
          style={{ background: "var(--gradient-brand)" }}
        >
          {showVersionForm ? "Close Form" : "➕ Create New Version"}
        </button>
      </div>

      {/* Version Creation/Editing Modal Block */}
      {showVersionForm && (
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur-md space-y-4">
          <h4 className="text-sm font-bold text-emerald-400">
            {editingVersionId ? "✏️ Edit App Version Details" : "✨ Create New App Version"}
          </h4>
          <form onSubmit={handleVersionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Version Name (e.g. 2.24.1) *</label>
                <input
                  type="text"
                  required
                  value={versionForm.versionName}
                  onChange={(e) => setVersionForm({ ...versionForm, versionName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Version Code (e.g. 452301)</label>
                <input
                  type="text"
                  value={versionForm.versionCode}
                  onChange={(e) => setVersionForm({ ...versionForm, versionCode: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">APK File Size (e.g. 58 MB)</label>
                <input
                  type="text"
                  value={versionForm.apkSize}
                  onChange={(e) => setVersionForm({ ...versionForm, apkSize: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Android Requirement (e.g. 5.0+)</label>
                <input
                  type="text"
                  value={versionForm.androidRequirement}
                  onChange={(e) => setVersionForm({ ...versionForm, androidRequirement: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Changelog (English)</label>
                <textarea
                  rows={3}
                  value={versionForm.changelogEn}
                  onChange={(e) => setVersionForm({ ...versionForm, changelogEn: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Changelog (Arabic)</label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={versionForm.changelogAr}
                  onChange={(e) => setVersionForm({ ...versionForm, changelogAr: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-neutral-400 mb-1">MOD Info Details (English)</label>
                <textarea
                  rows={3}
                  value={versionForm.modInfoEn}
                  onChange={(e) => setVersionForm({ ...versionForm, modInfoEn: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">MOD Info Details (Arabic)</label>
                <textarea
                  rows={3}
                  dir="rtl"
                  value={versionForm.modInfoAr}
                  onChange={(e) => setVersionForm({ ...versionForm, modInfoAr: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLatest"
                checked={versionForm.isLatest}
                onChange={(e) => setVersionForm({ ...versionForm, isLatest: e.target.checked })}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="isLatest" className="text-xs text-neutral-300 font-semibold cursor-pointer">
                Mark as Latest Version (will automatically uncheck other versions)
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowVersionForm(false);
                  setEditingVersionId(null);
                  resetVersionForm();
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 bg-neutral-900 hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:opacity-95"
                style={{ background: "var(--gradient-brand)" }}
              >
                {editingVersionId ? "Update Version" : "Create Version"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version List Layout */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-24 rounded-2xl bg-neutral-900/60 animate-pulse" />
          <div className="h-24 rounded-2xl bg-neutral-900/60 animate-pulse" />
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/20">
          <span className="text-3xl block mb-2">📦</span>
          <p className="text-xs text-neutral-500 font-medium mb-4">No versions have been added to this application yet.</p>
          {!showVersionForm && (
            <button
              type="button"
              onClick={() => {
                resetVersionForm();
                setEditingVersionId(null);
                setShowVersionForm(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer hover:opacity-90 inline-flex items-center gap-1.5"
              style={{ background: "var(--gradient-brand)" }}
            >
              ➕ Create First Version
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {versions.map((v) => (
            <div
              key={v.id}
              className="p-6 rounded-2xl border transition-all duration-300 relative bg-neutral-900/40"
              style={{
                borderColor: v.isLatest ? "hsl(142 71% 45% / 0.3)" : "hsl(var(--color-border))",
                boxShadow: v.isLatest ? "0 0 15px hsl(142 71% 45% / 0.05)" : "none",
              }}
            >
              {/* Latest / Info badges */}
              <div className="flex flex-wrap gap-2 items-center justify-between mb-4 pb-3 border-b border-neutral-800/60">
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-white">v{v.versionName}</span>
                  {v.isLatest ? (
                    <span className="text-[9px] px-2 py-0.5 rounded font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      LATEST
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleLatest(v)}
                      className="text-[9px] px-2 py-0.5 rounded font-semibold uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-400 border border-neutral-700/20 cursor-pointer"
                    >
                      Mark Latest
                    </button>
                  )}
                  {v.apkSize && (
                    <span className="text-[10px] text-neutral-400 bg-neutral-800/40 px-2 py-0.5 rounded-lg border border-neutral-800">
                      💾 {v.apkSize}
                    </span>
                  )}
                  {v.androidRequirement && (
                    <span className="text-[10px] text-neutral-400 bg-neutral-800/40 px-2 py-0.5 rounded-lg border border-neutral-800">
                      🤖 Android {v.androidRequirement}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditVersion(v)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVersion(v.id)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 cursor-pointer"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>

              {/* Version metadata details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                {v.changelog?.en && (
                  <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-900">
                    <p className="font-bold text-neutral-400 mb-1">📢 Changelog (EN):</p>
                    <p className="text-neutral-300 leading-relaxed truncate">{v.changelog.en}</p>
                  </div>
                )}
                {v.modInfo?.en && (
                  <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-900">
                    <p className="font-bold text-neutral-400 mb-1">🛠️ MOD Info (EN):</p>
                    <p className="text-neutral-300 leading-relaxed truncate">{v.modInfo.en}</p>
                  </div>
                )}
              </div>

              {/* Version Mirrors Block */}
              <div className="mt-4 pt-4 border-t border-dashed border-neutral-800">
                <div className="flex justify-between items-center mb-3">
                  <h5 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    🛰️ Download Mirrors ({v.downloadMirrors?.length || 0})
                  </h5>
                  <button
                    type="button"
                    onClick={() => {
                      resetMirrorForm();
                      setEditingMirrorId(null);
                      setShowMirrorForm(showMirrorForm === v.id ? null : v.id);
                    }}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-pointer"
                  >
                    {showMirrorForm === v.id ? "Cancel Mirror" : "➕ Add External Mirror"}
                  </button>
                </div>

                {/* Mirror Form Block inside version */}
                {showMirrorForm === v.id && (
                  <form
                    onSubmit={(e) => handleMirrorSubmit(e, v.id)}
                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-950/40 space-y-3 mb-4"
                  >
                    <p className="text-[11px] font-bold text-emerald-400">
                      {editingMirrorId ? "✏️ Edit Mirror Options" : "✨ Configure External Mirror"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Destination URL *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://mediafire.com/file/..."
                          value={mirrorForm.downloadUrl}
                          onChange={(e) => handleUrlChange(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Host Label *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MediaFire, Google Drive"
                          value={mirrorForm.hostName}
                          onChange={(e) => setMirrorForm({ ...mirrorForm, hostName: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                          list="hosts-datalist"
                        />
                        <datalist id="hosts-datalist">
                          <option value="MediaFire" />
                          <option value="Mega" />
                          <option value="Google Drive" />
                          <option value="APKAdmin" />
                          <option value="Direct CDN" />
                          <option value="OneDrive" />
                          <option value="Dropbox" />
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Health Status</label>
                        <select
                          value={mirrorForm.healthStatus}
                          onChange={(e) => setMirrorForm({ ...mirrorForm, healthStatus: e.target.value })}
                          className="w-full px-2.5 py-2 rounded-lg text-xs outline-none bg-neutral-900 border border-neutral-800 text-white cursor-pointer"
                        >
                          <option value="HEALTHY">Verified Online (Healthy)</option>
                          <option value="SLOW">Slow Response</option>
                          <option value="DEAD">Offline / Broken Link</option>
                          <option value="REDIRECT_BROKEN">Redirect Cycle Broken</option>
                          <option value="REMOVED">File Removed by Host</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-0.5">Priority Weight (Higher first)</label>
                        <input
                          type="number"
                          value={mirrorForm.priority}
                          onChange={(e) => setMirrorForm({ ...mirrorForm, priority: parseInt(e.target.value) || 0 })}
                          className="w-full px-2.5 py-2 rounded-lg text-xs outline-none bg-neutral-900 border border-neutral-800 text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id={`redirectEnabled-${v.id}`}
                          checked={mirrorForm.redirectEnabled}
                          onChange={(e) => setMirrorForm({ ...mirrorForm, redirectEnabled: e.target.checked })}
                          className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`redirectEnabled-${v.id}`}
                          className="text-[10px] text-neutral-300 font-bold cursor-pointer"
                        >
                          Enable Secure Redirection
                        </label>
                      </div>
                      <div className="flex gap-2 justify-end pt-2 sm:pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMirrorForm(null);
                            setEditingMirrorId(null);
                            resetMirrorForm();
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-neutral-400 bg-neutral-900 hover:bg-neutral-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all cursor-pointer hover:opacity-95"
                          style={{ background: "var(--gradient-brand)" }}
                        >
                          {editingMirrorId ? "Update Mirror" : "Save Mirror"}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Mirror List inside version */}
                {!v.downloadMirrors || v.downloadMirrors.length === 0 ? (
                  <div className="text-center py-4 rounded-xl border border-neutral-900/60 bg-neutral-950/10 text-[10px] text-neutral-500">
                    No mirrors configured yet. Click "Add External Mirror" to set up download nodes.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {v.downloadMirrors.map((m) => {
                      let healthColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                      if (m.healthStatus === "SLOW") healthColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                      else if (m.healthStatus !== "HEALTHY") healthColor = "text-red-400 bg-red-500/10 border-red-500/20";

                      return (
                        <div
                          key={m.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-neutral-800 bg-neutral-950/20 gap-2 hover:border-neutral-700 transition-colors"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                            <span className="text-xs mt-1 sm:mt-0">🚀</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-neutral-200">{m.hostName}</span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 border ${healthColor}`}>
                                  {m.healthStatus}
                                </span>
                                <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase shrink-0 border ${
                                  m.redirectEnabled 
                                    ? "text-blue-400 bg-blue-500/10 border-blue-500/20" 
                                    : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                }`}>
                                  {m.redirectEnabled ? "Redirect On" : "Redirect Off"}
                                </span>
                              </div>
                              <span className="text-[9px] block text-neutral-500 truncate mt-0.5">
                                {m.downloadUrl}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 sm:shrink-0 text-[10px] font-semibold text-neutral-400 justify-end">
                            <div>
                              Clicks: <span className="text-white font-bold">{m.clickCount}</span>
                            </div>
                            <div>
                              Weight: <span className="text-white font-bold">{m.priority}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => startEditMirror(m)}
                                className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMirror(v.id, m.id)}
                                className="px-2 py-1 rounded bg-red-600/15 hover:bg-red-600/35 text-red-400 font-bold border border-red-500/20 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
