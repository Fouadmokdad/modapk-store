"use client";

// =============================================================================
// Public App Detail — Premium Client Component
// =============================================================================
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ReportModal } from "@/components/app/ReportModal";

interface AppDetailProps {
  app: {
    id: string;
    slug: string;
    title: { en: string; ar: string };
    shortDescription: { en: string; ar: string };
    description: { en: string; ar: string };
    iconUrl: string | null;
    headerImageUrl: string | null;
    developer: string | null;
    originalPlayStoreUrl: string | null;
    packageName: string | null;
    rating: number | null;
    contentRating: string | null;
    installs: string | null;
    downloadCount: number;
    viewCount: number;
    type: string;
    releaseType: string;
    safetyDisclaimer: { en: string; ar: string } | null;
    modFeatures?: { en: string; ar: string }[] | null;
    category: { name: { en: string; ar: string }; slug: string } | null;
    tags: { tag: { name: { en: string; ar: string }; slug: string } }[];
    versions: {
      id: string;
      versionName: string;
      size: string | null;
      minAndroid: string | null;
      apkSize: string | null;
      androidRequirement: string | null;
      changelog: { en: string; ar: string } | null;
      isLatest: boolean;
      createdAt: string;
      downloadLinks: {
        id: string;
        label: string;
        url: string;
        isPrimary: boolean;
      }[];
      downloadMirrors?: {
        id: string;
        hostName: string;
        downloadUrl: string;
        redirectEnabled: boolean;
        priority: number;
        healthStatus: string;
      }[];
    }[];
    screenshots: { id: string; url: string; altText: string | null }[];
  };
  relatedApps: {
    id: string;
    slug: string;
    title: { en: string; ar: string };
    iconUrl: string | null;
    type: string;
    downloadCount: number;
    category: { name: { en: string; ar: string } } | null;
    versions: { versionName: string }[];
  }[];
}

/**
 * Premium Social Sharing Panel Component
 */
function SocialShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shares = [
    {
      name: "Facebook",
      icon: "📘",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
    },
    {
      name: "X",
      icon: "🐦",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
    },
    {
      name: "WhatsApp",
      icon: "🟢",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " - " + currentUrl)}`,
    },
    {
      name: "Telegram",
      icon: "✈️",
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      {shares.map((sh) => (
        <a
          key={sh.name}
          href={sh.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all duration-200 text-xs font-semibold active:scale-95"
        >
          <span className="text-sm">{sh.icon}</span>
          <span>{sh.name}</span>
        </a>
      ))}
      <button
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-4.5 py-2 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 border cursor-pointer sm:ms-auto ${
          copied
            ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
            : "bg-gradient-to-r from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
        }`}
      >
        <span className="text-sm">🔗</span>
        <span>{copied ? "Copied!" : "Copy Link"}</span>
      </button>
    </div>
  );
}

