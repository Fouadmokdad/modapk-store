"use client";

// =============================================================================
// TelegramAIPanel — Smart Content Generation Engine
// Wired to /api/ai/rewrite-content
// =============================================================================

import React, { useState } from "react";

interface Props {
  currentTemplate: string;
  onApply: (newTemplate: string) => void;
}

type AITone = "professional" | "gaming" | "hacker" | "anime" | "minimal" | "viral" | "luxury";
type AIAction =
  | "generate_caption"
  | "optimize_clicks"
  | "clean_formatting"
  | "seo_hashtags"
  | "add_emojis"
  | "generate_cta"
  | "rewrite_premium";

const TONES: { id: AITone; label: string; emoji: string; desc: string; color: string }[] = [
  { id: "professional", label: "Professional", emoji: "💼", desc: "Clean, authoritative", color: "#3b82f6" },
  { id: "gaming", label: "Gaming", emoji: "🎮", desc: "Bold, energetic", color: "#f59e0b" },
  { id: "hacker", label: "Hacker", emoji: "💻", desc: "Technical, matrix-vibe", color: "#22c55e" },
  { id: "anime", label: "Anime", emoji: "✨", desc: "Kawaii, expressive", color: "#ec4899" },
  { id: "minimal", label: "Minimal", emoji: "◽", desc: "Simple, elegant", color: "#94a3b8" },
  { id: "viral", label: "Viral", emoji: "🚀", desc: "Max engagement", color: "#f43f5e" },
  { id: "luxury", label: "Luxury", emoji: "👑", desc: "Premium, exclusive", color: "#eab308" },
];

const ACTIONS: { id: AIAction; label: string; emoji: string; desc: string }[] = [
  { id: "generate_caption", label: "Generate Caption", emoji: "✍️", desc: "Full post from scratch" },
  { id: "optimize_clicks", label: "Optimize for Clicks", emoji: "🎯", desc: "Boost CTR & engagement" },
  { id: "clean_formatting", label: "Clean Formatting", emoji: "🧹", desc: "Fix spacing & structure" },
  { id: "seo_hashtags", label: "SEO Hashtags", emoji: "#️⃣", desc: "Generate viral hashtags" },
  { id: "add_emojis", label: "Add Emojis", emoji: "😊", desc: "Smart emoji placement" },
  { id: "generate_cta", label: "Generate CTA", emoji: "📣", desc: "Compelling call-to-action" },
  { id: "rewrite_premium", label: "Premium Rewrite", emoji: "💎", desc: "Full premium transformation" },
];

const TONE_PROMPTS: Record<AITone, string> = {
  professional: "Rewrite in a professional, authoritative tone. Clean language, no excessive emojis. Use proper formatting.",
  gaming: "Rewrite in an energetic gaming style! Use gaming emojis 🎮🔥⚡, bold caps for emphasis, make it exciting and hype!",
  hacker: "Rewrite in a hacker/technical style. Use code references, technical language, monospace feel. Matrix aesthetic.",
  anime: "Rewrite in a kawaii anime style! Use cute emojis ✨🌸💫, expressive language, enthusiastic tone desu~",
  minimal: "Rewrite in an ultra-minimal style. Remove all unnecessary words. No emojis. Just the essentials, perfectly structured.",
  viral: "Rewrite for MAXIMUM virality and engagement! Use power words, urgency, FOMO triggers, fire emojis 🔥🚀💥. Make it irresistible!",
  luxury: "Rewrite in a luxury premium style. Sophisticated language, 👑💎✨ emojis, exclusive tone. This is a premium product.",
};

