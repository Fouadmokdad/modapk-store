"use client";

// =============================================================================
// TelegramButtonDesigner — Advanced Inline Keyboard Button Builder
// =============================================================================

import React, { useState } from "react";

interface Props {
  downloadButtonText: string;
  websiteButtonText: string;
  onDownloadChange: (val: string) => void;
  onWebsiteChange: (val: string) => void;
}

type ButtonStyle = "native" | "ghost" | "gradient" | "glow";
type RadiusPreset = "sharp" | "rounded" | "pill";

const ICON_OPTIONS = [
  "⬇️", "📥", "🔽", "💾", "📲", "🚀", "⚡", "🔓", "🆓", "📦",
  "🌐", "🔗", "🌍", "👁️", "📱", "🏠", "🎯", "✨", "🔥", "💎",
  "👑", "⭐", "❤️", "🎮", "📣", "🛒", "▶️", "🎁", "🔔", "📢",
];

const STYLE_CONFIGS: Record<ButtonStyle, { label: string; desc: string; preview: React.CSSProperties }> = {
  native: {
    label: "Native",
    desc: "Standard Telegram blue",
    preview: { background: "rgba(34,158,217,0.15)", border: "1px solid rgba(34,158,217,0.35)", color: "#4fc3f7" },
  },
  ghost: {
    label: "Ghost",
    desc: "Transparent with border",
    preview: { background: "transparent", border: "1px solid rgba(255,255,255,0.3)", color: "rgba(255,255,255,0.8)" },
  },
  gradient: {
    label: "Gradient",
    desc: "Colorful gradient fill",
    preview: { background: "linear-gradient(135deg, #229ed9, #0088cc)", border: "none", color: "white" },
  },
  glow: {
    label: "Glow",
    desc: "Neon glow effect",
    preview: { background: "rgba(34,158,217,0.2)", border: "1px solid rgba(34,158,217,0.6)", color: "#4fc3f7", boxShadow: "0 0 12px rgba(34,158,217,0.5)" },
  },
};

const RADIUS_MAP: Record<RadiusPreset, number> = {
  sharp: 4,
  rounded: 10,
  pill: 100,
};

