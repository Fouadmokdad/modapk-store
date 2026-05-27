"use client";

// =============================================================================
// TelegramBlockEditor — Drag & Drop Content Block System
// Native HTML5 DnD API — No external libraries required
// =============================================================================

import React, { useState, useRef } from "react";

export interface ContentBlock {
  id: string;
  type: BlockType;
  label: string;
  icon: string;
  variable: string;
  enabled: boolean;
  collapsed: boolean;
  spacing: "none" | "small" | "medium" | "large";
  prefix?: string;
  suffix?: string;
}

type BlockType =
  | "title" | "version" | "size" | "android" | "category"
  | "date" | "features" | "changelog" | "cta" | "footer"
  | "hashtags" | "developer" | "divider" | "warning";

type SpacingLevel = "none" | "small" | "medium" | "large";

const SPACING_MAP: Record<SpacingLevel, string> = {
  none: "",
  small: "\n",
  medium: "\n\n",
  large: "\n\n\n",
};

const BLOCK_DEFAULTS: Omit<ContentBlock, "id">[] = [
  { type: "title", label: "Title", icon: "📱", variable: "{title}", enabled: true, collapsed: false, spacing: "small", prefix: "" },
  { type: "divider", label: "Divider", icon: "─", variable: "─────────────", enabled: true, collapsed: false, spacing: "none" },
  { type: "features", label: "MOD Features", icon: "✨", variable: "{modFeatures}", enabled: true, collapsed: false, spacing: "medium", prefix: "✨ Premium Features:\n" },
  { type: "version", label: "Version", icon: "🏷️", variable: "{version}", enabled: true, collapsed: false, spacing: "none", prefix: "📱 Version: " },
  { type: "size", label: "APK Size", icon: "📦", variable: "{size}", enabled: true, collapsed: false, spacing: "none", prefix: "📦 Size: " },
  { type: "android", label: "Android", icon: "🤖", variable: "{android}", enabled: true, collapsed: false, spacing: "none", prefix: "🤖 Android: " },
  { type: "category", label: "Category", icon: "📂", variable: "{category}", enabled: true, collapsed: false, spacing: "none", prefix: "📂 Category: " },
  { type: "date", label: "Date", icon: "📅", variable: "{date}", enabled: true, collapsed: false, spacing: "medium", prefix: "📅 Updated: " },
  { type: "hashtags", label: "Hashtags", icon: "#️⃣", variable: "{hashtags}", enabled: true, collapsed: false, spacing: "none" },
  { type: "footer", label: "Footer", icon: "📌", variable: "{footer}", enabled: true, collapsed: false, spacing: "small" },
];

const EXTRA_BLOCKS: Omit<ContentBlock, "id">[] = [
  { type: "changelog", label: "Changelog", icon: "📋", variable: "{changelog}", enabled: false, collapsed: false, spacing: "medium", prefix: "📋 What's New:\n" },
  { type: "developer", label: "Developer", icon: "👨‍💻", variable: "{developer}", enabled: false, collapsed: false, spacing: "none", prefix: "👨‍💻 Dev: " },
  { type: "warning", label: "Warning Banner", icon: "⚠️", variable: "⚠️ Backup your data before installing!", enabled: false, collapsed: false, spacing: "small" },
  { type: "cta", label: "Call To Action", icon: "📣", variable: "👇 Download Now! Limited time!", enabled: false, collapsed: false, spacing: "small" },
];

interface Props {
  onTemplateChange: (template: string) => void;
}

let idCounter = 0;
const uid = () => `block-${++idCounter}-${Math.random().toString(36).slice(2, 6)}`;

function buildBlocks(defs: Omit<ContentBlock, "id">[]): ContentBlock[] {
  return defs.map((d) => ({ ...d, id: uid() }));
}

