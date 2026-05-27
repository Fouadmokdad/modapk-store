"use client";

// =============================================================================
// Download Countdown Page — Premium
// =============================================================================
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { ReportModal } from "@/components/app/ReportModal";

/**
 * Premium Adsense-ready Ad Slot Component
 */
function AdSlot({ code, label }: { code?: string; label: string }) {
  const hasContent = code && code.trim() && !code.trim().startsWith("<!--") && !code.trim().endsWith("-->");
  
  return (
    <div className="w-full my-4 rounded-xl border p-4 text-center select-none transition-all card-glass"
      style={{ borderColor: "hsl(var(--color-border) / 0.8)", background: "hsl(var(--color-bg-secondary) / 0.3)" }}>
      <div className="text-[9px] font-bold tracking-widest text-gradient uppercase mb-2">
        ✨ ADVERTISEMENT — {label} ✨
      </div>
      {hasContent ? (
        <div dangerouslySetInnerHTML={{ __html: code }} className="mx-auto flex justify-center items-center" />
      ) : (
        <div className="py-6 flex flex-col items-center justify-center border border-dashed rounded-lg border-emerald-500/20 animate-pulse"
          style={{ background: "linear-gradient(135deg, hsl(142 71% 45% / 0.02), hsl(262 83% 58% / 0.02))" }}>
          <span className="text-xs font-semibold text-emerald-400/80 mb-1">Premium Ad Spot</span>
          <span className="text-[10px] text-emerald-500/50">Responsive Banner Auto-Optimized</span>
        </div>
      )}
    </div>
  );
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
      color: "bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20",
    },
    {
      name: "X",
      icon: "🐦",
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
      color: "bg-neutral-800/30 hover:bg-neutral-800/50 text-neutral-300 border border-neutral-700/30",
    },
    {
      name: "WhatsApp",
      icon: "🟢",
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " - " + currentUrl)}`,
      color: "bg-green-600/10 hover:bg-green-600/20 text-green-400 border border-green-600/20",
    },
    {
      name: "Telegram",
      icon: "✈️",
      url: `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`,
      color: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20",
    },
  ];

  return (
    <div className="mt-8 pt-6 border-t border-dashed" style={{ borderColor: "hsl(var(--color-border))" }}>
      <div className="text-[10px] font-bold text-start mb-3 uppercase tracking-wider text-emerald-400">
        📢 Share with Friends
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {shares.map((sh) => (
          <a
            key={sh.name}
            href={sh.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sh.color}`}
          >
            <span>{sh.icon}</span>
            <span>{sh.name}</span>
          </a>
        ))}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 sm:ml-auto"
        >
          <span>🔗</span>
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </button>
      </div>
    </div>
  );
}

function DownloadContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const initialLinkId = searchParams.get("linkId");
  const { locale, t } = useLocale();

  const [totalCountdown, setTotalCountdown] = useState(5);
  const [countdown, setCountdown] = useState(5);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isHuman, setIsHuman] = useState(false);

  // App details and mirrors
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");
  const [app, setApp] = useState<any>(null);
  const [availableLinks, setAvailableLinks] = useState<any[]>([]);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [adsSettings, setAdsSettings] = useState<{ beforeCountdown?: string; afterCountdown?: string; sidebar?: string } | null>(null);
  const [relatedApps, setRelatedApps] = useState<any[]>([]);

  useEffect(() => {
    // Fetch public site settings for dynamic countdown duration and ads settings
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const count = json.data.downloadCountdown || 5;
          setCountdown(count);
          setTotalCountdown(count);
          if (json.data.adsSettings) {
            setAdsSettings(json.data.adsSettings);
          }
        }
      })
      .catch((err) => console.error("Failed to fetch settings on download mount", err))
      .finally(() => {
        setCountdownStarted(true);
      });
  }, []);

  useEffect(() => {
    // Fetch full app details by slug / id
    fetch(`/api/apps/${slug}`)
      .then((r) => r.json())
      .then((json) => {
        const appData = json.data;
        if (appData) {
          setApp(appData);
          setAppId(appData.id);
          setAppName(locale === "ar" && appData.title.ar ? appData.title.ar : appData.title.en);
          
          // Get links/mirrors from latest version
          const latestVersion = appData.versions?.[0];
          if (latestVersion) {
            const mirrors = latestVersion.downloadMirrors || [];
            const links = latestVersion.downloadLinks || [];

            const unified: any[] = [];

            // Add mirrors first, sorted by priority (desc)
            mirrors.forEach((m: any) => {
              unified.push({
                id: m.id,
                label: m.hostName || m.host || "Mirror",
                url: m.downloadUrl || m.url || "",
                isMirror: true,
                health: m.healthStatus || m.health || "HEALTHY",
                priority: m.priority || 0,
              });
            });

            // Fallback to legacy links if no mirrors are set up
            if (unified.length === 0) {
              links.forEach((l: any) => {
                unified.push({
                  id: l.id,
                  label: l.label,
                  url: l.url,
                  isMirror: false,
                  health: "HEALTHY",
                  priority: l.sortOrder || 0,
                });
              });
            }

            // Sort by priority desc
            unified.sort((a, b) => b.priority - a.priority);

            setAvailableLinks(unified);
            
            // Set initial selected link based on query param or default to first
            const matched = unified.find((u) => u.id === initialLinkId) || unified[0];
            setSelectedLink(matched);
          }
        }
      })
      .catch((err) => console.error("Failed to load app details on download page", err));
  }, [slug, locale, initialLinkId]);

  useEffect(() => {
    if (app && app.categoryId) {
      fetch(`/api/apps?categoryId=${app.categoryId}&limit=5`)
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setRelatedApps(json.data.filter((item: any) => item.id !== app.id).slice(0, 4));
          }
        })
        .catch((err) => console.error("Failed to load related apps on download page", err));
    }
  }, [app]);

  useEffect(() => {
    if (!countdownStarted) return;
    if (countdown <= 0) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, countdownStarted]);

  const hasValidMirror = !!(selectedLink && selectedLink.url);
  const canDownload = ready && isHuman && hasValidMirror && selectedLink.health !== "DEAD" && selectedLink.health !== "REMOVED";

  const handleDownload = async (linkToUse = selectedLink) => {
    const linkHasValidMirror = !!(linkToUse && linkToUse.url);
    const linkCanDownload = ready && isHuman && linkHasValidMirror && linkToUse.health !== "DEAD" && linkToUse.health !== "REMOVED";
    if (!linkCanDownload || downloading) return;

    setDownloading(true);
    try {
      const tokenBody = linkToUse.isMirror 
        ? { mirrorId: linkToUse.id } 
        : { linkId: linkToUse.id };

      const res = await fetch("/api/download/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenBody),
      });
      const data = await res.json();
      if (data.token) {
        const queryParam = linkToUse.isMirror
          ? `mirrorId=${linkToUse.id}`
          : `linkId=${linkToUse.id}`;
        window.location.href = `/api/download?${queryParam}&token=${encodeURIComponent(data.token)}`;
      } else {
        alert(data.error || "Failed to generate security token. Enforce page reload.");
      }
    } catch (err) {
      console.error("Token generation error:", err);
      alert("Network security error. Please reload page and retry download.");
    } finally {
      setDownloading(false);
    }
  };

  const getMirrorHealth = (link: any) => {
    return link.health || "HEALTHY";
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "HEALTHY":
        return { text: locale === "ar" ? "نشط وآمن" : "Verified Online", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "SLOW":
        return { text: locale === "ar" ? "استجابة بطيئة" : "Slow Response", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      case "DEAD":
      case "REDIRECT_BROKEN":
        return { text: locale === "ar" ? "معطل / غير متاح" : "Offline / Broken", className: "bg-red-500/10 text-red-400 border border-red-500/20" };
      case "REMOVED":
        return { text: locale === "ar" ? "محذوف من الخادم" : "File Removed", className: "bg-neutral-500/20 text-neutral-400 border border-neutral-500/30" };
      default:
        return { text: locale === "ar" ? "غير معروف" : "Unknown", className: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20" };
    }
  };

  const selectedHealth = selectedLink ? getMirrorHealth(selectedLink) : "HEALTHY";
  const selectedBadge = getHealthBadge(selectedHealth);

  const progress = ((totalCountdown - countdown) / totalCountdown) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative"
      style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{ background: ready ? "var(--gradient-brand)" : "hsl(262 83% 58%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-5"
          style={{ background: "linear-gradient(to top, hsl(142 71% 45%), transparent)" }} />
      </div>

      <div className="relative w-full max-w-4xl fade-in-scale z-10 my-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main download cards & ads column */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Before Countdown Ad slot */}
            <AdSlot code={adsSettings?.beforeCountdown} label="Above Countdown" />

            {/* Core Countdown Card */}
            <div className="card-glass p-8 sm:p-10 text-center" style={{ boxShadow: "var(--shadow-xl)" }}>
              
              {/* Mirror Selection UI */}
              {availableLinks.length > 1 && (
                <div className="mb-6 text-start p-4 rounded-xl border bg-neutral-900/40 border-neutral-800">
                  <label className="block text-xs font-bold text-neutral-400 mb-2 uppercase tracking-wider">
                    {locale === "ar" ? "اختر خادم التحميل (المرآة):" : "Choose Download Mirror Host:"}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableLinks.map((link) => {
                      const health = getMirrorHealth(link);
                      const isSelected = selectedLink?.id === link.id;
                      const badge = getHealthBadge(health);
                      
                      return (
                        <button
                          key={link.id}
                          type="button"
                          onClick={() => setSelectedLink(link)}
                          className={`p-3 rounded-lg text-start flex items-center justify-between transition-all border text-xs cursor-pointer ${
                            isSelected 
                              ? "border-emerald-500/50 bg-emerald-500/5 text-emerald-400" 
                              : "border-neutral-800 bg-neutral-900/20 text-neutral-300 hover:border-neutral-700"
                          }`}
                        >
                          <div className="font-semibold truncate pr-2">
                            🚀 {link.label}
                          </div>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${badge.className}`}>
                            {badge.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Single Mirror Indicator */}
              {availableLinks.length === 1 && selectedLink && (
                <div className="mb-6 text-start p-4 rounded-xl border bg-neutral-900/40 border-neutral-800 text-xs flex justify-between items-center">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider">
                    {locale === "ar" ? "خادم التحميل:" : "Download Host:"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-400">🚀 {selectedLink.label}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase ${getHealthBadge(selectedLink.health).className}`}>
                      {getHealthBadge(selectedLink.health).text}
                    </span>
                  </div>
                </div>
              )}

              {/* Animated ring */}
              <div className="relative w-28 h-28 mx-auto mb-8">
                {/* Background ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke="hsl(var(--color-border))" strokeWidth="6" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke="url(#gradient)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress / 100)}`}
                    style={{ transition: "stroke-dashoffset 1s linear" }} />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="hsl(142 71% 45%)" />
                      <stop offset="100%" stopColor="hsl(262 83% 58%)" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {ready ? (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center fade-in-scale animate-bounce"
                      style={{ background: "var(--gradient-brand)" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-gradient">{countdown}</span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
                {ready ? t("download.readyTitle") : t("download.preparingTitle")}
              </h1>
              <p className="text-sm mb-6" style={{ color: "hsl(var(--color-text-secondary))" }}>
                {ready ? `${t("download.readySubtitle")} for ${appName || "your file"}` : `${t("download.preparingSubtitle")} for ${appName || "your file"}`}
              </p>

              {/* Warning Notice for Selected Mirror */}
              {selectedLink && selectedHealth !== "HEALTHY" && (
                <div className="mb-6 p-4 rounded-xl text-xs text-start border flex items-start gap-2.5 bg-red-500/5 border-red-500/20 text-red-300">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-bold uppercase tracking-wider">{locale === "ar" ? "تحذير الخادم:" : "Server Warning Status:"} {selectedBadge.text}</p>
                    <p className="opacity-90 mt-0.5">
                      {selectedHealth === "SLOW" 
                        ? (locale === "ar" ? "هذا الخادم يعاني حالياً من بطء في التحميل. يوصى باختيار مرآة أخرى إن وجدت لتفادي الانتظار الطويل." : "This download host is experiencing performance lag. Try selecting another mirror to save time.") 
                        : (locale === "ar" ? "الملف قد يكون معطلاً أو تم حذفه من قبل المستضيف. يرجى اختيار خادم بديل أو الإبلاغ عن الرابط المعطل." : "The selected host might have deleted or locked this APK. Choose a fallback mirror above or report link.")}
                    </p>
                  </div>
                </div>
              )}

              {/* No Mirror Error */}
              {app && availableLinks.length === 0 && (
                <div className="mb-6 p-4 rounded-xl text-xs text-start border flex items-start gap-2.5 bg-red-500/5 border-red-500/20 text-red-400">
                  <span className="text-lg">⚠️</span>
                  <div>
                    <p className="font-bold uppercase tracking-wider">
                      {locale === "ar" ? "خطأ: روابط غير متوفرة" : "ERROR: NO DOWNLOAD MIRRORS"}
                    </p>
                    <p className="opacity-90 mt-0.5">
                      {locale === "ar"
                        ? "لم يتم العثور على أي روابط تحميل أو مرايا نشطة لهذا التطبيق. يرجى إبلاغ الإدارة باستخدام زر الإبلاغ أدناه."
                        : "No active download mirrors or links were found for this app version. Please report this issue using the button below so we can fix it."}
                    </p>
                  </div>
                </div>
              )}

              {/* Anti-bot human validation check */}
              {ready && availableLinks.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border bg-neutral-900/40 border-neutral-800 flex items-center justify-center gap-3 text-xs">
                  <input
                    type="checkbox"
                    id="anti-bot-check"
                    checked={isHuman}
                    onChange={(e) => setIsHuman(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="anti-bot-check" className="text-neutral-300 font-semibold cursor-pointer select-none">
                    {locale === "ar" ? "أنا لست برنامج روبوت (اضغط للتحقق)" : "I am not a robot (Click to verify)"}
                  </label>
                </div>
              )}

              {/* Download button */}
              <button
                onClick={() => handleDownload()}
                disabled={!canDownload || downloading}
                className={`w-full py-4 rounded-xl text-base font-bold text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${canDownload ? "glow-pulse transform hover:scale-[1.02] active:scale-[0.98]" : ""}`}
                style={{ background: "var(--gradient-brand)" }}
              >
                {downloading 
                  ? "🔒 Securing Download..." 
                  : (!ready || countdown > 0)
                    ? `${t("download.pleaseWait")} (${countdown}s)` 
                    : !isHuman 
                      ? (locale === "ar" ? "يرجى التحقق من الهوية أولاً" : "Please Verify You Are Human")
                      : !hasValidMirror 
                        ? (locale === "ar" ? "لا توجد خوادم متاحة" : "No Host Available")
                        : `⬇️ ${t("download.downloadNow")}`}
              </button>

              {/* Disclaimer */}
              <div className="mt-6 p-3.5 rounded-xl text-xs text-start leading-relaxed"
                style={{ background: "hsl(38 92% 50% / 0.06)", color: "hsl(38 92% 50%)", border: "1px solid hsl(38 92% 50% / 0.1)" }}>
                ⚠️ {t("download.disclaimer")}
              </div>

              {/* Back & Report buttons */}
              <div className="mt-6 flex justify-between items-center text-xs">
                <Link href="/" className="font-semibold transition-all hover:text-white"
                  style={{ color: "hsl(var(--color-text-tertiary))" }}>
                  ← {t("common.backToHome")}
                </Link>
                {appId && (
                  <button
                    onClick={() => setReportOpen(true)}
                    className="font-semibold transition-all hover:text-red-400 flex items-center gap-1"
                    style={{ color: "hsl(var(--color-text-tertiary))" }}
                  >
                    🚩 {t("download.reportBroken")}
                  </button>
                )}
              </div>

              {/* Share links */}
              <SocialShareRow title={appName || "Download Premium MOD APK Store"} />
            </div>

            {/* After Countdown Ad slot */}
            <AdSlot code={adsSettings?.afterCountdown} label="Below Countdown" />

          </div>

          {/* Sidebar Ads column */}
          <div className="lg:col-span-4 space-y-4">
            <AdSlot code={adsSettings?.sidebar} label="Sidebar / Mobile Banner" />
            
            {/* Related Apps */}
            {relatedApps.length > 0 && (
              <div className="card-glass p-5">
                <h3 className="text-sm font-semibold mb-4 text-start" style={{ color: "hsl(var(--color-text-primary))" }}>
                  💡 {locale === "ar" ? "تطبيقات ذات صلة" : "Related Apps"}
                </h3>
                <div className="space-y-1">
                  {relatedApps.map((ra) => {
                    const raTitle = locale === "ar" && ra.title.ar ? ra.title.ar : ra.title.en;
                    return (
                      <Link key={ra.id} href={`/apps/${ra.slug}`}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800/40 transition-colors">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 relative bg-neutral-900 border border-neutral-800">
                          {ra.iconUrl ? (
                            <Image src={ra.iconUrl} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">📱</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-start">
                          <p className="text-xs font-semibold truncate" style={{ color: "hsl(var(--color-text-primary))" }}>
                            {raTitle}
                          </p>
                          <p className="text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                            {ra.versions?.[0]?.versionName ? `v${ra.versions[0].versionName}` : "Premium"} • ⬇ {ra.downloadCount.toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {appId && (
        <ReportModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          appId={appId}
          appName={appName}
        />
      )}
    </div>
  );
}

export default function DownloadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--color-bg-primary))" }}>
        <div className="skeleton w-96 h-96 rounded-2xl animate-pulse" />
      </div>
    }>
      <DownloadContent slug={slug} />
    </Suspense>
  );
}
