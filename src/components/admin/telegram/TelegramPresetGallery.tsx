"use client";

import React, { useState } from "react";
import { TelegramTemplateSettings } from "@/lib/telegram/telegramTemplates";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  onApply: (settings: Partial<TelegramTemplateSettings>) => void;
  currentSettings: TelegramTemplateSettings;
}

interface Preset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  palette: string[];
  previewLines: string[]; // 3 lines rendered with placeholder text
  settings: Partial<TelegramTemplateSettings>;
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS: Preset[] = [
  // 1. Premium MOD APK
  {
    id: "premium-mod-apk",
    name: "Premium MOD APK",
    description: "Bold fire-emoji title with full feature list & premium hashtags",
    tags: ["Premium", "Full-featured", "Bold", "Dark"],
    palette: ["#FF4500", "#FF6B00", "#FFD700", "#1a1a2e"],
    previewLines: [
      "🔥 SPOTIFY PREMIUM MOD 🔥",
      "✨ Premium Features Unlocked",
      "• Unlimited Skips  • No Ads",
    ],
    settings: {
      template: `<b>🔥 {title} 🔥</b>

✨ <b>MOD FEATURES:</b>
{modFeatures}

━━━━━━━━━━━━━━━━━━
📱 <b>Version:</b> {version}
📦 <b>Size:</b> {size}
🤖 <b>Android:</b> {android}
📂 <b>Category:</b> {category}
📅 <b>Updated:</b> {date}
━━━━━━━━━━━━━━━━━━

{hashtags}

{footer}`,
      titleStyle: "premium",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "⬇️ DOWNLOAD MOD APK",
      websiteButtonText: "🌐 VISIT PAGE",
      footerText: "🚀 Join our channel for more premium MODs!",
      hashtagsTemplate: "#{title} #{category} #ModAPK #Premium #Android",
      dateFormat: "long",
    },
  },

  // 2. Gaming Style
  {
    id: "gaming-style",
    name: "Gaming Style",
    description: "Energetic ALL CAPS with gaming emojis and high-octane formatting",
    tags: ["Gaming", "Energetic", "Compact", "Bold"],
    palette: ["#00FF41", "#0D0D0D", "#7B2FBE", "#FF6B35"],
    previewLines: [
      "🎮 PUBG MOBILE MOD — UNLIMITED UC",
      "⚡ FEATURES UNLOCKED:",
      "• Aimbot  • Wall-hack  • God Mode",
    ],
    settings: {
      template: `🎮 <b>{title}</b>

⚡ <b>FEATURES UNLOCKED:</b>
{modFeatures}

🕹️ <b>VER:</b> {version} | 📦 <b>SIZE:</b> {size}
🤖 <b>ANDROID:</b> {android} | 📂 {category}

🏆 UPDATED: {date}

{hashtags}
{footer}`,
      titleStyle: "uppercase",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "🎮 DOWNLOAD NOW",
      websiteButtonText: "🌐 GAME PAGE",
      footerText: "🏆 Level up with premium mods — join us!",
      hashtagsTemplate: "#{title} #{category} #Gaming #ModAPK #Cheat",
      dateFormat: "short",
    },
  },

  // 3. Anime Style
  {
    id: "anime-style",
    name: "Anime Style",
    description: "Kawaii aesthetic with soft emojis and Japanese-inspired formatting",
    tags: ["Anime", "Kawaii", "Soft", "Aesthetic"],
    palette: ["#FF85A1", "#FFB7C5", "#A78BFA", "#1e1b2e"],
    previewLines: [
      "✨ 𝑺𝒑𝒐𝒕𝒊𝒇𝒚 𝑷𝒓𝒆𝒎𝒊𝒖𝒎 𝑴𝑶𝑫 ✨",
      "🌸 Premium unlocked • No ads ~",
      "💫 Version: 8.9.12  ⚡ Size: 45MB",
    ],
    settings: {
      template: `✨ <b>{title}</b> ✨

🌸 <b>Mod Features ~</b>
{modFeatures}

💫 Version: <code>{version}</code>  ⚡ Size: {size}
🌙 Android: {android}  🎀 {category}

📅 Released: {date}

{hashtags}

{footer}`,
      titleStyle: "bold",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "🌸 ダウンロード",
      websiteButtonText: "✨ View App",
      footerText: "🌸 More kawaii mods every day~ follow us! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
      hashtagsTemplate: "#{title} #{category} #Anime #ModAPK #Kawaii #Japan",
      dateFormat: "short",
    },
  },

  // 4. Minimal Clean
  {
    id: "minimal-clean",
    name: "Minimal Clean",
    description: "No emojis, professional typography, clean whitespace-first design",
    tags: ["Minimal", "Professional", "Clean", "No-Emoji"],
    palette: ["#E2E8F0", "#94A3B8", "#334155", "#0f172a"],
    previewLines: [
      "Spotify Premium — MOD Edition",
      "Version 8.9.12  ·  Size 45 MB",
      "Features: Premium, No Ads, Offline",
    ],
    settings: {
      template: `<b>{title}</b>

Version {version}  ·  {size}  ·  Android {android}
Category: {category}
Updated: {date}

Features:
{modFeatures}

{hashtags}

{footer}`,
      titleStyle: "normal",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "Download APK",
      websiteButtonText: "View Details",
      footerText: "Subscribe for curated Android apps and mods.",
      hashtagsTemplate: "#{title} #{category} #Android #APK",
      dateFormat: "long",
    },
  },

  // 5. Hacker Style
  {
    id: "hacker-style",
    name: "Hacker Style",
    description: "Terminal aesthetic with code blocks, matrix-vibe monospace feel",
    tags: ["Hacker", "Terminal", "Dark", "Monospace"],
    palette: ["#00FF41", "#008F11", "#003B00", "#0D0D0D"],
    previewLines: [
      "[ SYSTEM ] > LOADING MOD APK...",
      "$ app --name=Spotify --ver=8.9.12",
      "> Status: [██████████] 100% UNLOCKED",
    ],
    settings: {
      template: `<code>[ SYSTEM ] &gt; LOADING MOD APK...</code>
<b>{title}</b>

<code>$ app --name="{title}"
$ version  : {version}
$ size     : {size}
$ android  : {android}
$ category : {category}
$ updated  : {date}</code>

<code>&gt; MOD FEATURES:</code>
{modFeatures}

<code>&gt; Status: [██████████] 100% PATCHED ✓
&gt; Anti-ban: ENABLED
&gt; Root req: NOT REQUIRED</code>

{hashtags}
<code>{footer}</code>`,
      titleStyle: "uppercase",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "$ ./download.sh",
      websiteButtonText: "$ ./view_page.sh",
      footerText: "// root channel — elite mods for power users",
      hashtagsTemplate: "#{title} #Hacker #ModAPK #Root #{category} #Android",
      dateFormat: "short",
    },
  },

  // 6. Luxury Black Gold
  {
    id: "luxury-black-gold",
    name: "Luxury Black Gold",
    description: "Sophisticated luxury tone with gold crown emojis and premium language",
    tags: ["Luxury", "Elegant", "Gold", "Sophisticated"],
    palette: ["#FFD700", "#C9A84C", "#1C1C1C", "#0A0A0A"],
    previewLines: [
      "👑 SPOTIFY PREMIUM — EXCLUSIVE MOD",
      "◆ Curated premium features inside",
      "✦ Version 8.9.12  ◆  Size 45 MB",
    ],
    settings: {
      template: `👑 <b>{title}</b> 👑

◆ <b>Exclusive MOD Features:</b>
{modFeatures}

✦ Version: <b>{version}</b>
✦ Size: <b>{size}</b>
✦ Android: <b>{android}</b>
✦ Category: <b>{category}</b>
✦ Updated: <b>{date}</b>

━━━ 𝐋𝐔𝐗𝐔𝐑𝐘 𝐄𝐃𝐈𝐓𝐈𝐎𝐍 ━━━

{hashtags}

{footer}`,
      titleStyle: "uppercase",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "👑 ACCESS EXCLUSIVE MOD",
      websiteButtonText: "✦ View Collection",
      footerText: "👑 Only the finest mods — for those who demand excellence.",
      hashtagsTemplate: "#{title} #Luxury #Premium #Gold #{category} #ModAPK",
      dateFormat: "long",
    },
  },

  // 7. Neon Cyberpunk
  {
    id: "neon-cyberpunk",
    name: "Neon Cyberpunk",
    description: "Neon-charged cyberpunk aesthetic with ultra-modern futuristic vibe",
    tags: ["Cyberpunk", "Neon", "Futuristic", "Ultra-modern"],
    palette: ["#FF00FF", "#00FFFF", "#FF6EC7", "#0D001A"],
    previewLines: [
      "⚡ SPOTIFY // NEURAL MOD v8.9 ⚡",
      "🔮 CORE MODULES INJECTED:",
      "◈ Premium Bypass  ◈ Ad Nullifier",
    ],
    settings: {
      template: `⚡ <b>{title}</b> ⚡

🔮 <b>CORE MODULES INJECTED:</b>
{modFeatures}

◈ <b>BUILD:</b> <code>{version}</code>
◈ <b>PAYLOAD:</b> {size}
◈ <b>KERNEL:</b> Android {android}
◈ <b>SECTOR:</b> {category}
◈ <b>TIMESTAMP:</b> {date}

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

{hashtags}

{footer}`,
      titleStyle: "uppercase",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "⚡ INJECT MOD",
      websiteButtonText: "🔮 ACCESS NODE",
      footerText: "⚡ Plug in. Download. Dominate. — Cyberpunk Mods",
      hashtagsTemplate: "#{title} #Cyberpunk #Neon #ModAPK #{category} #Future",
      dateFormat: "relative",
    },
  },

  // 8. Viral Telegram
  {
    id: "viral-telegram",
    name: "Viral Telegram",
    description: "Engineered for maximum engagement, shares, and viral Telegram reach",
    tags: ["Viral", "Engagement", "Share-worthy", "High-Energy"],
    palette: ["#FF4500", "#FF8C00", "#FFD700", "#1a0a00"],
    previewLines: [
      "🚀🔥 SPOTIFY PREMIUM FREE — LIMITED!",
      "💎 This won't last long — grab it NOW!",
      "✅ 1M+ downloads  🔥 Trending today",
    ],
    settings: {
      template: `🚀🔥 <b>{title}</b> — FREE DOWNLOAD!

💎 <b>What you get TODAY:</b>
{modFeatures}

⏰ <b>Don't miss out!</b>
📱 Version: {version}  |  📦 Size: {size}
🤖 Works on Android {android}+
📂 {category}  |  🗓️ {date}

🔁 <b>SHARE this with friends!</b>
👇 <b>Download NOW before it's gone</b> 👇

{hashtags}

{footer}`,
      titleStyle: "uppercase",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "🔥 DOWNLOAD FREE NOW",
      websiteButtonText: "💎 See Full Details",
      footerText: "🚀 Share & join 500K+ members getting free MODs daily!",
      hashtagsTemplate: "#{title} #Free #Viral #ModAPK #{category} #MustHave #Trending",
      dateFormat: "relative",
    },
  },

  // 9. App Store Style
  {
    id: "app-store-style",
    name: "App Store Style",
    description: "Structured like a professional App Store listing — clean and polished",
    tags: ["Professional", "Structured", "App Store", "Clean"],
    palette: ["#007AFF", "#34C759", "#5AC8FA", "#1C1C1E"],
    previewLines: [
      "Spotify Premium  ★★★★★  4.8",
      "Version 8.9.12 · 45 MB · Music",
      "What's New: Premium unlocked, No Ads",
    ],
    settings: {
      template: `<b>{title}</b>
⭐⭐⭐⭐⭐  <i>4.8 · Editor's Choice</i>

<b>About This App</b>
Category: {category}
Version: {version}  |  Size: {size}
Requires Android: {android}+
Last Updated: {date}

<b>What's New in This MOD</b>
{modFeatures}

<b>Changelog</b>
{changelog}

{hashtags}

{footer}`,
      titleStyle: "bold",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: true,
      showHashtags: true,
      showFooter: true,
      downloadButtonText: "⬇️ Get App",
      websiteButtonText: "ℹ️ More Info",
      footerText: "Curated Android apps — quality you can trust.",
      hashtagsTemplate: "#{title} #{category} #Android #AppStore #ModAPK",
      dateFormat: "long",
    },
  },

  // 10. Compact Mobile
  {
    id: "compact-mobile",
    name: "Compact Mobile",
    description: "Ultra-short, one-screen format — emoji-heavy but minimal text",
    tags: ["Compact", "Mobile", "Quick", "Minimal"],
    palette: ["#6C63FF", "#48CAE4", "#90E0EF", "#03045E"],
    previewLines: [
      "📲 Spotify MOD v8.9 · 45MB",
      "✅ Premium  ✅ No Ads  ✅ Offline",
      "🤖 Android 5.0+  📂 Music",
    ],
    settings: {
      template: `📲 <b>{title}</b> · {version} · {size}
{modFeatures}
🤖 {android} | 📂 {category} | 📅 {date}
{hashtags}
{footer}`,
      titleStyle: "bold",
      showTitle: true,
      showVersion: true,
      showSize: true,
      showAndroid: true,
      showCategory: true,
      showDate: true,
      showModFeatures: true,
      showChangelog: false,
      showHashtags: true,
      showFooter: false,
      downloadButtonText: "📲 Download",
      websiteButtonText: "🌐 More",
      footerText: null,
      hashtagsTemplate: "#{title} #ModAPK #{category}",
      dateFormat: "short",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPresetActive(preset: Preset, current: TelegramTemplateSettings): boolean {
  const s = preset.settings;
  if (s.template && current.template !== s.template) return false;
  if (s.titleStyle !== undefined && current.titleStyle !== s.titleStyle) return false;
  if (s.downloadButtonText !== undefined && current.downloadButtonText !== s.downloadButtonText) return false;
  return true;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onApply: () => void;
}

function PresetCard({ preset, isActive, onApply }: PresetCardProps) {
  const [hovered, setHovered] = useState(false);
  const [applying, setApplying] = useState(false);
  const primaryColor = preset.palette[0];
  const secondaryColor = preset.palette[1] || preset.palette[0];

  const handleApply = () => {
    setApplying(true);
    setTimeout(() => {
      onApply();
      setApplying(false);
    }, 400);
  };

  const cardStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: "16px",
    padding: "0",
    cursor: "pointer",
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
    transform: hovered ? "scale(1.02) translateY(-3px)" : "scale(1) translateY(0)",
    boxShadow: hovered
      ? `0 0 0 1px ${primaryColor}55, 0 8px 32px ${primaryColor}40, 0 20px 60px rgba(0,0,0,0.4)`
      : isActive
      ? `0 0 0 1.5px ${primaryColor}88, 0 4px 20px ${primaryColor}25`
      : "0 0 0 1px rgba(255,255,255,0.06), 0 4px 20px rgba(0,0,0,0.3)",
    background: hovered
      ? `linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)`
      : `linear-gradient(135deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.02) 100%)`,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    overflow: "hidden",
  };

  const glowBorderStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "16px",
    border: `1px solid ${primaryColor}${hovered ? "66" : isActive ? "44" : "15"}`,
    transition: "border-color 0.3s ease",
    pointerEvents: "none",
    zIndex: 1,
  };

  const topAccentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, transparent)`,
    opacity: hovered ? 1 : isActive ? 0.8 : 0.3,
    transition: "opacity 0.3s ease",
    borderRadius: "16px 16px 0 0",
  };

  const previewStyle: React.CSSProperties = {
    margin: "16px 16px 12px 16px",
    borderRadius: "10px",
    background: "rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.07)",
    padding: "12px 14px",
    minHeight: "72px",
    position: "relative",
    overflow: "hidden",
  };

  const previewInnerGlow: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
    background: `radial-gradient(ellipse at top left, ${primaryColor}12 0%, transparent 65%)`,
    pointerEvents: "none",
  };

  const avatarStyle: React.CSSProperties = {
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: 700,
    color: "#fff",
    flexShrink: 0,
    boxShadow: `0 0 8px ${primaryColor}60`,
  };

  const previewBubble: React.CSSProperties = {
    flex: 1,
    background: `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)`,
    borderRadius: "0 8px 8px 8px",
    padding: "7px 10px",
    border: "1px solid rgba(255,255,255,0.06)",
  };

  const bodyStyle: React.CSSProperties = {
    padding: "0 16px 16px 16px",
    position: "relative",
    zIndex: 2,
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow border overlay */}
      <div style={glowBorderStyle} />
      {/* Top accent line */}
      <div style={topAccentStyle} />

      {/* Active badge */}
      {isActive && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: `linear-gradient(135deg, ${primaryColor}EE, ${secondaryColor}DD)`,
            borderRadius: "20px",
            padding: "3px 10px 3px 6px",
            fontSize: "10px",
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.02em",
            boxShadow: `0 2px 12px ${primaryColor}60`,
            animation: "activeGlow 2s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "13px" }}>✓</span>
          ACTIVE
        </div>
      )}

      {/* Mini Message Preview */}
      <div style={previewStyle}>
        <div style={previewInnerGlow} />
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          <div style={avatarStyle}>T</div>
          <div style={previewBubble}>
            {preset.previewLines.map((line, i) => (
              <div
                key={i}
                style={{
                  fontSize: i === 0 ? "10.5px" : "9.5px",
                  fontWeight: i === 0 ? 700 : 400,
                  color: i === 0 ? "#f1f1f1" : "rgba(255,255,255,0.55)",
                  lineHeight: "1.45",
                  marginBottom: i < preset.previewLines.length - 1 ? "2px" : 0,
                  fontFamily: preset.id === "hacker-style" ? "monospace" : "inherit",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div style={bodyStyle}>
        {/* Name */}
        <div style={{ marginBottom: "5px" }}>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#f1f1f1",
              letterSpacing: "-0.01em",
            }}
          >
            {preset.name}
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "11.5px",
            color: "rgba(255,255,255,0.45)",
            margin: "0 0 11px 0",
            lineHeight: "1.5",
            fontWeight: 400,
          }}
        >
          {preset.description}
        </p>

        {/* Palette + Tags row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "13px",
            gap: "8px",
          }}
        >
          {/* Color palette dots */}
          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {preset.palette.map((color, i) => (
              <div
                key={i}
                style={{
                  width: "13px",
                  height: "13px",
                  borderRadius: "50%",
                  background: color,
                  boxShadow: hovered ? `0 0 8px ${color}90` : `0 0 4px ${color}50`,
                  border: "1px solid rgba(255,255,255,0.15)",
                  transition: "box-shadow 0.3s ease",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>

          {/* Tags */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              flex: 1,
            }}
          >
            {preset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "9.5px",
                  fontWeight: 600,
                  padding: "2px 7px",
                  borderRadius: "10px",
                  background: `${primaryColor}18`,
                  color: `${primaryColor}DD`,
                  border: `1px solid ${primaryColor}25`,
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                  transition: "background 0.3s ease, border-color 0.3s ease",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          disabled={applying}
          style={{
            width: "100%",
            padding: "9px 14px",
            borderRadius: "10px",
            border: `1px solid ${primaryColor}${hovered ? "66" : "33"}`,
            background: isActive
              ? `linear-gradient(135deg, ${primaryColor}DD, ${secondaryColor}BB)`
              : hovered
              ? `linear-gradient(135deg, ${primaryColor}28, ${secondaryColor}18)`
              : `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
            color: isActive ? "#fff" : hovered ? primaryColor : "rgba(255,255,255,0.7)",
            fontSize: "12px",
            fontWeight: 700,
            cursor: applying ? "not-allowed" : "pointer",
            transition: "all 0.25s ease",
            letterSpacing: "0.04em",
            textTransform: "uppercase" as const,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            boxShadow: isActive ? `0 4px 16px ${primaryColor}50` : "none",
            outline: "none",
            opacity: applying ? 0.7 : 1,
            transform: applying ? "scale(0.97)" : "scale(1)",
          }}
        >
          {applying ? (
            <>
              <span style={{ animation: "spin 0.7s linear infinite", display: "inline-block" }}>⟳</span>
              Applying…
            </>
          ) : isActive ? (
            <>✓ Applied</>
          ) : (
            <>Apply Template</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TelegramPresetGallery({ onApply, currentSettings }: Props) {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const allTags = Array.from(new Set(PRESETS.flatMap((p) => p.tags)));

  const filtered = PRESETS.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchesFilter = !activeFilter || p.tags.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const containerStyle: React.CSSProperties = {
    width: "100%",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: "24px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 800,
    color: "#f1f1f1",
    margin: "0 0 4px 0",
    letterSpacing: "-0.025em",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: "13px",
    color: "rgba(255,255,255,0.42)",
    margin: "0 0 18px 0",
    fontWeight: 400,
  };

  const searchBarStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
  };

  const searchInputStyle: React.CSSProperties = {
    flex: 1,
    background: "rgba(255,255,255,0.055)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "9px 14px",
    color: "#f1f1f1",
    fontSize: "13px",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    fontFamily: "inherit",
  };

  const filterRowStyle: React.CSSProperties = {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    marginBottom: "22px",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "16px",
  };

  const emptyStyle: React.CSSProperties = {
    textAlign: "center",
    padding: "60px 20px",
    color: "rgba(255,255,255,0.3)",
    fontSize: "14px",
  };

  return (
    <>
      {/* CSS Keyframes */}
      <style>{`
        @keyframes activeGlow {
          0%, 100% { box-shadow: 0 2px 12px var(--glow-color, #FF450060); }
          50% { box-shadow: 0 2px 20px var(--glow-color, #FF450090), 0 0 30px var(--glow-color, #FF450030); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .preset-search-input:focus {
          border-color: rgba(139, 92, 246, 0.5) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
        }
        .preset-card-grid > * {
          animation: fadeSlideIn 0.35s ease both;
        }
        .preset-card-grid > *:nth-child(1) { animation-delay: 0ms; }
        .preset-card-grid > *:nth-child(2) { animation-delay: 40ms; }
        .preset-card-grid > *:nth-child(3) { animation-delay: 80ms; }
        .preset-card-grid > *:nth-child(4) { animation-delay: 120ms; }
        .preset-card-grid > *:nth-child(5) { animation-delay: 160ms; }
        .preset-card-grid > *:nth-child(6) { animation-delay: 200ms; }
        .preset-card-grid > *:nth-child(7) { animation-delay: 240ms; }
        .preset-card-grid > *:nth-child(8) { animation-delay: 280ms; }
        .preset-card-grid > *:nth-child(9) { animation-delay: 320ms; }
        .preset-card-grid > *:nth-child(10) { animation-delay: 360ms; }
        .filter-chip:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px) !important;
        }
        .filter-chip {
          transition: all 0.18s ease !important;
        }
      `}</style>

      <div style={containerStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "9px",
                background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                flexShrink: 0,
              }}
            >
              ✦
            </span>
            Template Preset Gallery
          </h2>
          <p style={subtitleStyle}>
            {PRESETS.length} premium presets — click to instantly apply a full template style
          </p>

          {/* Search bar */}
          <div style={searchBarStyle}>
            <div style={{ position: "relative", flex: 1 }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.3)",
                  fontSize: "14px",
                  pointerEvents: "none",
                }}
              >
                🔍
              </span>
              <input
                className="preset-search-input"
                style={{ ...searchInputStyle, paddingLeft: "36px" }}
                placeholder="Search presets by name or style…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {(search || activeFilter) && (
              <button
                onClick={() => { setSearch(""); setActiveFilter(null); }}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "9px 14px",
                  color: "rgba(255,255,255,0.6)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Tag filter chips */}
          <div style={filterRowStyle}>
            <button
              className="filter-chip"
              onClick={() => setActiveFilter(null)}
              style={{
                padding: "4px 13px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: !activeFilter ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.1)",
                background: !activeFilter ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                color: !activeFilter ? "#a78bfa" : "rgba(255,255,255,0.4)",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "0.02em",
                fontFamily: "inherit",
              }}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className="filter-chip"
                onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
                style={{
                  padding: "4px 13px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor:
                    activeFilter === tag
                      ? "rgba(139,92,246,0.6)"
                      : "rgba(255,255,255,0.1)",
                  background:
                    activeFilter === tag
                      ? "rgba(139,92,246,0.2)"
                      : "rgba(255,255,255,0.04)",
                  color:
                    activeFilter === tag
                      ? "#a78bfa"
                      : "rgba(255,255,255,0.4)",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                  fontFamily: "inherit",
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={emptyStyle}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
            No presets match your search
            <br />
            <span style={{ fontSize: "12px", opacity: 0.6 }}>
              Try a different keyword or clear the filters
            </span>
          </div>
        ) : (
          <div className="preset-card-grid" style={gridStyle}>
            {filtered.map((preset) => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isActive={isPresetActive(preset, currentSettings)}
                onApply={() => onApply(preset.settings)}
              />
            ))}
          </div>
        )}

        {/* Footer count */}
        <div
          style={{
            marginTop: "20px",
            textAlign: "center",
            fontSize: "11.5px",
            color: "rgba(255,255,255,0.2)",
            fontWeight: 500,
          }}
        >
          Showing {filtered.length} of {PRESETS.length} presets
        </div>
      </div>
    </>
  );
}
