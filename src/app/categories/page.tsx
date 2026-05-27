"use client";

// =============================================================================
// Public Categories Page
// =============================================================================
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface CategoryData {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  type: string;
  _count: { apps: number };
}

const categoryEmojis: Record<string, string> = {
  social: "💬", communication: "📱", photography: "📷", entertainment: "🎬",
  music: "🎵", productivity: "📊", tools: "🔧", education: "📚",
  "health-fitness": "💪", finance: "💰", shopping: "🛒", news: "📰",
  travel: "✈️", weather: "🌤", food: "🍕", action: "⚔️",
  adventure: "🗺", arcade: "🕹", racing: "🏎", puzzle: "🧩",
  strategy: "♟", simulation: "🎮", sports: "⚽", rpg: "🐉",
  casual: "🎲", board: "🎯",
};

export default function CategoriesPage() {
  const { locale, t } = useLocale();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  const txt = (obj: { en: string; ar: string }) =>
    locale === "ar" && obj.ar ? obj.ar : obj.en;

  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(json => { setCategories(json.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const appCats = categories.filter(c => c.type === "APP");
  const gameCats = categories.filter(c => c.type === "GAME");

  const CategoryCard = ({ cat }: { cat: CategoryData }) => (
    <Link
      href={`/categories/${cat.slug}`}
      className="flex items-center gap-3 p-4 rounded-xl transition-all group"
      style={{
        background: "hsl(var(--color-bg-card))",
        border: "1px solid hsl(var(--color-border))",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--color-accent) / 0.3)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "hsl(var(--color-border))";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-xl"
        style={{ background: "hsl(var(--color-bg-secondary))" }}>
        {categoryEmojis[cat.slug] || "📁"}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold line-clamp-1" style={{ color: "hsl(var(--color-text-primary))" }}>
          {txt(cat.name)}
        </p>
        <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
          {cat._count.apps} {cat.type === "APP" ? t("common.apps") : t("common.games")}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-text-tertiary))" strokeWidth="2"
        className="shrink-0 transition-all group-hover:translate-x-1" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
            📂 {t("common.categories")}
          </h1>
          <p className="text-sm" style={{ color: "hsl(var(--color-text-secondary))" }}>
            {t("home.categories")}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(9)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : (
          <>
            {/* App categories */}
            {appCats.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--color-text-primary))" }}>
                  📱 {t("nav.apps")}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-tertiary))" }}>
                    {appCats.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
                  {appCats.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                </div>
              </div>
            )}

            {/* Game categories */}
            {gameCats.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "hsl(var(--color-text-primary))" }}>
                  🎮 {t("nav.games")}
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full"
                    style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-tertiary))" }}>
                    {gameCats.length}
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger">
                  {gameCats.map(cat => <CategoryCard key={cat.id} cat={cat} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
