"use client";

// =============================================================================
// Admin App Create / Edit Page — With Premium Media Upload Pipeline
// =============================================================================
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { slugify } from "@/lib/utils";
import type { CategoryData } from "@/types/app";
import { VersionsManager } from "@/components/admin/VersionsManager";

type AiAction = "rewrite" | "rewrite-short" | "rewrite-full" | "translate-ar" | "meta-desc";

interface TagData {
  id: string;
  slug: string;
  name: { en: string; ar: string };
}

interface FormState {
  slug: string;
  packageName: string;
  status: "DRAFT" | "PUBLISHED" | "HIDDEN";
  type: "APP" | "GAME";
  releaseType: "ORIGINAL" | "MOD" | "BETA";
  title: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  description: { en: string; ar: string };
  iconUrl: string;
  headerImageUrl: string;
  developer: string;
  developerUrl: string;
  originalPlayStoreUrl: string;
  categoryId: string;
  rating: number;
  contentRating: string;
  installs: string;
  isFeatured: boolean;
  isTrending: boolean;
  tagIds: string[];
  safetyDisclaimer: { en: string; ar: string };
  modFeatures?: { en: string; ar: string }[] | null;
}

const emptyForm: FormState = {
  slug: "", packageName: "", status: "DRAFT", type: "APP", releaseType: "MOD",
  title: { en: "", ar: "" }, shortDescription: { en: "", ar: "" }, description: { en: "", ar: "" },
  iconUrl: "", headerImageUrl: "", developer: "", developerUrl: "",
  originalPlayStoreUrl: "", categoryId: "", rating: 0, contentRating: "",
  installs: "", isFeatured: false, isTrending: false, tagIds: [],
  safetyDisclaimer: { en: "", ar: "" },
  modFeatures: [],
};

// =============================================================================
// Reusable Drag & Drop File Upload Zone Component
// =============================================================================
interface FileUploadZoneProps {
  label: string;
  type: "icon" | "screenshot" | "category";
  slug: string;
  currentUrl?: string;
  onUploadSuccess: (url: string) => void;
}

function FileUploadZone({ label, type, slug, currentUrl, onUploadSuccess }: FileUploadZoneProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setProgress(15);

    try {
      const data = new FormData();
      data.append("file", file);
      data.append("type", type);
      data.append("slug", slug || "media");

      setProgress(40);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      setProgress(75);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Upload failed");
      }

      setProgress(100);
      onUploadSuccess(json.url);
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
        {label}
      </label>

      <div
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative group border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px]"
        style={{
          borderColor: dragActive ? "hsl(var(--color-accent))" : "hsl(var(--color-border))",
          background: dragActive ? "hsl(var(--color-accent-soft))" : "hsl(var(--color-bg-secondary) / 0.4)",
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          accept="image/png, image/jpeg, image/webp, image/avif, image/gif"
          className="hidden"
        />

        {uploading ? (
          <div className="space-y-3 w-full max-w-[200px]">
            <div className="text-xs font-medium" style={{ color: "hsl(var(--color-accent))" }}>
              Uploading... {progress}%
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden bg-neutral-800">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "var(--gradient-brand)" }}
              />
            </div>
          </div>
        ) : (
          <>
            <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📤</span>
            <span className="text-xs font-medium" style={{ color: "hsl(var(--color-text-secondary))" }}>
              Drag & Drop file here or <span style={{ color: "hsl(var(--color-accent))" }}>Browse</span>
            </span>
            <span className="text-[10px] mt-1" style={{ color: "hsl(var(--color-text-tertiary))" }}>
              JPEG, PNG, WebP, AVIF, GIF (Max 5MB)
            </span>
          </>
        )}

        {error && (
          <div className="absolute bottom-2 left-2 right-2 text-[10px] font-semibold truncate px-2 py-0.5 rounded"
            style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)" }}>
            {error}
          </div>
        )}
      </div>

      {currentUrl && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden mt-3 group border border-neutral-800">
          <Image src={currentUrl} alt="Preview" fill className="object-cover" unoptimized />
          <div
            onClick={(e) => { e.stopPropagation(); onUploadSuccess(""); }}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            <span className="text-white text-xs font-bold">Remove</span>
          </div>
        </div>
      )}
    </div>
  );
}

