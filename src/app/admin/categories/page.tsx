"use client";

// =============================================================================
// Admin Categories Page — CRUD
// =============================================================================
import React, { useEffect, useState, useCallback } from "react";
import type { CategoryData } from "@/types/app";
import { CustomSelect } from "@/components/ui/CustomSelect";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    slug: "",
    name: { en: "", ar: "" },
    description: { en: "", ar: "" },
    type: "APP" as "APP" | "GAME",
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const params = typeFilter ? `?type=${typeFilter}` : "";
      const res = await fetch(`/api/categories${params}`);
      const json = await res.json();
      setCategories(json.data || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => {
    setFormData({ slug: "", name: { en: "", ar: "" }, description: { en: "", ar: "" }, type: "APP", sortOrder: 0 });
    setEditingId(null);
    setShowForm(false);
    setFormError("");
  };

  const startEdit = (cat: CategoryData) => {
    setEditingId(cat.id);
    setFormData({
      slug: cat.slug,
      name: cat.name as { en: string; ar: string },
      description: (cat.description || { en: "", ar: "" }) as { en: string; ar: string },
      type: cat.type as "APP" | "GAME",
      sortOrder: cat.sortOrder,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");

    try {
      const url = editingId
        ? `/api/categories?id=${editingId}`
        : "/api/categories";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const json = await res.json();
        setFormError(json.error || "Failed to save category");
        return;
      }

      resetForm();
      fetchCategories();
    } catch {
      setFormError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>Categories</h1>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>Manage app and game categories</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
        >
          + Add Category
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
            {editingId ? "Edit Category" : "New Category"}
          </h2>

          {formError && (
            <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)" }}>
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
                required
                placeholder="e.g. social"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Type</label>
              <CustomSelect
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val as "APP" | "GAME" })}
                options={[
                  { value: "APP", label: "App" },
                  { value: "GAME", label: "Game" },
                ]}
                className="w-full text-xs font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Name (English)</label>
              <input
                type="text"
                value={formData.name.en}
                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                required
                placeholder="Category name"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Name (Arabic)</label>
              <input
                type="text"
                value={formData.name.ar}
                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                placeholder="اسم التصنيف"
                dir="rtl"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-primary))", border: "1px solid hsl(var(--color-border))" }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: "hsl(var(--color-text-secondary))" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["", "APP", "GAME"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: typeFilter === t ? "hsl(142 71% 45% / 0.1)" : "hsl(var(--color-bg-secondary))",
              color: typeFilter === t ? "hsl(142 71% 45%)" : "hsl(var(--color-text-secondary))",
            }}
          >
            {t === "" ? "All" : t === "APP" ? "Apps" : "Games"}
          </button>
        ))}
      </div>

      {/* Categories List */}
      <div className="rounded-2xl" style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center" style={{ color: "hsl(var(--color-text-secondary))" }}>No categories found</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "hsl(var(--color-border))" }}>
            {categories.map((cat) => {
              const name = cat.name as Record<string, string>;
              const count = cat._count?.apps ?? 0;
              return (
                <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 first:rounded-t-2xl last:rounded-b-2xl hover:bg-white/[0.01] transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: "hsl(var(--color-text-primary))" }}>{name.en}</span>
                      {name.ar && <span className="text-sm" style={{ color: "hsl(var(--color-text-tertiary))" }} dir="rtl">({name.ar})</span>}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{ background: "hsl(var(--color-bg-tertiary))", color: "hsl(var(--color-text-tertiary))" }}>
                        {cat.type}
                      </span>
                    </div>
                    <span className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                      /{cat.slug} • {count} apps • order: {cat.sortOrder}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(cat)} className="p-2 rounded-lg text-sm transition-all"
                      style={{ color: "hsl(var(--color-text-secondary))" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(var(--color-bg-secondary))"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                      ✏️
                    </button>
                    <button onClick={() => handleDelete(cat.id, name.en)} className="p-2 rounded-lg text-sm transition-all"
                      style={{ color: "hsl(0 84% 60%)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "hsl(0 84% 60% / 0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
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