export function TelegramButtonDesigner({
  downloadButtonText,
  websiteButtonText,
  onDownloadChange,
  onWebsiteChange,
}: Props) {
  const [activeBtn, setActiveBtn] = useState<"download" | "website">("download");
  const [btnStyle, setBtnStyle] = useState<ButtonStyle>("native");
  const [radiusPreset, setRadiusPreset] = useState<RadiusPreset>("rounded");
  const [fullWidth, setFullWidth] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const currentText = activeBtn === "download" ? downloadButtonText : websiteButtonText;
  const setCurrentText = activeBtn === "download" ? onDownloadChange : onWebsiteChange;

  const handleIconPick = (icon: string) => {
    // Prepend icon if no emoji at start, replace leading emoji otherwise
    const textToReplace = currentText || "";
    const stripped = textToReplace.replace(/^[\u{1F300}-\u{1FAD6}][\uFE0F]?\s*/u, "");
    setCurrentText(`${icon} ${stripped}`);
    setShowIconPicker(false);
  };

  const radius = RADIUS_MAP[radiusPreset];
  const styleCfg = STYLE_CONFIGS[btnStyle];

  // Build the preview style
  const previewStyle: React.CSSProperties = {
    ...styleCfg.preview,
    borderRadius: radius,
    padding: fullWidth ? "10px 16px" : "9px 16px",
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.2s ease",
    flex: fullWidth ? "none" : 1,
    width: fullWidth ? "100%" : undefined,
    minWidth: 100,
  };

  return (
    <div style={S.root}>
      <style>{`
        @keyframes btn-glow { 0%,100%{box-shadow:0 0 8px rgba(34,158,217,0.4)} 50%{box-shadow:0 0 20px rgba(34,158,217,0.7)} }
        .tg-btn-preview:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .icon-opt:hover { background: rgba(34,158,217,0.15) !important; transform: scale(1.15); }
      `}</style>

      {/* ── Button Selector Tabs ───────────────────────────────────────────────── */}
      <div style={S.btnTabs}>
        {(["download", "website"] as const).map((btn) => (
          <button
            key={btn}
            type="button"
            onClick={() => setActiveBtn(btn)}
            style={{
              ...S.btnTab,
              background: activeBtn === btn ? "rgba(34,158,217,0.15)" : "transparent",
              borderColor: activeBtn === btn ? "rgba(34,158,217,0.4)" : "rgba(255,255,255,0.08)",
              color: activeBtn === btn ? "#4fc3f7" : "rgba(255,255,255,0.5)",
            }}
          >
            {btn === "download" ? "⬇️" : "🌐"} {btn === "download" ? "Download Button" : "Website Button"}
          </button>
        ))}
      </div>

      {/* ── Text Editor Row ─────────────────────────────────────────────────────── */}
      <div style={S.textRow}>
        <div style={S.textRowLeft}>
          <label style={S.label}>Button Text</label>
          <input
            type="text"
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            style={S.textInput}
            placeholder={activeBtn === "download" ? "⬇️ DOWNLOAD MOD" : "🌐 VISIT PAGE"}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowIconPicker(!showIconPicker)}
          style={S.iconPickerBtn}
        >
          <span style={{ fontSize: 18 }}>😊</span>
          <span style={{ fontSize: 10 }}>Icon</span>
        </button>
      </div>

      {/* ── Icon Picker ────────────────────────────────────────────────────────── */}
      {showIconPicker && (
        <div style={S.iconPicker}>
          <div style={S.iconPickerTitle}>Pick an Icon</div>
          <div style={S.iconGrid}>
            {ICON_OPTIONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleIconPick(icon)}
                className="icon-opt"
                style={S.iconOpt}
                title={icon}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Style Selector ─────────────────────────────────────────────────────── */}
      <div>
        <label style={S.label}>Button Style</label>
        <div style={S.styleGrid}>
          {(Object.entries(STYLE_CONFIGS) as [ButtonStyle, (typeof STYLE_CONFIGS)[ButtonStyle]][]).map(
            ([id, cfg]) => (
              <button
                key={id}
                type="button"
                onClick={() => setBtnStyle(id)}
                style={{
                  ...S.styleCard,
                  borderColor: btnStyle === id ? "rgba(34,158,217,0.5)" : "rgba(255,255,255,0.06)",
                  background: btnStyle === id ? "rgba(34,158,217,0.08)" : "rgba(255,255,255,0.02)",
                }}
              >
                <div style={{ ...cfg.preview, borderRadius: 6, padding: "5px 10px", fontSize: 10, fontWeight: 700, textAlign: "center", marginBottom: 6 }}>
                  Btn
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: btnStyle === id ? "#4fc3f7" : "rgba(255,255,255,0.7)" }}>{cfg.label}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{cfg.desc}</div>
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Radius Selector ────────────────────────────────────────────────────── */}
      <div>
        <label style={S.label}>Corner Radius</label>
        <div style={{ display: "flex", gap: 8 }}>
          {(["sharp", "rounded", "pill"] as RadiusPreset[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadiusPreset(r)}
              style={{
                ...S.radiusBtn,
                borderColor: radiusPreset === r ? "rgba(34,158,217,0.5)" : "rgba(255,255,255,0.08)",
                background: radiusPreset === r ? "rgba(34,158,217,0.12)" : "rgba(255,255,255,0.02)",
                color: radiusPreset === r ? "#4fc3f7" : "rgba(255,255,255,0.5)",
              }}
            >
              <div style={{ width: 24, height: 12, border: "1.5px solid currentColor", borderRadius: RADIUS_MAP[r], background: "transparent" }} />
              <span style={{ fontSize: 10, textTransform: "capitalize" }}>{r}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Full Width Toggle ─────────────────────────────────────────────────── */}
      <div style={S.fullWidthRow}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Full Width</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Button spans the entire keyboard width</div>
        </div>
        <button
          type="button"
          onClick={() => setFullWidth(!fullWidth)}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            background: fullWidth ? "#229ed9" : "rgba(255,255,255,0.1)",
            position: "relative",
            transition: "background 0.2s ease",
            boxShadow: fullWidth ? "0 0 10px rgba(34,158,217,0.4)" : "none",
            flexShrink: 0,
          }}
          role="switch"
          aria-checked={fullWidth}
        >
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: fullWidth ? 23 : 3, transition: "left 0.2s ease", boxShadow: "0 1px 4px rgba(0,0,0,0.4)" }} />
        </button>
      </div>

      {/* ── Live Preview ──────────────────────────────────────────────────────── */}
      <div style={S.previewSection}>
        <div style={S.previewTitle}>Live Preview</div>
        <div style={S.previewFrame}>
          {/* Phone header mockup */}
          <div style={S.previewHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#229ed9" }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>ModAPK Store</span>
            </div>
          </div>

          {/* Message stub */}
          <div style={S.previewMsgStub}>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginBottom: 6 }} />
            <div style={{ height: 6, width: "70%", background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
          </div>

          {/* Button keyboard */}
          <div style={S.previewKeyboard}>
            {fullWidth ? (
              <div className="tg-btn-preview" style={previewStyle}>
                {activeBtn === "download" ? downloadButtonText || "⬇️ DOWNLOAD MOD" : websiteButtonText || "🌐 VISIT PAGE"}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <div className="tg-btn-preview" style={{ ...previewStyle, borderRadius: radius }}>
                  {downloadButtonText || "⬇️ DOWNLOAD MOD"}
                </div>
                <div className="tg-btn-preview" style={{ ...previewStyle, borderRadius: radius }}>
                  {websiteButtonText || "🌐 VISIT PAGE"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 18 },
  btnTabs: { display: "flex", gap: 6 },
  btnTab: { flex: 1, padding: "9px 12px", border: "1px solid", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s ease" },
  textRow: { display: "flex", gap: 10, alignItems: "flex-end" },
  textRowLeft: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 },
  textInput: { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, color: "rgba(255,255,255,0.85)", fontSize: 13, padding: "10px 14px", outline: "none", boxSizing: "border-box", fontFamily: "inherit" },
  iconPickerBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, cursor: "pointer", color: "rgba(255,255,255,0.5)", flexShrink: 0 },
  iconPicker: { background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 },
  iconPickerTitle: { fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 },
  iconGrid: { display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 6 },
  iconOpt: { fontSize: 18, padding: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, cursor: "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center" },
  styleGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 },
  styleCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", border: "1px solid", borderRadius: 10, cursor: "pointer", transition: "all 0.15s ease" },
  radiusBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 20px", border: "1px solid", borderRadius: 10, cursor: "pointer", transition: "all 0.15s ease", flex: 1 },
  fullWidthRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "14px", background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 },
  previewSection: { background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" },
  previewTitle: { padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.15)" },
  previewFrame: { padding: 14 },
  previewHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  previewMsgStub: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10, padding: "12px 14px", marginBottom: 8 },
  previewKeyboard: { padding: "4px 0" },
};