export function TelegramBlockEditor({ onTemplateChange }: Props) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(buildBlocks(BLOCK_DEFAULTS));
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // ── Template generation ─────────────────────────────────────────────────────
  const generateTemplate = (b: ContentBlock[]): string => {
    const parts: string[] = [];
    for (const block of b) {
      if (!block.enabled) continue;
      const spaceBefore = SPACING_MAP[block.spacing] || "";
      const prefix = block.prefix || "";
      const suffix = block.suffix || "";
      parts.push(spaceBefore + prefix + block.variable + suffix);
    }
    return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  };

  const updateBlocks = (updated: ContentBlock[]) => {
    setBlocks(updated);
    onTemplateChange(generateTemplate(updated));
  };

  // ── DnD Handlers ────────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { resetDrag(); return; }
    const fromIdx = blocks.findIndex(b => b.id === dragId);
    const toIdx = blocks.findIndex(b => b.id === targetId);
    if (fromIdx === -1 || toIdx === -1) { resetDrag(); return; }
    const updated = [...blocks];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    resetDrag();
    updateBlocks(updated);
  };
  const handleDragEnd = () => resetDrag();
  const resetDrag = () => { setDragId(null); setDragOverId(null); };

  // ── Block Actions ────────────────────────────────────────────────────────────
  const toggleEnabled = (id: string) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, enabled: !b.enabled } : b));
  };
  const toggleCollapsed = (id: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, collapsed: !b.collapsed } : b));
  };
  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter(b => b.id !== id));
  };
  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const copy = { ...blocks[idx], id: uid(), label: blocks[idx].label + " (Copy)" };
    const updated = [...blocks];
    updated.splice(idx + 1, 0, copy);
    updateBlocks(updated);
  };
  const updatePrefix = (id: string, prefix: string) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, prefix } : b));
  };
  const updateSpacing = (id: string, spacing: SpacingLevel) => {
    updateBlocks(blocks.map(b => b.id === id ? { ...b, spacing } : b));
  };
  const addBlock = (def: Omit<ContentBlock, "id">) => {
    const newBlock = { ...def, id: uid(), enabled: true };
    updateBlocks([...blocks, newBlock]);
    setShowAddPanel(false);
  };

  const unusedExtras = EXTRA_BLOCKS.filter(
    (e) => !blocks.some((b) => b.type === e.type)
  );

  return (
    <div style={S.root}>
      <style>{`
        @keyframes dnd-drop { 0%{transform:scale(1.02)} 100%{transform:scale(1)} }
        @keyframes dnd-fade { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <div style={S.headerTitle}>Content Blocks</div>
          <div style={S.headerSub}>{blocks.filter(b => b.enabled).length} active · Drag to reorder</div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddPanel(!showAddPanel)}
          style={S.addBtn}
        >
          {showAddPanel ? "✕ Close" : "+ Add Block"}
        </button>
      </div>

      {/* ── Add Block Panel ────────────────────────────────────────────────────── */}
      {showAddPanel && (
        <div style={S.addPanel}>
          <div style={S.addPanelTitle}>Available Blocks</div>
          {unusedExtras.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: "12px 0" }}>
              All blocks are already added
            </div>
          ) : (
            <div style={S.addPanelGrid}>
              {unusedExtras.map((def) => (
                <button
                  key={def.type}
                  type="button"
                  onClick={() => addBlock(def)}
                  style={S.addBlockBtn}
                >
                  <span style={{ fontSize: 18 }}>{def.icon}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>{def.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Blocks List ────────────────────────────────────────────────────────── */}
      <div style={S.blockList}>
        {blocks.map((block, idx) => {
          const isDragging = dragId === block.id;
          const isOver = dragOverId === block.id;

          return (
            <div
              key={block.id}
              draggable
              onDragStart={() => handleDragStart(block.id)}
              onDragOver={(e) => handleDragOver(e, block.id)}
              onDrop={(e) => handleDrop(e, block.id)}
              onDragEnd={handleDragEnd}
              style={{
                ...S.blockCard,
                opacity: isDragging ? 0.4 : 1,
                transform: isOver ? "translateY(-2px)" : "translateY(0)",
                borderColor: isOver
                  ? "rgba(34,158,217,0.5)"
                  : block.enabled
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.03)",
                background: block.enabled
                  ? "rgba(255,255,255,0.025)"
                  : "rgba(255,255,255,0.01)",
                transition: "all 0.15s ease",
              }}
            >
              {/* Block Header Row */}
              <div style={S.blockHeader}>
                {/* Drag Handle */}
                <div style={S.dragHandle} title="Drag to reorder">
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" opacity="0.4">
                    <circle cx="4" cy="3" r="1.5"/><circle cx="8" cy="3" r="1.5"/>
                    <circle cx="4" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/>
                    <circle cx="4" cy="13" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
                  </svg>
                </div>

                {/* Block info */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                  <span style={{ fontSize: 16, opacity: block.enabled ? 1 : 0.3 }}>{block.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: block.enabled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)" }}>
                      {block.label}
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                      {block.variable.length > 24 ? block.variable.slice(0, 24) + "..." : block.variable}
                    </div>
                  </div>
                </div>

                {/* Order badge */}
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 700, minWidth: 18, textAlign: "center" }}>
                  {idx + 1}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => toggleCollapsed(block.id)} title="Collapse" style={S.iconBtn}>
                    <span style={{ fontSize: 10, transform: block.collapsed ? "rotate(-90deg)" : "rotate(0)", display: "inline-block", transition: "transform 0.2s" }}>▼</span>
                  </button>
                  <button type="button" onClick={() => duplicateBlock(block.id)} title="Duplicate" style={S.iconBtn}>
                    <CopyIcon />
                  </button>
                  <button type="button" onClick={() => toggleEnabled(block.id)} title={block.enabled ? "Disable" : "Enable"} style={{
                    ...S.iconBtn,
                    background: block.enabled ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.04)",
                    borderColor: block.enabled ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.06)",
                    color: block.enabled ? "#4ade80" : "rgba(255,255,255,0.3)",
                  }}>
                    {block.enabled ? "●" : "○"}
                  </button>
                  <button type="button" onClick={() => removeBlock(block.id)} title="Remove" style={{ ...S.iconBtn, color: "rgba(239,68,68,0.5)" }}>
                    <TrashIcon />
                  </button>
                </div>
              </div>

              {/* Expanded Config */}
              {!block.collapsed && block.enabled && (
                <div style={S.blockConfig}>
                  {/* Prefix field (not for dividers) */}
                  {block.type !== "divider" && (
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <label style={S.configLabel}>Prefix</label>
                      <input
                        type="text"
                        value={block.prefix || ""}
                        onChange={(e) => updatePrefix(block.id, e.target.value)}
                        style={S.configInput}
                        placeholder="e.g. 📱 Version: "
                      />
                    </div>
                  )}

                  {/* Spacing selector */}
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <label style={S.configLabel}>Spacing</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {(["none", "small", "medium", "large"] as SpacingLevel[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateSpacing(block.id, s)}
                          style={{
                            padding: "3px 8px",
                            fontSize: 10,
                            borderRadius: 6,
                            border: "1px solid",
                            cursor: "pointer",
                            fontWeight: 600,
                            borderColor: block.spacing === s ? "rgba(34,158,217,0.5)" : "rgba(255,255,255,0.08)",
                            background: block.spacing === s ? "rgba(34,158,217,0.12)" : "transparent",
                            color: block.spacing === s ? "#4fc3f7" : "rgba(255,255,255,0.4)",
                            textTransform: "capitalize",
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Drop zone indicator */}
              {isOver && (
                <div style={S.dropIndicator} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Apply Button ──────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => onTemplateChange(generateTemplate(blocks))}
        style={S.applyBtn}
      >
        ↑ Apply Block Order to Template
      </button>
    </div>
  );
}

// ─── Icons ─────────────────────────────────────────────────────────────────────
const CopyIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);
const TrashIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 12 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" },
  headerSub: { fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 },
  addBtn: { padding: "7px 14px", background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.25)", borderRadius: 10, color: "#4fc3f7", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease" },
  addPanel: { background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14, animation: "dnd-fade 0.2s ease" },
  addPanelTitle: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 },
  addPanelGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 },
  addBlockBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "12px 8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, cursor: "pointer", transition: "all 0.15s ease" },
  blockList: { display: "flex", flexDirection: "column", gap: 4 },
  blockCard: { borderRadius: 12, border: "1px solid", padding: "10px 12px", cursor: "grab", userSelect: "none", position: "relative" },
  blockHeader: { display: "flex", alignItems: "center", gap: 8 },
  dragHandle: { cursor: "grab", color: "rgba(255,255,255,0.3)", padding: "2px 4px", flexShrink: 0 },
  iconBtn: { width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 10, transition: "all 0.15s ease", flexShrink: 0 },
  blockConfig: { marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: 8 },
  configLabel: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em", minWidth: 52, flexShrink: 0 },
  configInput: { flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.7)", fontSize: 11, padding: "5px 10px", fontFamily: "monospace", outline: "none" },
  dropIndicator: { position: "absolute", bottom: -2, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #229ed9, transparent)", borderRadius: 2 },
  applyBtn: { padding: "10px", background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.25)", borderRadius: 10, color: "#4fc3f7", fontSize: 12, fontWeight: 700, cursor: "pointer", width: "100%", transition: "all 0.2s ease" },
};
