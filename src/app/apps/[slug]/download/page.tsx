"use client";

// =============================================================================
// Download Countdown Page — Premium (Apps Slug Namespace)
// =============================================================================
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";
import { Navbar } from "@/components/layout/Navbar";
import { ReportModal } from "@/components/app/ReportModal";

function DownloadContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const linkId = searchParams.get("linkId");
  const { locale, t } = useLocale();

  const [totalCountdown, setTotalCountdown] = useState(10);
  const [countdown, setCountdown] = useState(10);
  const [ready, setReady] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // App details fetched dynamically for reporting
  const [appId, setAppId] = useState("");
  const [appName, setAppName] = useState("");

  useEffect(() => {
    // Fetch public site settings for dynamic countdown duration
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.downloadCountdown) {
          setCountdown(json.data.downloadCountdown);
          setTotalCountdown(json.data.downloadCountdown);
        }
      })
      .catch((err) => console.error("Failed to fetch settings on download mount", err));
  }, []);

  useEffect(() => {
    // Fetch basic app metadata synchronously by slug
    fetch(`/api/apps?limit=1&q=${slug}`)
      .then((r) => r.json())
      .then((json) => {
        const app = json.data?.[0];
        if (app) {
          setAppId(app.id);
          setAppName(locale === "ar" && app.title.ar ? app.title.ar : app.title.en);
        }
      })
      .catch((err) => console.error("Failed to load app metadata on download page", err));
  }, [slug, locale]);

  useEffect(() => {
    if (countdown <= 0) {
      setReady(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDownload = () => {
    if (!linkId) return;
    window.location.href = `/api/download?linkId=${linkId}`;
  };

  const progress = ((totalCountdown - countdown) / totalCountdown) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "hsl(var(--color-bg-primary))" }}>
      <Navbar />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px]"
          style={{ background: ready ? "var(--gradient-brand)" : "hsl(262 83% 58%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/3 opacity-5"
          style={{ background: "linear-gradient(to top, hsl(142 71% 45%), transparent)" }} />
      </div>

      <div className="relative w-full max-w-md fade-in-scale">
        <div className="card-glass p-8 sm:p-10 text-center" style={{ boxShadow: "var(--shadow-xl)" }}>
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
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center fade-in-scale"
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
          <h1 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
            {ready ? t("download.readyTitle") : t("download.preparingTitle")}
          </h1>
          <p className="text-sm mb-8" style={{ color: "hsl(var(--color-text-secondary))" }}>
            {ready ? t("download.readySubtitle") : t("download.preparingSubtitle")}
          </p>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={!ready}
            className={`w-full py-4 rounded-xl text-base font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${ready ? "glow-pulse" : ""}`}
            style={{ background: "var(--gradient-brand)" }}
          >
            {ready ? `⬇️ ${t("download.downloadNow")}` : `${t("download.pleaseWait")} (${countdown}s)`}
          </button>

          {/* Disclaimer */}
          <div className="mt-6 p-3.5 rounded-xl text-xs text-start leading-relaxed"
            style={{ background: "hsl(38 92% 50% / 0.06)", color: "hsl(38 92% 50%)", border: "1px solid hsl(38 92% 50% / 0.1)" }}>
            ⚠️ {t("download.disclaimer")}
          </div>

          {/* Back & Report buttons */}
          <div className="mt-5 flex justify-between items-center text-xs">
            <Link href="/" className="font-medium transition-all"
              style={{ color: "hsl(var(--color-text-tertiary))" }}>
              ← {t("common.backToHome")}
            </Link>
            {appId && (
              <button
                onClick={() => setReportOpen(true)}
                className="font-medium transition-all hover:text-red-400 flex items-center gap-1"
                style={{ color: "hsl(var(--color-text-tertiary))" }}
              >
                🚩 {t("download.reportBroken")}
              </button>
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
        <div className="skeleton w-96 h-96 rounded-2xl" />
      </div>
    }>
      <DownloadContent slug={slug} />
    </Suspense>
  );
}