// ─── Premium MOD Menu Features Accordion ──────────────────────────────────────
function ModMenuCard({ text, locale }: { text: string; locale: string }) {
  const [isOpen, setIsOpen] = useState(true);

  const features = React.useMemo(() => {
    if (!text) return [];
    let cleaned = text.replace(/^⚠️\s*/, "").replace(/^MOD Menu:?\s*/i, "").trim();
    
    // Split by common separators if present
    if (/[•\n,;-]/.test(cleaned)) {
      return cleaned
        .split(/[•\n,;-]+/)
        .map(item => item.trim())
        .filter(Boolean);
    }
    
    // Split before keywords using regex lookahead
    const keywords = /(?=Unlimited|Unlock|No Ads|Always|Big Amount|Free|God |Mega |Anti-Ban|Menu)/i;
    const items = cleaned.split(keywords).map(item => item.trim()).filter(Boolean);
    
    return items.length > 1 ? items : [cleaned];
  }, [text]);

  if (features.length === 0) return null;

  return (
    <div 
      className="rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(0,229,255,0.06)]"
      style={{ 
        background: "linear-gradient(135deg, hsl(262 83% 58% / 0.05), hsl(187 100% 50% / 0.05))",
        borderColor: "hsl(var(--color-border))"
      }}
    >
      {/* Header (Accordion Toggle) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4.5 text-start font-bold cursor-pointer transition-colors hover:bg-white/[0.02]"
        style={{ fontFamily: "Syne, sans-serif" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl animate-bounce">⚡</span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white" style={{ letterSpacing: "0.02em" }}>
              {locale === "ar" ? "قائمة المود (MOD Menu)" : "MOD Menu Features"}
            </h3>
            <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
              {locale === "ar" ? "ميزات معدلة مفعلة" : "Premium Unlocked Features"}
            </span>
          </div>
        </div>
        
        {/* Toggle Icon */}
        <div 
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      {/* Accordion Content Panel */}
      <div 
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[800px] border-t border-white/[0.04] p-4 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
        style={{ background: "hsl(var(--color-bg-card) / 0.2)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {features.map((feature, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all hover:scale-[1.01] hover:bg-white/[0.02]"
              style={{ 
                background: "hsl(var(--color-bg-secondary) / 0.3)", 
                borderColor: "hsl(var(--color-border) / 0.6)" 
              }}
            >
              {/* Feature Icon Indicator */}
              <div 
                className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ 
                  background: "hsl(142 71% 45% / 0.15)", 
                  color: "hsl(142 71% 45%)",
                  border: "1px solid hsl(142 71% 45% / 0.25)"
                }}
              >
                ✓
              </div>
              
              {/* Feature Label */}
              <span className="text-xs font-medium text-neutral-200" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Small safe disclaimer footer */}
        <div className="mt-3.5 flex items-center gap-1.5 text-[9px] text-neutral-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
          <span>🛡️</span>
          <span>{locale === "ar" ? "تم التحقق من جميع الميزات وخلوها من الفيروسات." : "All modifications are verified, safe, and active."}</span>
        </div>
      </div>
    </div>
  );
}

