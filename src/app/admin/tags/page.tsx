"use client";

// =============================================================================
// Admin Tags Page — CRUD (Settings/Bilingual Compatible)
// =============================================================================
import React, { useEffect, useState, useCallback } from "react";

interface TagData {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  _count?: { apps: number };
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    name: { en: "", ar: "" },
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tags");
      const json = await res.json();
      setTags(json.data || []);
    } catch (error) {
      console.error("Failed to fetch tags:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const resetForm = () => {
    setFormData({ slug: "", name: { en: "", ar: "" } });
    setEditingId(null);
    setShowForm(false);
    setFormError("");
  };

  const startEdit = (tag: TagData) => {
    setEditingId(tag.id);
    setFormData({
      slug: tag.slug,
      name: {
        en: tag.name.en || "",
        ar: tag.name.ar || "",
      },
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const url = editingId ? `/api/tags?id=${editingId}` : "/api/tags";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        setFormError(json.error || "Failed to save tag");
        return;
      }

      resetForm();
      fetchTags();
    } catch {
      setFormError("Network error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete tag "${name}"?`)) return;
    try {
      const res = await fetch(`/api/tags?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTags();
      } else {
        const json = await res.json();
        alert(json.error || "Failed to delete tag");
      }
    } catch (error) {
      console.error("Failed to delete tag:", error);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>Tags</h1>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>Manage app and game discovery metadata tags</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95 cursor-pointer"
          style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
        >
          + Add Tag
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl p-6 mb-6 fade-in"
          style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}
        >
          <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
            {editingId ? "✏️ Edit Tag" : "🏷️ New Tag"}
          </h2>

          {formError && (
            <div className="mb-4 p-3.5 rounded-xl text-sm" style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)" }}>
              ⚠️ {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                required
                placeholder="e.g. premium-unlocked"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
            <div />
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Name (English) *</label>
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                required
                placeholder="e.g. Premium Unlocked"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Name (Arabic)</label>
              <input
                type="text"
                value={formData.name.ar}
                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                placeholder="مثال: ميزات مفتوحة"
                dir="rtl"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: "hsl(var(--color-text-secondary))" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-transform active:scale-95 cursor-pointer"
              style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
            >
              {saving ? "Saving..." : editingId ? "Update Tag" : "Create Tag"}
            </button>
          </div>
        </form>
      )}

      {/* Tags List */}
      <div className="rounded-2xl overflow-hidden border" style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "hsl(var(--color-text-secondary))" }}>
            📂 No tags found. Create some above!
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--color-border))" }}>
            {tags.map((tag) => {
              const name = tag.name as Record<string, string>;
              const count = tag._count?.apps ?? 0;
              return (
                <div key={tag.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-neutral-800/10 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "hsl(var(--color-text-primary))" }}>{name.en}</span>
                      {name.ar && (
                        <span className="text-sm" style={{ color: "hsl(var(--color-text-tertiary))" }} dir="rtl">
                          ({name.ar})
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: "hsl(var(--color-bg-tertiary))", color: "hsl(var(--color-text-tertiary))" }}>
                        /{tag.slug}
                      </span>
                    </div>
                    <span className="text-xs mt-0.5 block" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                      Associated with {count} {count === 1 ? "app" : "apps"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(tag)}
                      className="p-2 rounded-lg text-sm transition-all hover:bg-neutral-800/30"
                      style={{ color: "hsl(var(--color-text-secondary))" }}
                      aria-label="Edit Tag"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(tag.id, name.en)}
                      className="p-2 rounded-lg text-sm transition-all hover:bg-red-500/10"
                      style={{ color: "hsl(0 84% 60%)" }}
                      aria-label="Delete Tag"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