const ACTION_PROMPTS: Record<AIAction, string> = {
  generate_caption: "Generate a complete, compelling Telegram post caption for a MOD APK app. Include title, features, version info, hashtags, and a call to action.",
  optimize_clicks: "Rewrite this Telegram post to maximize click-through rate. Add urgency, social proof, and compelling hooks. Keep variables intact.",
  clean_formatting: "Clean up the formatting of this Telegram post. Fix spacing, ensure consistent structure, remove duplicate empty lines, keep all variables {title} etc intact.",
  seo_hashtags: "Generate a comprehensive set of SEO-optimized hashtags for a MOD APK Telegram post. Include app-specific, category, and trending hashtags.",
  add_emojis: "Add contextually appropriate emojis to enhance this Telegram post. Place emojis strategically before key lines. Keep all variables {title} etc intact.",
  generate_cta: "Add a compelling call-to-action section to this Telegram post. Create urgency and excitement. Keep all variables intact.",
  rewrite_premium: "Transform this into a premium, high-converting Telegram post. Make it look like it was written by a professional marketing team. Keep all variables {title} etc intact.",
};

export function TelegramAIPanel({ currentTemplate, onApply }: Props) {
  const [selectedTone, setSelectedTone] = useState<AITone>("professional");
  const [selectedAction, setSelectedAction] = useState<AIAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);

  const handleGenerate = async (action: AIAction) => {
    setSelectedAction(action);
    setLoading(true);
    setResult(null);
    setError(null);
    setApplied(false);

    const tonePart = TONE_PROMPTS[selectedTone];
    const actionPart = ACTION_PROMPTS[action];
    const prompt = `${actionPart}\n\nTone: ${tonePart}\n\nCurrent template:\n${currentTemplate}\n\nIMPORTANT: Keep all template variables in curly braces like {title}, {version}, {size}, {android}, {category}, {date}, {modFeatures}, {hashtags}, {footer} exactly as they are. Only rewrite the surrounding text.`;

    try {
      const res = await fetch("/api/ai/rewrite-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, content: currentTemplate }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "AI generation failed");
      }

      const json = await res.json();
      const generated = json.result || json.content || json.text || json.data;
      if (!generated) throw new Error("No content returned from AI");
      setResult(generated);
    } catch (err: any) {
      setError(err.message || "Failed to generate content. Check your AI API configuration.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setApplied(true);
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div style={S.root}>
      <style>{`
        @keyframes ai-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes ai-pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes ai-slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ai-glow:hover { box-shadow: 0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.15); }
      `}</style>

      {/* ── Tone Selector ─────────────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>AI Tone</span>
          <span style={S.sectionHint}>Select writing style</span>
        </div>
        <div style={S.toneGrid}>
          {TONES.map((tone) => (
            <button
              key={tone.id}
              type="button"
              onClick={() => setSelectedTone(tone.id)}
              style={{
                ...S.toneBtn,
                borderColor: selectedTone === tone.id ? tone.color + "60" : "rgba(255,255,255,0.06)",
                background: selectedTone === tone.id ? tone.color + "12" : "rgba(255,255,255,0.02)",
                boxShadow: selectedTone === tone.id ? `0 0 16px ${tone.color}20` : "none",
              }}
            >
              <span style={{ fontSize: 20 }}>{tone.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: selectedTone === tone.id ? tone.color : "rgba(255,255,255,0.7)" }}>
                {tone.label}
              </span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.3 }}>
                {tone.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Action Buttons ────────────────────────────────────────────────────── */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>AI Actions</span>
          <span style={S.sectionHint}>Click to generate</span>
        </div>
        <div style={S.actionGrid}>
          {ACTIONS.map((action) => {
            const isActive = selectedAction === action.id;
            const isLoading = loading && isActive;
            return (
              <button
                key={action.id}
                type="button"
                disabled={loading}
                onClick={() => handleGenerate(action.id)}
                className="ai-glow"
                style={{
                  ...S.actionBtn,
                  background: isActive
                    ? "rgba(168,85,247,0.12)"
                    : "rgba(255,255,255,0.025)",
                  borderColor: isActive ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.07)",
                  opacity: loading && !isActive ? 0.5 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {isLoading ? (
                    <div style={{ display: "flex", gap: 3 }}>
                      {[0, 1, 2].map((i) => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#a855f7", display: "inline-block", animation: `ai-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 16 }}>{action.emoji}</span>
                  )}
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#c084fc" : "rgba(255,255,255,0.8)" }}>
                      {action.label}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{action.desc}</div>
                  </div>
                </div>
                {isActive && !loading && <span style={{ fontSize: 9, color: "#a855f7", marginLeft: "auto" }}>LAST</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error State ───────────────────────────────────────────────────────── */}
      {error && (
        <div style={S.errorCard}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171" }}>AI Generation Failed</div>
            <div style={{ fontSize: 11, color: "rgba(248,113,113,0.7)", marginTop: 4, lineHeight: 1.4 }}>{error}</div>
          </div>
        </div>
      )}

      {/* ── Loading State ─────────────────────────────────────────────────────── */}
      {loading && (
        <div style={S.loadingCard}>
          <div style={S.shimmerBar} />
          <div style={S.shimmerBar} />
          <div style={{ ...S.shimmerBar, width: "60%" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 3 }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", display: "inline-block", animation: `ai-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: "rgba(168,85,247,0.7)" }}>AI is generating content...</span>
          </div>
        </div>
      )}

      {/* ── Result Card ───────────────────────────────────────────────────────── */}
      {result && !loading && (
        <div style={{ ...S.resultCard, animation: "ai-slide-in 0.3s ease" }}>
          <div style={S.resultHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={S.resultIcon}>✨</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#c084fc" }}>AI Generated Result</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  {selectedAction ? String(selectedAction).replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) : ""} · {TONES.find(t => t.id === selectedTone)?.label} tone
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setResult(null)}
                style={S.resultDiscardBtn}
              >
                ✕ Discard
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={{
                  ...S.resultApplyBtn,
                  background: applied ? "rgba(34,197,94,0.2)" : "rgba(168,85,247,0.2)",
                  borderColor: applied ? "rgba(34,197,94,0.4)" : "rgba(168,85,247,0.4)",
                  color: applied ? "#4ade80" : "#c084fc",
                }}
              >
                {applied ? "✅ Applied!" : "↑ Apply to Editor"}
              </button>
            </div>
          </div>
          <pre style={S.resultPre}>{result}</pre>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 20 },
  section: { background: "rgba(0,0,0,0.15)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 14 },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" },
  sectionHint: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
  toneGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 8 },
  toneBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "12px 8px", borderRadius: 12, border: "1px solid", cursor: "pointer", transition: "all 0.2s ease", background: "transparent" },
  actionGrid: { display: "flex", flexDirection: "column", gap: 6 },
  actionBtn: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid", transition: "all 0.2s ease", textAlign: "left", width: "100%" },
  errorCard: { display: "flex", gap: 12, padding: "14px 16px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12 },
  loadingCard: { padding: 16, background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 },
  shimmerBar: { height: 10, borderRadius: 6, background: "linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(168,85,247,0.25) 50%, rgba(168,85,247,0.1) 100%)", backgroundSize: "200% 100%", animation: "ai-shimmer 1.5s linear infinite" },
  resultCard: { background: "rgba(168,85,247,0.05)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 14, overflow: "hidden" },
  resultHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid rgba(168,85,247,0.1)", gap: 10, flexWrap: "wrap" },
  resultIcon: { width: 32, height: 32, borderRadius: 10, background: "rgba(168,85,247,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 },
  resultDiscardBtn: { padding: "6px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 600, cursor: "pointer" },
  resultApplyBtn: { padding: "6px 14px", border: "1px solid", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease" },
  resultPre: { padding: "14px 16px", fontSize: 11, color: "#c084fc", fontFamily: "monospace", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, lineHeight: 1.7, background: "transparent", maxHeight: 300, overflowY: "auto" },
};