const isValidUrl = (url: string) => {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function AdminAppEditPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params?.id as string | undefined;
  const isEdit = !!appId && appId !== "new";

  const [form, setForm] = useState<FormState>(emptyForm);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("basic");

  // AI Rewrite Content States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState<AiAction | null>(null);
  const [originalContent, setOriginalContent] = useState({
    shortDescription: { en: "", ar: "" },
    description: { en: "", ar: "" },
  });
  const [previewContent, setPreviewContent] = useState({
    shortDescription: { en: "", ar: "" },
    fullDescription: { en: "", ar: "" },
  });

  // Screenshot states
  const [screenshots, setScreenshots] = useState<{ id: string; url: string; sortOrder: number }[]>([]);
  const [tempScreenshots, setTempScreenshots] = useState<string[]>([]);
  const [screenshotUploading, setScreenshotUploading] = useState(false);

  // Fetch categories and tags
  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/tags").then((r) => r.json()),
    ]).then(([catJson, tagJson]) => {
      setCategories(catJson.data || []);
      setTags(tagJson.data || []);
    });
  }, []);

  // Prevent background scroll when AI modal is open
  useEffect(() => {
    if (showAiModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAiModal]);

  // Fetch screenshots
  const fetchScreenshots = useCallback(async () => {
    if (!isEdit) return;
    try {
      const res = await fetch(`/api/apps/${appId}/screenshots`);
      const json = await res.json();
      setScreenshots(json.data || []);
    } catch (err) {
      console.error("Failed to fetch screenshots:", err);
    }
  }, [appId, isEdit]);

  // Fetch existing app if editing
  const fetchApp = useCallback(async () => {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/apps/${appId}`);
      const json = await res.json();
      if (json.data) {
        const app = json.data;
        setForm({
          slug: app.slug || "",
          packageName: app.packageName || "",
          status: app.status || "DRAFT",
          type: app.type || "APP",
          releaseType: app.releaseType || "MOD",
          title: app.title || { en: "", ar: "" },
          shortDescription: app.shortDescription || { en: "", ar: "" },
          description: app.description || { en: "", ar: "" },
          iconUrl: app.iconUrl || "",
          headerImageUrl: app.headerImageUrl || "",
          developer: app.developer || "",
          developerUrl: app.developerUrl || "",
          originalPlayStoreUrl: app.originalPlayStoreUrl || "",
          categoryId: app.categoryId || "",
          rating: app.rating || 0,
          contentRating: app.contentRating || "",
          installs: app.installs || "",
          isFeatured: app.isFeatured || false,
          isTrending: app.isTrending || false,
          tagIds: app.tags?.map((t: { tagId: string }) => t.tagId) || [],
          safetyDisclaimer: app.safetyDisclaimer || { en: "", ar: "" },
          modFeatures: app.modFeatures || [],
        });
        fetchScreenshots();
      }
    } catch (err) {
      console.error("Failed to fetch app:", err);
    } finally {
      setLoading(false);
    }
  }, [appId, isEdit, fetchScreenshots]);

  useEffect(() => { fetchApp(); }, [fetchApp]);

  const handleAutoSlug = () => {
    if (form.title.en) {
      setForm({ ...form, slug: slugify(form.title.en) });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const url = isEdit ? `/api/apps/${appId}` : "/api/apps";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to save");
        return;
      }

      // If creating a new app, batch save temporary screenshots to database
      if (!isEdit && tempScreenshots.length > 0) {
        await fetch(`/api/apps/${json.data.id}/screenshots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tempScreenshots.map((url, index) => ({ url, sortOrder: index }))),
        });
      }

      if (!isEdit) {
        router.push(`/admin/apps/${json.data.id}`);
      } else {
        fetchApp();
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  // Screenshot Upload Handler
  const handleScreenshotUpload = async (url: string) => {
    if (!url) return;
    if (isEdit) {
      // Save directly to DB
      try {
        await fetch(`/api/apps/${appId}/screenshots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, sortOrder: screenshots.length }),
        });
        fetchScreenshots();
      } catch (err) {
        console.error("Failed to save screenshot:", err);
      }
    } else {
      // Buffer in temp array
      setTempScreenshots([...tempScreenshots, url]);
    }
  };

  // Screenshot Delete Handler
  const handleScreenshotDelete = async (id: string, idx: number) => {
    if (isEdit) {
      try {
        await fetch(`/api/apps/${appId}/screenshots?screenshotId=${id}`, {
          method: "DELETE",
        });
        fetchScreenshots();
      } catch (err) {
        console.error("Failed to delete screenshot:", err);
      }
    } else {
      setTempScreenshots(tempScreenshots.filter((_, i) => i !== idx));
    }
  };

  // Screenshot Reordering Handler
  const handleScreenshotReorder = async (currentIndex: number, direction: "left" | "right") => {
    if (isEdit) {
      const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= screenshots.length) return;

      const newScreens = [...screenshots];
      const temp = newScreens[currentIndex];
      newScreens[currentIndex] = newScreens[newIndex];
      newScreens[newIndex] = temp;

      // Optimistic update
      setScreenshots(newScreens);

      try {
        // Delete all screenshots first
        for (const s of screenshots) {
          await fetch(`/api/apps/${appId}/screenshots?screenshotId=${s.id}`, { method: "DELETE" });
        }
        // Save in new sorted order
        await fetch(`/api/apps/${appId}/screenshots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newScreens.map((s, idx) => ({ url: s.url, sortOrder: idx }))),
        });
        fetchScreenshots();
      } catch (err) {
        console.error("Failed to reorder screenshots:", err);
      }
    } else {
      const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= tempScreenshots.length) return;

      const newTemps = [...tempScreenshots];
      const temp = newTemps[currentIndex];
      newTemps[currentIndex] = newTemps[newIndex];
      newTemps[newIndex] = temp;
      setTempScreenshots(newTemps);
    }
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm({ ...form, [key]: value });
  };

  const handleAiRewrite = async (action: AiAction) => {
    setAiLoading(true);
    setAiAction(action);

    const categoryObj = categories.find((c) => c.id === form.categoryId);
    const categoryName = categoryObj ? (categoryObj.name as Record<string, string>).en : "";

    const payload = {
      title: form.title,
      shortDescription: form.shortDescription,
      fullDescription: form.description,
      releaseType: form.releaseType,
      category: categoryName,
      modFeatures: form.modFeatures || [],
      action,
    };

    try {
      const res = await fetch("/api/ai/rewrite-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to rewrite content");
      }

      setOriginalContent({
        shortDescription: { ...form.shortDescription },
        description: { ...form.description },
      });

      setPreviewContent({
        shortDescription: json.shortDescription || { en: "", ar: "" },
        fullDescription: json.fullDescription || { en: "", ar: "" },
      });

      setShowAiModal(true);
    } catch (err: any) {
      alert(err.message || "Failed to generate AI content. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyRewrite = () => {
    if (!previewContent) return;

    if (aiAction === "rewrite" || aiAction === "translate-ar") {
      setForm((prev) => ({
        ...prev,
        shortDescription: { ...previewContent.shortDescription },
        description: { ...previewContent.fullDescription },
      }));
    } else if (aiAction === "rewrite-short" || aiAction === "meta-desc") {
      setForm((prev) => ({
        ...prev,
        shortDescription: { ...previewContent.shortDescription },
      }));
    } else if (aiAction === "rewrite-full") {
      setForm((prev) => ({
        ...prev,
        description: { ...previewContent.fullDescription },
      }));
    }

    setShowAiModal(false);
  };

  const inputStyle = {
    background: "hsl(var(--color-bg-secondary))",
    color: "hsl(var(--color-text-primary))",
    border: "1px solid hsl(var(--color-border))",
  };

  const tabs = [
    { id: "basic", label: "Basic Info" },
    { id: "content", label: "Content" },
    { id: "media", label: "Media" },
    { id: "mod", label: "MOD Features" },
    { id: "meta", label: "Metadata" },
    ...(isEdit ? [{ id: "versions", label: "Versions & Downloads" }] : []),
  ];

  if (loading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="skeleton h-8 w-48 rounded-xl" />
        <div className="skeleton h-[600px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {form.iconUrl && (
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-neutral-800 shrink-0">
              <Image src={form.iconUrl} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate" style={{ color: "hsl(var(--color-text-primary))" }}>
              {isEdit ? form.title.en || "Edit App" : "New App"}
            </h1>
            <p className="text-xs sm:text-sm truncate" style={{ color: "hsl(var(--color-text-secondary))" }}>
              {isEdit ? `/${form.slug}` : "Create a new MOD APK listing"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button type="button" onClick={() => router.push("/admin/apps")}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-sm font-medium text-center"
            style={{ color: "hsl(var(--color-text-secondary))", background: "hsl(var(--color-bg-secondary))", border: "1px solid hsl(var(--color-border))" }}>
            Cancel
          </button>
          {activeTab !== "versions" && (
            <button type="submit" form="app-edit-form" disabled={saving}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 text-center"
              style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}>
              {saving ? "Saving..." : isEdit ? "Update" : "Create"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)" }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
            style={{
              background: activeTab === tab.id ? "hsl(142 71% 45% / 0.1)" : "transparent",
              color: activeTab === tab.id ? "hsl(142 71% 45%)" : "hsl(var(--color-text-secondary))",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Card */}
      {activeTab === "versions" ? (
        <div className="rounded-2xl p-6" style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}>
          {appId && <VersionsManager appId={appId} />}
        </div>
      ) : (
        <form id="app-edit-form" onSubmit={handleSave} className="rounded-2xl p-6" style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}>
        {/* ============ BASIC INFO ============ */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Title (English) *</label>
                <input type="text" value={form.title.en} required
                  onChange={(e) => updateField("title", { ...form.title, en: e.target.value })}
                  onBlur={() => !form.slug && handleAutoSlug()}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Title (Arabic)</label>
                <input type="text" value={form.title.ar} dir="rtl"
                  onChange={(e) => updateField("title", { ...form.title, ar: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Slug *</label>
                <div className="flex gap-2">
                  <input type="text" value={form.slug} required
                    onChange={(e) => updateField("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
                  <button type="button" onClick={handleAutoSlug} className="px-3 py-2 rounded-xl text-xs font-medium"
                    style={{ background: "hsl(var(--color-bg-tertiary))", color: "hsl(var(--color-text-secondary))" }}>
                    Auto
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Package Name</label>
                <input type="text" value={form.packageName}
                  onChange={(e) => updateField("packageName", e.target.value)}
                  placeholder="com.example.app"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Status</label>
                <select value={form.status} onChange={(e) => updateField("status", e.target.value as FormState["status"])}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={inputStyle}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Type</label>
                <select value={form.type} onChange={(e) => updateField("type", e.target.value as FormState["type"])}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={inputStyle}>
                  <option value="APP">App</option>
                  <option value="GAME">Game</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Release Type</label>
                <select value={form.releaseType} onChange={(e) => updateField("releaseType", e.target.value as FormState["releaseType"])}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={inputStyle}>
                  <option value="ORIGINAL">Original</option>
                  <option value="MOD">MOD</option>
                  <option value="BETA">Beta</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Category</label>
                <select value={form.categoryId} onChange={(e) => updateField("categoryId", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={inputStyle}>
                  <option value="">— None —</option>
                  {categories.filter(c => c.type === form.type).map((cat) => (
                    <option key={cat.id} value={cat.id}>{(cat.name as Record<string, string>).en}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button key={tag.id} type="button"
                    onClick={() => {
                      const has = form.tagIds.includes(tag.id);
                      updateField("tagIds", has ? form.tagIds.filter(t => t !== tag.id) : [...form.tagIds, tag.id]);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: form.tagIds.includes(tag.id) ? "hsl(142 71% 45% / 0.15)" : "hsl(var(--color-bg-secondary))",
                      color: form.tagIds.includes(tag.id) ? "hsl(142 71% 45%)" : "hsl(var(--color-text-secondary))",
                      border: `1px solid ${form.tagIds.includes(tag.id) ? "hsl(142 71% 45% / 0.3)" : "hsl(var(--color-border))"}`,
                    }}>
                    {(tag.name as Record<string, string>).en}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured}
                  onChange={(e) => updateField("isFeatured", e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500" />
                <span className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isTrending}
                  onChange={(e) => updateField("isTrending", e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500" />
                <span className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>Trending</span>
              </label>
            </div>
          </div>
        )}

        {/* ============ CONTENT ============ */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-2xl border border-[hsl(var(--color-border))] bg-neutral-900/40 backdrop-blur-md gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <span className="text-lg">🤖</span> AI Content Assistant
                </h3>
                <p className="text-xs text-[hsl(var(--color-text-secondary))] mt-0.5">
                  Optimize your application's descriptions automatically with professional SEO copywriting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAiRewrite("rewrite")}
                disabled={aiLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold border border-green-500/30 hover:border-green-500/50 bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-green-950/20 group"
              >
                {aiLoading && aiAction === "rewrite" ? (
                  <span className="animate-spin">🌀</span>
                ) : (
                  <span className="transition-transform duration-300 group-hover:scale-110">✨</span>
                )}
                Rewrite All with AI
              </button>
            </div>

            {/* Short Description Section */}
            <div className="border border-[hsl(var(--color-border))] bg-neutral-900/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[hsl(var(--color-border))] gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Short Description</h4>
                  <p className="text-[10px] text-[hsl(var(--color-text-tertiary))]">Max 160 characters for optimal search snippets.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAiRewrite("rewrite-short")}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[hsl(var(--color-border))] hover:border-green-500/30 bg-neutral-900/60 hover:bg-green-500/5 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-green-400"
                  >
                    {aiLoading && aiAction === "rewrite-short" ? (
                      <span className="animate-spin text-[10px]">🌀</span>
                    ) : (
                      <span>✨</span>
                    )}
                    Rewrite Short
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAiRewrite("meta-desc")}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[hsl(var(--color-border))] hover:border-purple-500/30 bg-neutral-900/60 hover:bg-purple-500/5 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-purple-400"
                  >
                    {aiLoading && aiAction === "meta-desc" ? (
                      <span className="animate-spin text-[10px]">🌀</span>
                    ) : (
                      <span>🔍</span>
                    )}
                    Generate SEO Meta
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>Short Description (English)</label>
                  <textarea value={form.shortDescription.en} rows={3}
                    onChange={(e) => updateField("shortDescription", { ...form.shortDescription, en: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>Short Description (Arabic)</label>
                  <textarea value={form.shortDescription.ar} rows={3} dir="rtl"
                    onChange={(e) => updateField("shortDescription", { ...form.shortDescription, ar: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Full Description Section */}
            <div className="border border-[hsl(var(--color-border))] bg-neutral-900/10 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[hsl(var(--color-border))] gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Full Description</h4>
                  <p className="text-[10px] text-[hsl(var(--color-text-tertiary))]">Use HTML/Markdown headers and feature highlights.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAiRewrite("rewrite-full")}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[hsl(var(--color-border))] hover:border-green-500/30 bg-neutral-900/60 hover:bg-green-500/5 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-green-400"
                  >
                    {aiLoading && aiAction === "rewrite-full" ? (
                      <span className="animate-spin text-[10px]">🌀</span>
                    ) : (
                      <span>✨</span>
                    )}
                    Rewrite Full
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAiRewrite("translate-ar")}
                    disabled={aiLoading}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-[hsl(var(--color-border))] hover:border-purple-500/30 bg-neutral-900/60 hover:bg-purple-500/5 backdrop-blur-sm transition-all duration-300 flex items-center gap-1.5 cursor-pointer text-purple-400"
                  >
                    {aiLoading && aiAction === "translate-ar" ? (
                      <span className="animate-spin text-[10px]">🌀</span>
                    ) : (
                      <span>🌐</span>
                    )}
                    Translate to Arabic
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>Full Description (English)</label>
                  <textarea value={form.description.en} rows={12}
                    onChange={(e) => updateField("description", { ...form.description, en: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>Full Description (Arabic)</label>
                  <textarea value={form.description.ar} rows={12} dir="rtl"
                    onChange={(e) => updateField("description", { ...form.description, ar: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ MEDIA — SECURE UPLOAD PIPELINE ============ */}
        {activeTab === "media" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Icon Drag & Drop & URL */}
              <div className="space-y-3 p-4 rounded-xl border border-[hsl(var(--color-border))] bg-neutral-900/10">
                <FileUploadZone
                  label="App Icon Upload"
                  type="icon"
                  slug={form.slug}
                  currentUrl={form.iconUrl}
                  onUploadSuccess={(url) => updateField("iconUrl", url)}
                />
                <div className="pt-2 border-t border-[hsl(var(--color-border))]/50">
                  <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    Or Paste App Icon URL
                  </label>
                  <input
                    type="url"
                    value={form.iconUrl}
                    onChange={(e) => updateField("iconUrl", e.target.value)}
                    placeholder="https://example.com/icon.png"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={inputStyle}
                  />
                  {form.iconUrl && !isValidUrl(form.iconUrl) && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      ⚠️ Invalid URL format. Must start with http:// or https://
                    </p>
                  )}
                </div>
              </div>

              {/* Header Image Drag & Drop & URL */}
              <div className="space-y-3 p-4 rounded-xl border border-[hsl(var(--color-border))] bg-neutral-900/10">
                <FileUploadZone
                  label="Header Image Upload"
                  type="category" // category is used to denote generic category/header folder
                  slug={form.slug}
                  currentUrl={form.headerImageUrl}
                  onUploadSuccess={(url) => updateField("headerImageUrl", url)}
                />
                <div className="pt-2 border-t border-[hsl(var(--color-border))]/50">
                  <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                    Or Paste Header Image URL
                  </label>
                  <input
                    type="url"
                    value={form.headerImageUrl}
                    onChange={(e) => updateField("headerImageUrl", e.target.value)}
                    placeholder="https://example.com/header.jpg"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={inputStyle}
                  />
                  {form.headerImageUrl && !isValidUrl(form.headerImageUrl) && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      ⚠️ Invalid URL format. Must start with http:// or https://
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Screenshots Drag & Drop Manager */}
            <div className="border-t pt-6" style={{ borderColor: "hsl(var(--color-border))" }}>
              <div className="mb-4">
                <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--color-text-primary))" }}>
                  Screenshots Manager
                </h3>
                <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  Upload screenshots, drag & drop files, paste URLs, reorder, or remove screenshot items.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload Screenshots Drag & Drop zone */}
                <FileUploadZone
                  label="Add Screenshot File"
                  type="screenshot"
                  slug={form.slug}
                  onUploadSuccess={handleScreenshotUpload}
                />

                {/* Paste Screenshot URL */}
                <div className="p-5 rounded-2xl border border-[hsl(var(--color-border))] bg-neutral-900/10 flex flex-col justify-center space-y-3">
                  <div>
                    <label className="block text-xs font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>
                      Or Add Screenshot by URL
                    </label>
                    <p className="text-[10px] text-[hsl(var(--color-text-tertiary))]">Press Enter or click Add URL to append.</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      id="screenshot-url-input"
                      placeholder="https://example.com/screenshot.jpg"
                      className="flex-1 px-3 py-2.5 rounded-xl text-xs outline-none"
                      style={inputStyle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const input = e.currentTarget;
                          const val = input.value.trim();
                          if (val && (val.startsWith("http://") || val.startsWith("https://"))) {
                            handleScreenshotUpload(val);
                            input.value = "";
                          } else {
                            alert("Please enter a valid URL starting with http:// or https://");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById("screenshot-url-input") as HTMLInputElement;
                        const val = input?.value.trim();
                        if (val && (val.startsWith("http://") || val.startsWith("https://"))) {
                          handleScreenshotUpload(val);
                          if (input) input.value = "";
                        } else {
                          alert("Please enter a valid URL starting with http:// or https://");
                        }
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition-colors cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Screenshots Preview list */}
              {((isEdit ? screenshots : tempScreenshots).length > 0) ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                  {(isEdit ? screenshots : tempScreenshots.map((url, idx) => ({ id: String(idx), url, sortOrder: idx }))).map((s, idx, arr) => (
                    <div key={s.id} className="relative group rounded-xl overflow-hidden aspect-[9/16] border border-neutral-800 bg-neutral-950">
                      <Image src={s.url} alt="Screenshot" fill className="object-cover" unoptimized />
                      
                      {/* Hover action overlay */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 z-10">
                        <button
                          type="button"
                          onClick={() => handleScreenshotDelete(s.id, idx)}
                          className="self-end px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-600/80 hover:bg-red-600 text-white"
                        >
                          Remove
                        </button>
                        
                        <div className="flex gap-2 justify-center">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleScreenshotReorder(idx, "left")}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white"
                            >
                              ← Move
                            </button>
                          )}
                          {idx < arr.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleScreenshotReorder(idx, "right")}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white"
                            >
                              Move →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 rounded-xl border border-neutral-900 bg-neutral-950/20 text-xs mt-4"
                  style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  No screenshots uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ MOD FEATURES ============ */}
        {activeTab === "mod" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Safety Disclaimer (English)</label>
              <textarea value={form.safetyDisclaimer.en} rows={3}
                onChange={(e) => updateField("safetyDisclaimer", { ...form.safetyDisclaimer, en: e.target.value })}
                placeholder="This is a modified version. Use at your own risk..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Safety Disclaimer (Arabic)</label>
              <textarea value={form.safetyDisclaimer.ar} rows={3} dir="rtl"
                onChange={(e) => updateField("safetyDisclaimer", { ...form.safetyDisclaimer, ar: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y" style={inputStyle} />
            </div>
            <div className="p-4 rounded-xl" style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.15)" }}>
              <p className="text-xs font-medium" style={{ color: "hsl(38 92% 50%)" }}>
                ⚠️ MOD features list, anti-ban warning, and installation guide can be managed after creating the initial app entry via the version management section.
              </p>
            </div>
          </div>
        )}

        {/* ============ METADATA ============ */}
        {activeTab === "meta" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Developer</label>
                <input type="text" value={form.developer}
                  onChange={(e) => updateField("developer", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Developer URL</label>
                <input type="url" value={form.developerUrl}
                  onChange={(e) => updateField("developerUrl", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Original Play Store URL</label>
                <input type="url" value={form.originalPlayStoreUrl}
                  onChange={(e) => updateField("originalPlayStoreUrl", e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Rating (0-5)</label>
                <input type="number" value={form.rating} step={0.1} min={0} max={5}
                  onChange={(e) => updateField("rating", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Content Rating</label>
                <input type="text" value={form.contentRating}
                  onChange={(e) => updateField("contentRating", e.target.value)}
                  placeholder="Everyone, Teen, etc."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Installs</label>
                <input type="text" value={form.installs}
                  onChange={(e) => updateField("installs", e.target.value)}
                  placeholder="1,000,000+"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none" style={inputStyle} />
              </div>
            </div>
          </div>
        )}
        </form>
      )}

      {/* AI Preview Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950/90 backdrop-blur-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-900 flex justify-between items-center bg-neutral-900/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="text-lg font-bold text-white">AI Content Generation Preview</h3>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {aiAction}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="text-neutral-400 hover:text-white transition-colors text-xl p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT: ORIGINAL CONTENT */}
                <div className="border border-neutral-900/50 bg-neutral-950/40 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Original Content</span>
                    <span className="text-[10px] text-neutral-500">Before rewrite</span>
                  </div>

                  {/* Short Description */}
                  {(aiAction === "rewrite" || aiAction === "rewrite-short" || aiAction === "meta-desc" || aiAction === "translate-ar") && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-neutral-400">Short Description</h4>
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/20 text-xs">
                          <div className="text-[10px] text-neutral-500 mb-1 font-semibold">ENGLISH</div>
                          <p className="text-neutral-300">{originalContent.shortDescription.en || <span className="italic text-neutral-600">Empty</span>}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-neutral-900 bg-neutral-900/20 text-xs text-right" dir="rtl">
                          <div className="text-[10px] text-neutral-500 mb-1 font-semibold text-left" dir="ltr">ARABIC</div>
                          <p className="text-neutral-300">{originalContent.shortDescription.ar || <span className="italic text-neutral-600">فارغ</span>}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Description */}
                  {(aiAction === "rewrite" || aiAction === "rewrite-full" || aiAction === "translate-ar") && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-semibold text-neutral-400">Full Description</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] text-neutral-500 mb-1 font-semibold">ENGLISH</div>
                          <div className="max-h-[250px] overflow-y-auto p-3 rounded-lg border border-neutral-900 bg-neutral-900/20 text-xs text-neutral-300 whitespace-pre-wrap font-mono">
                            {originalContent.description.en || <span className="italic text-neutral-600">Empty</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-500 mb-1 font-semibold">ARABIC</div>
                          <div className="max-h-[250px] overflow-y-auto p-3 rounded-lg border border-neutral-900 bg-neutral-900/20 text-xs text-neutral-300 whitespace-pre-wrap font-mono text-right" dir="rtl">
                            {originalContent.description.ar || <span className="italic text-neutral-600">فارغ</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: AI REWRITTEN PREVIEW */}
                <div className="border border-green-500/10 bg-green-500/5 rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-green-500/10 pb-2">
                    <span className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1">
                      <span>✨</span> AI Rewritten Preview
                    </span>
                    <span className="text-[10px] text-green-500 font-medium">Ready to apply</span>
                  </div>

                  {/* Short Description */}
                  {(aiAction === "rewrite" || aiAction === "rewrite-short" || aiAction === "meta-desc" || aiAction === "translate-ar") && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-green-400">Short Description</h4>
                      <div className="space-y-2">
                        <div className="p-3 rounded-lg border border-green-500/20 bg-green-950/20 text-xs">
                          <div className="text-[10px] text-green-500/70 mb-1 font-semibold">ENGLISH</div>
                          <p className="text-white font-medium">{previewContent.shortDescription.en}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-green-500/20 bg-green-950/20 text-xs text-right" dir="rtl">
                          <div className="text-[10px] text-green-500/70 mb-1 font-semibold text-left" dir="ltr">ARABIC</div>
                          <p className="text-white font-medium">{previewContent.shortDescription.ar}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Full Description */}
                  {(aiAction === "rewrite" || aiAction === "rewrite-full" || aiAction === "translate-ar") && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-semibold text-green-400">Full Description</h4>
                      <div className="space-y-2">
                        <div>
                          <div className="text-[10px] text-green-500/70 mb-1 font-semibold">ENGLISH</div>
                          <div className="max-h-[250px] overflow-y-auto p-3 rounded-lg border border-green-500/20 bg-green-950/20 text-xs text-white whitespace-pre-wrap font-mono">
                            {previewContent.fullDescription.en}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-green-500/70 mb-1 font-semibold">ARABIC</div>
                          <div className="max-h-[250px] overflow-y-auto p-3 rounded-lg border border-green-500/20 bg-green-950/20 text-xs text-white whitespace-pre-wrap font-mono text-right" dir="rtl">
                            {previewContent.fullDescription.ar}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-neutral-900 bg-neutral-900/30 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <button
                type="button"
                onClick={() => handleAiRewrite(aiAction!)}
                disabled={aiLoading}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {aiLoading ? (
                  <span className="animate-spin">🌀</span>
                ) : (
                  <span>🔄</span>
                )}
                Regenerate
              </button>
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl text-xs font-medium border border-neutral-800 hover:bg-neutral-900 text-neutral-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyRewrite}
                  className="flex-1 sm:flex-initial text-center px-5 py-2 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-500 text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Apply Rewrite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
