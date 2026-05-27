"use client";

import React, { useState, useEffect, useRef } from "react";

interface CategoryData {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  _count?: { apps: number };
}

interface CategoryFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryData[];
  selectedId: string;
  onSelect: (id: string) => void;
  title: string;
  searchPlaceholder?: string;
  allLabel?: string;
  locale?: string;
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

export function CategoryFilterSheet({
  isOpen,
  onClose,
  categories,
  selectedId,
  onSelect,
  title,
  searchPlaceholder = "Search categories...",
  allLabel = "All Categories",
  locale = "en",
}: CategoryFilterSheetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset search when sheet opens/closes
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      // Prevent body scroll behind sheet
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle click outside to close
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const txt = (name: { en: string; ar: string }) => {
    return locale === "ar" && name.ar ? name.ar : name.en;
  };

  const filtered = categories.filter((cat) =>
    txt(cat.name).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md bg-neutral-950/95 border-t border-white/10 rounded-t-[32px] p-6 shadow-2xl max-h-[85vh] flex flex-col animate-slide-up select-none"
        style={{
          boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Touch drag handle accent */}
        <div 
          onClick={onClose}
          className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5 shrink-0 cursor-pointer hover:bg-white/25 active:scale-95 transition-all" 
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <span>📂</span> {title}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white active:scale-95 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Search Box */}
        <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-2xl px-3.5 py-1 shrink-0 focus-within:border-emerald-500/30 transition-all duration-300">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-neutral-500 shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-xs px-2.5 py-3 text-white placeholder-neutral-500 min-w-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-neutral-500 hover:text-white shrink-0 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* List of categories */}
        <div
          className="flex-1 overflow-y-auto mt-4 space-y-1.5 pr-1.5 -mr-1.5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.1) transparent",
          }}
        >
          {/* All option */}
          {!searchQuery && (
            <button
              onClick={() => {
                onSelect("");
                onClose();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left border ${
                selectedId === ""
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                  : "bg-white/[0.02] hover:bg-white/[0.05] border-transparent text-neutral-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🌐</span>
                <span>{allLabel}</span>
              </div>
              {selectedId === "" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  className="text-emerald-400 shrink-0"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-xs italic">
              No categories found
            </div>
          ) : (
            filtered.map((cat) => {
              const isSelected = selectedId === cat.id;
              const appCount = cat._count?.apps ?? 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    onSelect(cat.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all text-left border ${
                    isSelected
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                      : "bg-white/[0.02] hover:bg-white/[0.05] border-transparent text-neutral-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg shrink-0 select-none">
                      {categoryEmojis[cat.slug] || "📁"}
                    </span>
                    <span className="truncate">{txt(cat.name)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/5 text-neutral-400"
                      }`}
                    >
                      {appCount}
                    </span>
                    {isSelected && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        className="text-emerald-400 shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