export default function AppDetailClient({ app, relatedApps }: AppDetailProps) {
  const { locale, t } = useLocale();
  const [screenshotIdx, setScreenshotIdx] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Dynamic orientation detection
  const [orientations, setOrientations] = useState<Record<string, 'portrait' | 'landscape'>>({});

  // Touch Swipe Gesture State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const handlePrevScreenshot = () => {
    setScreenshotIdx((prev) => (prev === 0 ? app.screenshots.length - 1 : prev - 1));
  };
  const handleNextScreenshot = () => {
    setScreenshotIdx((prev) => (prev === app.screenshots.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focus is inside forms/inputs
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true"
      ) {
        return;
      }

      if (e.key === "ArrowLeft") {
        if (locale === "ar") {
          handleNextScreenshot();
        } else {
          handlePrevScreenshot();
        }
      } else if (e.key === "ArrowRight") {
        if (locale === "ar") {
          handlePrevScreenshot();
        } else {
          handleNextScreenshot();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [locale, app.screenshots.length]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      if (locale === "ar") {
        handlePrevScreenshot();
      } else {
        handleNextScreenshot();
      }
    } else if (isRightSwipe) {
      if (locale === "ar") {
        handleNextScreenshot();
      } else {
        handlePrevScreenshot();
      }
    }
  };

  const txt = (obj: { en: string; ar: string } | null | undefined) =>
    obj ? (locale === "ar" && obj.ar ? obj.ar : obj.en) : "";

  const latestVersion = app.versions.find((v) => v.isLatest) || app.versions[0];
  const primaryMirror = latestVersion?.downloadMirrors?.find((m) => m.priority === 1) || latestVersion?.downloadMirrors?.[0];
  const primaryLink = latestVersion?.downloadLinks?.find((l) => l.isPrimary) || latestVersion?.downloadLinks?.[0];
  
  const primaryDownloadQuery = primaryMirror 
    ? `mirrorId=${primaryMirror.id}` 
    : primaryLink 
      ? `linkId=${primaryLink.id}` 
      : "";

  const description = txt(app.description) || txt(app.shortDescription);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-[100px]"
            style={{ background: "var(--gradient-brand)" }} />
        </div>

        <div className="container relative z-10 py-8 sm:py-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            <Link href="/" className="hover:underline">{t("common.home")}</Link>
            <span>/</span>
            <Link href={app.type === "GAME" ? "/games" : "/apps"} className="hover:underline">
              {app.type === "GAME" ? t("nav.games") : t("nav.apps")}
            </Link>
            {app.category && (
              <>
                <span>/</span>
                <Link href={`/categories/${app.category.slug}`} className="hover:underline">{txt(app.category.name)}</Link>
              </>
            )}
            <span>/</span>
            <span style={{ color: "hsl(var(--color-text-secondary))" }}>{txt(app.title)}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-5">
            {/* Icon */}
            <div className="shrink-0">
              {app.iconUrl ? (
                <Image src={app.iconUrl} alt={txt(app.title)} width={100} height={100}
                  className="rounded-3xl shadow-xl" style={{ boxShadow: "var(--shadow-lg)" }} unoptimized />
              ) : (
                <div className="w-[100px] h-[100px] rounded-3xl flex items-center justify-center text-4xl"
                  style={{ background: "var(--gradient-brand)" }}>📱</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                  {txt(app.title)}
                </h1>
                {app.releaseType && (
                  <span className={`badge ${
                    app.releaseType === "ORIGINAL" ? "badge-original" : app.releaseType === "BETA" ? "badge-beta" : "badge-mod"
                  }`}>
                    {app.releaseType}
                  </span>
                )}
              </div>

              {app.developer && (
                <p className="text-sm mb-3" style={{ color: "hsl(var(--color-text-secondary))" }}>{app.developer}</p>
              )}

              {/* Info chips */}
              <div className="flex flex-wrap gap-2 mb-5">
                {app.rating != null && app.rating > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: "hsl(var(--color-bg-card))", border: "1px solid hsl(var(--color-border))" }}>
                    <span style={{ color: "hsl(38 92% 50%)" }}>★</span>
                    <span style={{ color: "hsl(var(--color-text-primary))" }}>{app.rating.toFixed(1)}</span>
                  </div>
                )}
                {latestVersion && (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: "hsl(var(--color-bg-card))", color: "hsl(var(--color-text-secondary))", border: "1px solid hsl(var(--color-border))" }}>
                    v{latestVersion.versionName}
                  </div>
                )}
                {(latestVersion?.apkSize || latestVersion?.size) && (
                  <div className="px-3 py-1.5 rounded-xl text-xs font-medium"
                    style={{ background: "hsl(var(--color-bg-card))", color: "hsl(var(--color-text-secondary))", border: "1px solid hsl(var(--color-border))" }}>
                    📦 {latestVersion.apkSize || latestVersion.size}
                  </div>
                )}
                {app.category && (
                  <Link href={`/categories/${app.category.slug}`} className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={{ background: "hsl(var(--color-bg-card))", color: "hsl(var(--color-text-secondary))", border: "1px solid hsl(var(--color-border))" }}>
                    {txt(app.category.name)}
                  </Link>
                )}
                <div className="px-3 py-1.5 rounded-xl text-xs font-medium"
                  style={{ background: "hsl(var(--color-bg-card))", color: "hsl(var(--color-text-secondary))", border: "1px solid hsl(var(--color-border))" }}>
                  ⬇ {app.downloadCount.toLocaleString()}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
                {primaryDownloadQuery && (
                  <Link href={`/download/${app.slug}?${primaryDownloadQuery}`}
                    className="flex items-center justify-center gap-2.5 h-14 px-8 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 w-full sm:w-auto text-center cursor-pointer">
                    <span className="text-xl">⬇️</span>
                    <span>{locale === "ar" ? `تحميل ${app.releaseType}` : `Download ${app.releaseType}`}</span>
                  </Link>
                )}
                {app.originalPlayStoreUrl && (
                  <a href={app.originalPlayStoreUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2.5 h-14 px-8 rounded-2xl text-base font-bold text-neutral-200 bg-black/40 border border-white/10 hover:bg-neutral-900/40 hover:border-white/20 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 w-full sm:w-auto text-center cursor-pointer">
                    <span className="text-xl">▶️</span>
                    <span>{t("app.viewOnPlayStore")}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <div className="container pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ============ LEFT COLUMN ============ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Disclaimer / MOD Menu Accordion */}
            {app.safetyDisclaimer && txt(app.safetyDisclaimer) && (
              txt(app.safetyDisclaimer).toLowerCase().includes("mod menu") ? (
                <ModMenuCard text={txt(app.safetyDisclaimer)} locale={locale} />
              ) : (
                <div className="card-flat p-4.5 fade-in flex items-start gap-3 rounded-2xl border" 
                  style={{ 
                    background: "hsl(38 92% 50% / 0.04)", 
                    borderColor: "hsl(38 92% 50% / 0.15)" 
                  }}
                >
                  <span className="text-lg">⚠️</span>
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(38 92% 50%)", fontFamily: "DM Sans, sans-serif" }}>
                    {txt(app.safetyDisclaimer)}
                  </p>
                </div>
              )
            )}

            {/* MOD Features Card */}
            {Array.isArray(app.modFeatures) && app.modFeatures.length > 0 && (
              <div 
                className="rounded-2xl border transition-all duration-300 overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)]"
                style={{ 
                  background: "linear-gradient(135deg, hsl(142 71% 45% / 0.05), hsl(262 83% 58% / 0.05))",
                  borderColor: "hsl(var(--color-border))"
                }}
              >
                <div className="p-4.5 font-bold" style={{ fontFamily: "Syne, sans-serif" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl animate-pulse">✨</span>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white" style={{ letterSpacing: "0.02em" }}>
                        {locale === "ar" ? "مميزات التعديل (MOD Features)" : "MOD Features"}
                      </h3>
                      <span className="text-[10px] uppercase font-semibold text-emerald-400 tracking-wider">
                        {locale === "ar" ? "ميزات معدلة مفعلة" : "Premium Unlocked Features"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-white/[0.04] p-4 opacity-100" style={{ background: "hsl(var(--color-bg-card) / 0.2)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {app.modFeatures.map((feat: any, idx: number) => {
                      const featureText = txt(feat);
                      if (!featureText) return null;
                      return (
                        <div 
                          key={idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border transition-all hover:scale-[1.01] hover:bg-white/[0.02]"
                          style={{ 
                            background: "hsl(var(--color-bg-secondary) / 0.3)", 
                            borderColor: "hsl(var(--color-border) / 0.6)" 
                          }}
                        >
                          <div 
                            className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ 
                              background: "hsl(142 71% 45% / 0.15)", 
                              color: "hsl(142 71% 45%)",
                              border: "1px solid hsl(142 71% 45% / 0.25)"
                            }}
                          >
                            ✓
                          </div>
                          <span className="text-xs font-medium text-neutral-200" style={{ fontFamily: "DM Sans, sans-serif" }}>
                            {featureText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Screenshots */}
            {app.screenshots.length > 0 && (() => {
              const currentScreenshot = app.screenshots[screenshotIdx];
              // Default to portrait, check orientations map as loaded
              const currentOrientation = orientations[currentScreenshot.id] || 'portrait';

              return (
                <div className="card-flat p-5 fade-in-up">
                  <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
                    📸 {t("app.screenshots")}
                  </h2>

                  {/* Main screenshot viewer with premium styling */}
                  <div className="relative group/viewer w-full flex items-center justify-center mb-6 overflow-hidden min-h-[360px] sm:min-h-[480px] md:min-h-[520px] py-4 bg-black/20 rounded-3xl border border-white/5">
                    
                    {/* Swipe Area Wrapper */}
                    <div 
                      onTouchStart={onTouchStart}
                      onTouchMove={onTouchMove}
                      onTouchEnd={onTouchEnd}
                      className="w-full flex items-center justify-center"
                    >
                      {currentOrientation === "portrait" ? (
                        /* Simulated Premium Phone Mockup Frame */
                        <div className="relative border-[8px] sm:border-[10px] border-neutral-900 rounded-[2.5rem] sm:rounded-[3rem] bg-black shadow-[0_20px_50px_rgba(0,0,0,0.8),_0_0_35px_rgba(16,185,129,0.12),_0_0_50px_rgba(139,92,246,0.12)] overflow-hidden transition-all duration-500 ease-in-out w-full max-w-[260px] sm:max-w-[300px] md:max-w-[320px] aspect-[9/19.5] max-h-[75vh]">
                          
                          {/* Notch / Dynamic Island */}
                          <div className="absolute top-2.5 sm:top-3 left-1/2 -translate-x-1/2 w-20 sm:w-24 h-4 sm:h-5 bg-neutral-900 rounded-full z-30 flex items-center justify-center gap-1.5 shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-800 border border-neutral-700/50" />
                            <div className="w-5 h-0.5 bg-neutral-800 rounded-full" />
                          </div>

                          {/* Inner glass bezel shadow highlight */}
                          <div className="absolute inset-0 border border-white/10 rounded-[2.1rem] sm:rounded-[2.5rem] pointer-events-none z-20" />

                          {/* Diagonal shining glass reflection */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none z-20" />
                          
                          {/* Ambient background card shadow */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none z-10" />

                          {/* Main Screen Content */}
                          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-neutral-950">
                            <Image
                              key={screenshotIdx}
                              src={currentScreenshot.url}
                              alt={currentScreenshot.altText || `Screenshot ${screenshotIdx + 1}`}
                              fill
                              onLoad={(e) => {
                                const isP = e.currentTarget.naturalHeight > e.currentTarget.naturalWidth;
                                setOrientations(prev => ({ ...prev, [currentScreenshot.id]: isP ? 'portrait' : 'landscape' }));
                              }}
                              className="object-contain rounded-[1.8rem] sm:rounded-[2.2rem] fade-in-scale transition-all duration-500 hover:scale-105 select-none z-0"
                              unoptimized
                            />
                          </div>
                        </div>
                      ) : (
                        /* Landscape Cinematic Layout Frame */
                        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden transition-all duration-500 ease-in-out w-full max-w-4xl aspect-[16/10] sm:aspect-[16/9]">
                          
                          {/* Diagonal shining glass reflection */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none z-20" />
                          
                          {/* Ambient shadow gradient */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-10" />

                          {/* Main Screen Content */}
                          <div className="w-full h-full relative overflow-hidden flex items-center justify-center bg-neutral-950/20">
                            <Image
                              key={screenshotIdx}
                              src={currentScreenshot.url}
                              alt={currentScreenshot.altText || `Screenshot ${screenshotIdx + 1}`}
                              fill
                              onLoad={(e) => {
                                const isP = e.currentTarget.naturalHeight > e.currentTarget.naturalWidth;
                                setOrientations(prev => ({ ...prev, [currentScreenshot.id]: isP ? 'portrait' : 'landscape' }));
                              }}
                              className="object-contain rounded-2xl fade-in-scale transition-all duration-500 hover:scale-[1.02] select-none z-0"
                              unoptimized
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Screenshot count indicator */}
                    <div className="absolute bottom-4 end-4 bg-black/75 text-white/95 border border-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md select-none z-30 shadow-lg">
                      {screenshotIdx + 1} / {app.screenshots.length}
                    </div>

                    {/* Navigation Arrows with device responsive visibility */}
                    {app.screenshots.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevScreenshot}
                          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 border border-white/10 text-white shadow-lg backdrop-blur-md opacity-90 md:opacity-0 md:group-hover/viewer:opacity-100 transition-all duration-300 cursor-pointer"
                          aria-label="Previous screenshot"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={handleNextScreenshot}
                          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/80 active:scale-95 border border-white/10 text-white shadow-lg backdrop-blur-md opacity-90 md:opacity-0 md:group-hover/viewer:opacity-100 transition-all duration-300 cursor-pointer"
                          aria-label="Next screenshot"
                        >
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail strip */}
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                    {app.screenshots.map((ss, i) => {
                      // Default to portrait style aspect ratio, detect dynamically as loaded
                      const isPort = orientations[ss.id] !== 'landscape';
                      return (
                        <button
                          key={ss.id}
                          onClick={() => setScreenshotIdx(i)}
                          className={`relative rounded-xl overflow-hidden shrink-0 transition-all duration-300 hover:scale-105 cursor-pointer ${
                            isPort ? "w-12 h-20" : "w-32 h-20"
                          } ${
                            i === screenshotIdx
                              ? "border-2 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5),_0_0_12px_rgba(139,92,246,0.5)] scale-105 opacity-100"
                              : "border-2 border-white/10 opacity-40 hover:opacity-85"
                          }`}
                        >
                          <Image
                            src={ss.url}
                            alt=""
                            width={isPort ? 64 : 160}
                            height={112}
                            onLoad={(e) => {
                              const isP = e.currentTarget.naturalHeight > e.currentTarget.naturalWidth;
                              setOrientations(prev => ({ ...prev, [ss.id]: isP ? 'portrait' : 'landscape' }));
                            }}
                            className="object-cover w-full h-full"
                            unoptimized
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Description */}
            <div className="card-flat p-5 fade-in-up" style={{ animationDelay: "100ms" }}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "hsl(var(--color-text-primary))" }}>
                📝 {t("app.description")}
              </h2>
              <div
                className={`text-sm leading-relaxed whitespace-pre-wrap ${!showFullDesc && description.length > 500 ? "line-clamp-6" : ""}`}
                style={{ color: "hsl(var(--color-text-secondary))" }}
              >
                {description}
              </div>
              {description.length > 500 && (
                <button onClick={() => setShowFullDesc(!showFullDesc)}
                  className="mt-3 text-sm font-medium" style={{ color: "hsl(var(--color-accent))" }}>
                  {showFullDesc ? "Show less" : "Read more →"}
                </button>
              )}
            </div>

            {/* Version History */}
            {app.versions.length > 0 && (
              <div className="card-flat p-5 fade-in-up" style={{ animationDelay: "200ms" }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
                  📋 {t("app.versionHistory")}
                </h2>
                <div className="space-y-2">
                  {app.versions.map((ver) => (
                    <div key={ver.id}
                      className="flex items-center gap-4 p-3 rounded-xl transition-all"
                      style={{
                        background: ver.isLatest ? "hsl(var(--color-accent-soft))" : "transparent",
                        border: ver.isLatest ? "1px solid hsl(var(--color-accent) / 0.15)" : "1px solid transparent",
                      }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: "hsl(var(--color-text-primary))" }}>
                            v{ver.versionName}
                          </span>
                          {ver.isLatest && <span className="badge badge-mod text-[9px]">LATEST</span>}
                          {ver.size && <span className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>• {ver.size}</span>}
                        </div>
                        {ver.changelog && txt(ver.changelog) && (
                          <p className="text-xs mt-1 line-clamp-2" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                            {txt(ver.changelog)}
                          </p>
                        )}
                      </div>
                      {(ver.downloadMirrors && ver.downloadMirrors.length > 0) ? (
                        <Link href={`/download/${app.slug}?mirrorId=${ver.downloadMirrors[0].id}`}
                          className="btn-primary py-2 px-3.5 text-xs shrink-0 rounded-xl">
                          ⬇️
                        </Link>
                      ) : (ver.downloadLinks && ver.downloadLinks.length > 0) ? (
                        <Link href={`/download/${app.slug}?linkId=${ver.downloadLinks[0].id}`}
                          className="btn-primary py-2 px-3.5 text-xs shrink-0 rounded-xl">
                          ⬇️
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ============ RIGHT SIDEBAR ============ */}
          <div className="space-y-6">
            {/* App Info Table */}
            <div className="card-flat p-5 fade-in-up">
              <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
                ℹ️ {t("app.appInfo")}
              </h3>
              <div className="space-y-0">
                {[
                  { label: t("app.infoTable.packageName"), value: app.packageName },
                  { label: t("app.infoTable.version"), value: latestVersion?.versionName },
                  { label: t("app.infoTable.size"), value: latestVersion?.apkSize || latestVersion?.size },
                  { label: t("app.infoTable.android"), value: (latestVersion?.androidRequirement || latestVersion?.minAndroid) && `${latestVersion.androidRequirement || latestVersion.minAndroid}+` },
                  { label: t("app.infoTable.category"), value: app.category ? txt(app.category.name) : null },
                  { label: t("app.infoTable.installs"), value: app.installs },
                  { label: t("app.infoTable.rating"), value: app.rating ? `★ ${app.rating.toFixed(1)}` : null },
                  { label: t("app.infoTable.contentRating"), value: app.contentRating },
                  { label: t("app.infoTable.developer"), value: app.developer },
                ].filter(row => row.value).map((row, i) => (
                  <div key={i} className="flex justify-between items-center py-2.5"
                    style={{ borderBottom: "1px solid hsl(var(--color-border) / 0.3)" }}>
                    <span className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>{row.label}</span>
                    <span className="text-xs font-medium text-right max-w-[55%] truncate" style={{ color: "hsl(var(--color-text-primary))" }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {app.tags.length > 0 && (
              <div className="card-flat p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: "hsl(var(--color-text-primary))" }}>🏷️ Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((t) => (
                    <span key={t.tag.slug} className="chip text-xs py-1 px-3">
                      {txt(t.tag.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Download CTA (sidebar) */}
            {primaryDownloadQuery && (
              <div className="card-flat p-5 hidden lg:block">
                <Link href={`/download/${app.slug}?${primaryDownloadQuery}`}
                  className="flex items-center justify-center gap-2 h-14 w-full rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_25px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 cursor-pointer">
                  <span className="text-xl">⬇️</span>
                  <span>{locale === "ar" ? `تحميل ${app.releaseType}` : `Download ${app.releaseType}`}</span>
                </Link>
                {app.originalPlayStoreUrl && (
                  <a href={app.originalPlayStoreUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 h-14 w-full rounded-2xl text-base font-bold text-neutral-200 bg-black/40 border border-white/10 hover:bg-neutral-900/40 hover:border-white/20 hover:scale-[1.02] active:scale-[0.97] transition-all duration-200 mt-3 cursor-pointer">
                    <span className="text-xl">▶️</span>
                    <span>{t("app.viewOnPlayStore")}</span>
                  </a>
                )}
              </div>
            )}

            {/* Premium Social Sharing card */}
            <div className="card-flat p-5">
              <h3 className="text-sm font-bold mb-4 uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                <span>📢</span>
                <span>{
                  app.releaseType === "ORIGINAL"
                    ? (locale === "ar" ? "شارك هذا التطبيق" : "Share This App")
                    : app.releaseType === "BETA"
                      ? (locale === "ar" ? "شارك النسخة التجريبية" : "Share This Beta")
                      : (locale === "ar" ? "شارك هذا المود" : "Share This MOD")
                }</span>
              </h3>
              <SocialShareRow title={txt(app.title)} />
            </div>

            {/* Related Apps */}
            {relatedApps.length > 0 && (
              <div className="card-flat p-5">
                <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
                  💡 {t("app.relatedApps")}
                </h3>
                <div className="space-y-1">
                  {relatedApps.map((ra) => (
                    <Link key={ra.id} href={`/apps/${ra.slug}`}
                      className="app-card px-2 py-2.5">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0"
                        style={{ background: "hsl(var(--color-bg-secondary))" }}>
                        {ra.iconUrl ? (
                          <Image src={ra.iconUrl} alt="" width={40} height={40} unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">📱</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1" style={{ color: "hsl(var(--color-text-primary))" }}>
                          {txt(ra.title)}
                        </p>
                        <p className="text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                          {ra.versions[0] && `v${ra.versions[0].versionName}`} • ⬇ {ra.downloadCount.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Report Issue Button */}
            <div className="card-flat p-4 text-center mt-4">
              <button
                onClick={() => setReportOpen(true)}
                className="text-xs font-semibold flex items-center justify-center gap-1.5 w-full btn-ghost py-2 rounded-xl border border-dashed transition-all hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 cursor-pointer"
                style={{ borderColor: "hsl(var(--color-border))", color: "hsl(var(--color-text-tertiary))" }}
              >
                🚩 {t("download.reportBroken")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky download bar */}
      {primaryDownloadQuery && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 p-3 fade-in-up"
          style={{ background: "hsl(var(--color-bg-primary) / 0.95)", backdropFilter: "blur(20px)", borderTop: "1px solid hsl(var(--color-border) / 0.8)" }}>
          <Link href={`/download/${app.slug}?${primaryDownloadQuery}`}
            className="flex items-center justify-center gap-2 h-14 w-full rounded-2xl text-base font-bold text-white bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.97] transition-all duration-200">
            <span className="text-xl">⬇️</span>
            <span>{locale === "ar" ? `تحميل ${app.releaseType}` : `Download ${app.releaseType}`}</span>
          </Link>
        </div>
      )}

      <div className="lg:hidden" style={{ height: primaryDownloadQuery ? 80 : 0 }} />

      <Footer />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        appId={app.id}
        appName={txt(app.title)}
      />
    </div>
  );
}
