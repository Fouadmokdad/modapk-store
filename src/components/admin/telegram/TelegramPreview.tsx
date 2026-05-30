"use client";

// =============================================================================
// TelegramPreview — Multi-Device Premium Preview System
// Modes: Android | iPhone | Desktop | Tablet | Zoom + Theme
// =============================================================================

import React, { useState } from "react";

interface Props {
  renderedText: string;
  downloadButtonText: string;
  websiteButtonText: string;
  appImageUrl?: string;
  reactionsEnabled?: boolean;
  reactionsList?: string;
}

type DeviceMode = "android" | "iphone" | "desktop" | "tablet";
type ThemeMode = "dark" | "light";
type ZoomLevel = 50 | 75 | 100;

const REACTIONS = ["👍", "❤️", "🔥", "🎉", "😮", "👏"];

// ─── Telegram Brand Colors ─────────────────────────────────────────────────────
const TG = {
  darkBg: "#17212b",
  darkPanel: "#0e1621",
  darkBubble: "#182533",
  darkHeader: "#17212b",
  darkBorder: "rgba(255,255,255,0.05)",
  darkText: "rgba(255,255,255,0.85)",
  darkSubtext: "rgba(255,255,255,0.4)",
  darkInput: "#242f3d",
  lightBg: "#f0f0f0",
  lightPanel: "#ffffff",
  lightBubble: "#ffffff",
  lightHeader: "#527da3",
  lightText: "#000000",
  lightSubtext: "rgba(0,0,0,0.5)",
  lightInput: "#ffffff",
  blue: "#229ed9",
  lightBlue: "#4fc3f7",
  green: "#4ade80",
  sent: "#4ade80",
};

