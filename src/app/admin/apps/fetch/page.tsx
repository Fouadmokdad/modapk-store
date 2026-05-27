"use client";

// =============================================================================
// Admin — Fetch from Google Play Store
// =============================================================================
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { slugify } from "@/lib/utils";

interface FetchedDraft {
  packageName: string;
  title: { en: string; ar: string };
  shortDescription: { en: string; ar: string };
  description: { en: string; ar: string };
  iconUrl: string;
  headerImageUrl: string | null;
  developer: string;
  developerUrl: string | null;
  originalPlayStoreUrl: string;
  type: "APP" | "GAME";
  rating: number;
  contentRating: string;
  installs: string;
  status: "DRAFT";
  _versionData: {
    versionName: string;
    size: string;
    minAndroid: string;
    isLatest: boolean;
    releasedAt: string;
  };
  _screenshotUrls: string[];
  _genreHint: string;
}

export default function FetchPlayStorePage() {
  const router = useRouter();
  const [packageName, setPackageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<FetchedDraft | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDraft(null);
    setLoading(true);

    try {
      const res = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageName: packageName.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to fetch app data");
        return;
      }

      setDraft(json.data.draft);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!draft) return;
    setImporting(true);
    setError("");

    try {
      // 1. Create the app
      const slug = slugify(draft.title.en);
      const appRes = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          packageName: draft.packageName,
          status: "DRAFT",
          type: draft.type,
          title: draft.title,
          shortDescription: draft.shortDescription,
          description: draft.description,
          iconUrl: draft.iconUrl,
          headerImageUrl: draft.headerImageUrl,
          developer: draft.developer,
          developerUrl: draft.developerUrl,
          originalPlayStoreUrl: draft.originalPlayStoreUrl,
          rating: draft.rating,
          contentRating: draft.contentRating,
          installs: draft.installs,
        }),
      });

      const appJson = await appRes.json();
      if (!appRes.ok) {
        setError(appJson.error || "Failed to create app");
        return;
      }

      const appId = appJson.data.id;

      // 2. Create the version
      await fetch(`/api/apps/${appId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft._versionData),
      });

      // 3. Add screenshots
      if (draft._screenshotUrls?.length > 0) {
        const screenshots = draft._screenshotUrls.map((url, i) => ({
          url,
          altText: `${draft.title.en} screenshot ${i + 1}`,
          sortOrder: i,
        }));
        await fetch(`/api/apps/${appId}/screenshots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(screenshots),
        });
      }

      // Redirect to edit page
      router.push(`/admin/apps/${appId}`);
    } catch {
      setError("Failed to import app. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
          Fetch from Google Play
        </h1>
        <p className="text-sm mt-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
          Enter a package name to fetch app metadata from the Google Play Store
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleFetch} className="mb-8">
        <div
          className="rounded-2xl p-6"
          style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}
        >
          <label className="block text-sm font-medium mb-2" style={{ color: "hsl(var(--color-text-secondary))" }}>
            Package Name
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              placeholder="com.whatsapp, com.spotify.music, etc."
              required
              className="flex-1 px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: "hsl(var(--color-bg-secondary))",
                color: "hsl(var(--color-text-primary))",
                border: "1px solid hsl(var(--color-border))",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 shrink-0"
              style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
            >
              {loading ? "Fetching..." : "🔍 Fetch"}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            Example: com.whatsapp, com.spotify.music, com.supercell.clashofclans
          </p>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-4 mb-6 text-sm font-medium"
          style={{ background: "hsl(0 84% 60% / 0.1)", color: "hsl(0 84% 60%)", border: "1px solid hsl(0 84% 60% / 0.2)" }}
        >
          {error}
        </div>
      )}

      {/* Preview Card */}
      {draft && (
        <div className="fade-in">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}
          >
            {/* App Header */}
            <div className="p-6 flex items-start gap-4" style={{ borderBottom: "1px solid hsl(var(--color-border))" }}>
              {draft.iconUrl && (
                <Image
                  src={draft.iconUrl}
                  alt={draft.title.en}
                  width={80}
                  height={80}
                  className="rounded-2xl shrink-0"
                  unoptimized
                />
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1" style={{ color: "hsl(var(--color-text-primary))" }}>
                  {draft.title.en}
                </h2>
                <p className="text-sm mb-2" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  {draft.developer}
                </p>
                <div className="flex flex-wrap gap-2 text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    ⭐ {draft.rating}
                  </span>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    📦 {draft._versionData.versionName}
                  </span>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    📱 {draft._versionData.size}
                  </span>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    🤖 Android {draft._versionData.minAndroid}
                  </span>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    ⬇️ {draft.installs}
                  </span>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    🎮 {draft._genreHint}
                  </span>
                  <span className="px-2 py-1 rounded-lg" style={{ background: "hsl(var(--color-bg-secondary))" }}>
                    {draft.type}
                  </span>
                </div>
              </div>
            </div>

            {/* Description Preview */}
            <div className="p-6" style={{ borderBottom: "1px solid hsl(var(--color-border))" }}>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>Description</h3>
              <p className="text-sm line-clamp-4" style={{ color: "hsl(var(--color-text-secondary))" }}>
                {draft.shortDescription.en || draft.description.en?.slice(0, 300)}
              </p>
            </div>

            {/* Screenshots Preview */}
            {draft._screenshotUrls?.length > 0 && (
              <div className="p-6" style={{ borderBottom: "1px solid hsl(var(--color-border))" }}>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--color-text-primary))" }}>
                  Screenshots ({draft._screenshotUrls.length})
                </h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {draft._screenshotUrls.slice(0, 6).map((url, i) => (
                    <Image
                      key={i}
                      src={url}
                      alt={`Screenshot ${i + 1}`}
                      width={120}
                      height={213}
                      className="rounded-lg shrink-0 object-cover"
                      style={{ height: 160 }}
                      unoptimized
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Import Button */}
            <div className="p-6 flex items-center justify-between">
              <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                Will be imported as <strong>Draft</strong>. You can edit all fields before publishing.
              </p>
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
              >
                {importing ? "Importing..." : "📥 Import as Draft"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