export function TelegramPreview({
  renderedText,
  downloadButtonText,
  websiteButtonText,
  appImageUrl,
  reactionsEnabled = true,
  reactionsList = "👍,👎,🤔,❤️",
}: Props) {
  const [device, setDevice] = useState<DeviceMode>("android");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [zoom, setZoom] = useState<ZoomLevel>(75);
  const [showReactions, setShowReactions] = useState(false);
  const [showPinned, setShowPinned] = useState(false);
  const [showForwarded, setShowForwarded] = useState(false);

  const isDark = theme === "dark";
  const bg = isDark ? TG.darkBg : TG.lightBg;
  const panelBg = isDark ? TG.darkPanel : TG.lightPanel;
  const bubbleBg = isDark ? TG.darkBubble : TG.lightBubble;
  const headerBg = isDark ? TG.darkHeader : TG.lightHeader;
  const textColor = isDark ? TG.darkText : TG.lightText;
  const subColor = isDark ? TG.darkSubtext : TG.lightSubtext;
  const borderColor = isDark ? TG.darkBorder : "rgba(0,0,0,0.08)";
  const inputBg = isDark ? TG.darkInput : TG.lightInput;

  const deviceConfigs = {
    android: { width: 360, height: 640, borderRadius: 30, label: "Android" },
    iphone: { width: 375, height: 700, borderRadius: 50, label: "iPhone" },
    desktop: { width: 740, height: 520, borderRadius: 12, label: "Desktop" },
    tablet: { width: 520, height: 680, borderRadius: 20, label: "Tablet" },
  };

  const cfg = deviceConfigs[device];
  const scale = zoom / 100;

  return (
    <div style={S.root}>
      <style>{`
        @keyframes tg-reaction { 0%{transform:scale(0) translateY(10px);opacity:0} 60%{transform:scale(1.2) translateY(-5px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes tg-typing { 0%,80%,100%{transform:scale(0)} 40%{transform:scale(1)} }
        .tg-reaction-pill { animation: tg-reaction 0.3s ease forwards; }
        .typing-dot { animation: tg-typing 1.4s ease-in-out infinite; display:inline-block; width:6px; height:6px; border-radius:50%; background:rgba(255,255,255,0.5); margin:0 2px; }
        .typing-dot:nth-child(2) { animation-delay:0.2s; }
        .typing-dot:nth-child(3) { animation-delay:0.4s; }
      `}</style>

      {/* ── Controls ─────────────────────────────────────────────────────────── */}
      <div style={S.controls}>
        {/* Device Selector */}
        <div style={S.controlGroup}>
          {(["android", "iphone", "desktop", "tablet"] as DeviceMode[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              style={{
                ...S.controlBtn,
                ...(device === d ? S.controlBtnActive : {}),
              }}
            >
              {d === "android" && <AndroidIcon />}
              {d === "iphone" && <IphoneIcon />}
              {d === "desktop" && <DesktopIcon />}
              {d === "tablet" && <TabletIcon />}
              <span style={{ fontSize: 10, textTransform: "capitalize" }}>{d}</span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            style={{ ...S.controlBtn, gap: 4, padding: "6px 12px" }}
          >
            {isDark ? "☀️" : "🌙"}
            <span style={{ fontSize: 10 }}>{isDark ? "Light" : "Dark"}</span>
          </button>

          {/* Zoom */}
          <div style={S.zoomGroup}>
            {([50, 75, 100] as ZoomLevel[]).map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => setZoom(z)}
                style={{
                  ...S.zoomBtn,
                  ...(zoom === z ? S.zoomBtnActive : {}),
                }}
              >
                {z}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature Toggles ───────────────────────────────────────────────────── */}
      <div style={S.featureToggles}>
        {[
          { label: "Reactions", state: showReactions, set: setShowReactions },
          { label: "Pinned", state: showPinned, set: setShowPinned },
          { label: "Forwarded", state: showForwarded, set: setShowForwarded },
        ].map(({ label, state, set }) => (
          <button
            key={label}
            type="button"
            onClick={() => set(!state)}
            style={{
              ...S.featureToggleBtn,
              background: state ? "rgba(34,158,217,0.15)" : "rgba(255,255,255,0.04)",
              borderColor: state ? "rgba(34,158,217,0.4)" : "rgba(255,255,255,0.08)",
              color: state ? "#4fc3f7" : "rgba(255,255,255,0.4)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Device Frame Container ────────────────────────────────────────────── */}
      <div style={S.frameContainer}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            width: cfg.width,
            marginBottom: `${(cfg.height * scale) - cfg.height}px`,
          }}
        >
          {/* ── DESKTOP MODE ──────────────────────────────────────────────────── */}
          {device === "desktop" && (
            <div style={{
              width: cfg.width,
              height: cfg.height,
              borderRadius: cfg.borderRadius,
              background: panelBg,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
              display: "flex",
              overflow: "hidden",
            }}>
              {/* Desktop Sidebar */}
              <div style={{
                width: 68,
                background: isDark ? "#212d3b" : "#2b5278",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "12px 0",
                gap: 6,
                borderRight: `1px solid ${borderColor}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: "white" }}>✈️</span>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ width: 44, height: 44, borderRadius: 14, background: i === 2 ? "rgba(34,158,217,0.3)" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: `hsl(${i * 60}, 60%, 50%)`, opacity: 0.7 }} />
                  </div>
                ))}
              </div>

              {/* Chat List */}
              <div style={{
                width: 220,
                background: isDark ? "#17212b" : "#f5f5f5",
                borderRight: `1px solid ${borderColor}`,
                overflow: "hidden",
              }}>
                <div style={{ padding: "14px 12px 8px", borderBottom: `1px solid ${borderColor}` }}>
                  <div style={{ background: isDark ? "#242f3d" : "#e8e8e8", borderRadius: 20, padding: "6px 12px", fontSize: 11, color: subColor }}>🔍 Search</div>
                </div>
                {[
                  { name: "ModAPK Store", preview: "New post: " + (renderedText.slice(0, 25) + "..."), active: true, unread: 1 },
                  { name: "Tech Channel", preview: "Forwarded message", active: false },
                  { name: "Gaming Hub", preview: "New game released!", active: false },
                ].map((chat, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: chat.active ? (isDark ? "rgba(34,158,217,0.12)" : "rgba(34,158,217,0.08)") : "transparent", borderLeft: chat.active ? "3px solid #229ed9" : "3px solid transparent", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: textColor }}>{chat.name}</span>
                      {chat.unread && <span style={{ background: "#229ed9", borderRadius: 10, fontSize: 9, padding: "1px 5px", color: "white", fontWeight: 700 }}>{chat.unread}</span>}
                    </div>
                    <div style={{ fontSize: 10, color: subColor, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{chat.preview}</div>
                  </div>
                ))}
              </div>

              {/* Chat Area */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: bg }}>
                {/* Header */}
                <div style={{ padding: "10px 16px", background: headerBg, borderBottom: `1px solid ${borderColor}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 12, color: "white" }}>📢</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "white" : "white" }}>ModAPK Store</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>14,235 members</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 14, color: isDark ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.7)", fontSize: 16 }}>
                    <span style={{ cursor: "pointer" }}>🔍</span>
                    <span style={{ cursor: "pointer" }}>📎</span>
                    <span style={{ cursor: "pointer" }}>⋮</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, padding: "12px 14px", overflow: "auto", background: bg, display: "flex", flexDirection: "column", gap: 8 }}>
                  {showPinned && (
                    <div style={{ padding: "6px 10px", background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.2)", borderRadius: 8, fontSize: 10, color: "#4fc3f7", display: "flex", alignItems: "center", gap: 6 }}>
                      📌 Pinned Message — Latest MOD Release
                    </div>
                  )}
                  <div style={{ alignSelf: "center", fontSize: 10, color: subColor, background: isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.1)", padding: "3px 10px", borderRadius: 10 }}>Today</div>
                  <ChatBubble
                    text={renderedText}
                    downloadBtn={downloadButtonText}
                    websiteBtn={websiteButtonText}
                    image={appImageUrl}
                    isDark={isDark}
                    bubbleBg={bubbleBg}
                    textColor={textColor}
                    subColor={subColor}
                    showForwarded={showForwarded}
                    showReactions={showReactions}
                    reactionsEnabled={reactionsEnabled}
                    reactionsList={reactionsList}
                    desktop
                  />
                </div>

                {/* Input bar */}
                <div style={{ padding: "8px 14px", background: isDark ? "#17212b" : "#ffffff", borderTop: `1px solid ${borderColor}`, display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1, background: inputBg, borderRadius: 20, padding: "8px 14px", fontSize: 12, color: subColor }}>Write a message...</div>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 14 }}>🎤</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MOBILE MODES (Android / iPhone / Tablet) ─────────────────────── */}
          {device !== "desktop" && (
            <div style={{
              width: cfg.width,
              height: cfg.height,
              borderRadius: cfg.borderRadius,
              background: panelBg,
              border: device === "iphone" ? "10px solid #1a1a1a" : "8px solid #2a2a2a",
              boxShadow: [
                "0 0 0 1px rgba(255,255,255,0.06)",
                "0 40px 80px rgba(0,0,0,0.7)",
                "inset 0 1px 0 rgba(255,255,255,0.08)",
                "inset 0 -1px 0 rgba(0,0,0,0.5)",
              ].join(", "),
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              position: "relative",
            }}>
              {/* Status bar */}
              <div style={{ height: device === "iphone" ? 44 : 24, background: headerBg, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", flexShrink: 0 }}>
                {device === "iphone" ? (
                  <>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>9:41</span>
                    <div style={{ width: 120, height: 28, background: "#000", borderRadius: 20, position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)" }} />
                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: "white" }}>●●●●</span>
                      <span style={{ fontSize: 10, color: "white" }}>WiFi</span>
                      <span style={{ fontSize: 10, color: "white" }}>🔋</span>
                    </div>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>9:41</span>
                    <div style={{ display: "flex", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 10 }}>
                      <span>📶</span><span>WiFi</span><span>🔋</span>
                    </div>
                  </>
                )}
              </div>

              {/* Telegram Header */}
              <div style={{ padding: "10px 14px", background: headerBg, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: `1px solid ${borderColor}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>◀ 14K</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px rgba(34,158,217,0.3)" }}>
                    <span style={{ fontSize: 14 }}>📢</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "white" : "white", lineHeight: 1.2 }}>ModAPK Store</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>14,235 subscribers</div>
                  </div>
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>⋮</div>
              </div>

              {/* Chat */}
              <div style={{ flex: 1, background: bg, padding: "8px 10px", overflow: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {showPinned && (
                  <div style={{ padding: "5px 10px", background: "rgba(34,158,217,0.1)", border: "1px solid rgba(34,158,217,0.2)", borderRadius: 8, fontSize: 9, color: "#4fc3f7" }}>
                    📌 Pinned — Latest MOD Release
                  </div>
                )}
                <div style={{ alignSelf: "center", fontSize: 9, color: subColor, background: isDark ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)", padding: "2px 8px", borderRadius: 8 }}>Today</div>

                <ChatBubble
                  text={renderedText}
                  downloadBtn={downloadButtonText}
                  websiteBtn={websiteButtonText}
                  image={appImageUrl}
                  isDark={isDark}
                  bubbleBg={bubbleBg}
                  textColor={textColor}
                  subColor={subColor}
                  showForwarded={showForwarded}
                  showReactions={showReactions}
                  reactionsEnabled={reactionsEnabled}
                  reactionsList={reactionsList}
                />
              </div>

              {/* Input Bar */}
              <div style={{ padding: "6px 10px", background: isDark ? "#17212b" : "#ffffff", borderTop: `1px solid ${borderColor}`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>📎</div>
                <div style={{ flex: 1, background: inputBg, borderRadius: 20, padding: "7px 12px", fontSize: 11, color: subColor }}>Message</div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #229ed9, #0088cc)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 12, color: "white" }}>🎤</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Device Label ─────────────────────────────────────────────────────── */}
      <div style={S.deviceLabel}>
        {deviceConfigs[device].label} · {theme === "dark" ? "Dark" : "Light"} · {zoom}%
      </div>
    </div>
  );
}

// ─── Chat Bubble Sub-Component ─────────────────────────────────────────────────
function ChatBubble({
  text, downloadBtn, websiteBtn, image, isDark,
  bubbleBg, textColor, subColor, showForwarded, showReactions, desktop = false,
  reactionsEnabled = true, reactionsList = "👍,👎,🤔,❤️",
}: {
  text: string; downloadBtn: string; websiteBtn: string;
  image?: string; isDark: boolean; bubbleBg: string; textColor: string;
  subColor: string; showForwarded: boolean; showReactions: boolean; desktop?: boolean;
  reactionsEnabled?: boolean; reactionsList?: string;
}) {
  const [pickedReaction, setPickedReaction] = useState<string | null>(null);
  const fontSize = desktop ? 12 : 11;
  const maxWidth = desktop ? "75%" : "92%";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth, alignSelf: "flex-start" }}>
      {showForwarded && (
        <div style={{ fontSize: 9, color: "#4fc3f7", paddingLeft: 4 }}>
          ↪ Forwarded from <strong>MOD Channel</strong>
        </div>
      )}

      <div style={{
        background: bubbleBg,
        borderRadius: "14px 14px 14px 4px",
        overflow: "hidden",
        border: `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)"}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" style={{ width: "100%", height: desktop ? 140 : 110, objectFit: "cover", display: "block" }} />
        )}
        <div style={{ padding: "10px 12px 4px", fontSize, color: textColor, lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          <span dangerouslySetInnerHTML={{ __html: text || "<i style='opacity:0.5'>Your template preview...</i>" }} />
        </div>
        <div style={{ padding: "2px 10px 8px", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4, fontSize: 9, color: subColor }}>
          <span>11:58 AM</span>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 5l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 5l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Inline Keyboard */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
        {reactionsEnabled && reactionsList && (
          <div style={{ display: "flex", gap: 4 }}>
            {reactionsList.split(",").map(e => e.trim()).filter(Boolean).map((emoji) => (
              <div
                key={emoji}
                style={{
                  flex: 1,
                  padding: desktop ? "6px 10px" : "5px 8px",
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                  borderRadius: 10,
                  color: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)",
                  fontSize: desktop ? 11 : 9,
                  fontWeight: 700,
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
        )}
        <div style={{ padding: desktop ? "8px 10px" : "6px 8px", background: isDark ? "rgba(34,158,217,0.12)" : "rgba(34,158,217,0.08)", border: "1px solid rgba(34,158,217,0.25)", borderRadius: 10, color: "#4fc3f7", fontSize: desktop ? 11 : 9, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
          {downloadBtn || "⬇️ DOWNLOAD NOW"}
        </div>
      </div>

      {/* Reactions */}
      {showReactions && (
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", paddingLeft: 4 }}>
          {REACTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setPickedReaction(pickedReaction === r ? null : r)}
              className="tg-reaction-pill"
              style={{
                padding: "3px 8px",
                background: pickedReaction === r ? "rgba(34,158,217,0.2)" : "rgba(255,255,255,0.06)",
                border: `1px solid ${pickedReaction === r ? "rgba(34,158,217,0.5)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 20,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              {r}
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{Math.floor(Math.random() * 50) + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Device Icons ─────────────────────────────────────────────────────────────
const AndroidIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" opacity="0.7">
    <path d="M17.523 15.34A5 5 0 0 0 17 13V8a5 5 0 0 0-10 0v5a5 5 0 0 0 .477 2.34L5.5 17.5a1 1 0 0 0 1 1.5h11a1 1 0 0 0 1-1.5l-1.977-2.16zM7 13V8a5 5 0 0 1 10 0v5H7z"/>
    <circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/>
  </svg>
);
const IphoneIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);
const DesktopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const TabletIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <line x1="12" y1="18" x2="12.01" y2="18"/>
  </svg>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  controls: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  controlGroup: {
    display: "flex",
    gap: 4,
    background: "rgba(0,0,0,0.25)",
    padding: 4,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  controlBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "6px 10px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    color: "rgba(255,255,255,0.4)",
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontSize: 11,
  },
  controlBtnActive: {
    background: "rgba(34,158,217,0.15)",
    color: "#4fc3f7",
    boxShadow: "0 0 0 1px rgba(34,158,217,0.3)",
  },
  zoomGroup: {
    display: "flex",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    overflow: "hidden",
  },
  zoomBtn: {
    padding: "6px 10px",
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    letterSpacing: "0.01em",
  },
  zoomBtnActive: {
    background: "rgba(34,158,217,0.15)",
    color: "#4fc3f7",
  },
  featureToggles: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  featureToggleBtn: {
    padding: "4px 12px",
    borderRadius: 100,
    border: "1px solid",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    letterSpacing: "0.02em",
  },
  frameContainer: {
    display: "flex",
    justifyContent: "center",
    overflow: "hidden",
    padding: "8px 0",
  },
  deviceLabel: {
    textAlign: "center",
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
};
