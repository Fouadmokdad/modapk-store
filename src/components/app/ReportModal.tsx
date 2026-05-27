"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from "@/hooks/useLocale";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
  appName: string;
}

export function ReportModal({ isOpen, onClose, appId, appName }: ReportModalProps) {
  const { locale, t } = useLocale();

  const [type, setType] = useState<"BROKEN_LINK" | "COPYRIGHT">("BROKEN_LINK");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.length < 10) {
      setError(locale === "ar" ? "يجب أن تكون الرسالة 10 أحرف على الأقل." : "Message must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId,
          type,
          reporterName: reporterName || undefined,
          reporterEmail: reporterEmail || undefined,
          message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to submit report");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReporterName("");
        setReporterEmail("");
        setMessage("");
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isRtl = locale === "ar";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border bg-card p-6 shadow-2xl transition-all zoom-in"
        style={{
          background: "hsl(var(--color-bg-card))",
          borderColor: "hsl(var(--color-border))",
          direction: isRtl ? "rtl" : "ltr",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-ghost p-2 rounded-xl text-lg hover:bg-white/5"
          style={{ float: isRtl ? "left" : "right" }}
          aria-label="Close dialog"
        >
          ✕
        </button>

        <h2
          id="report-modal-title"
          className="text-xl font-bold mb-1"
          style={{ color: "hsl(var(--color-text-primary))" }}
        >
          📢 {t("report.brokenLink")}
        </h2>
        <p className="text-xs mb-6" style={{ color: "hsl(var(--color-text-tertiary))" }}>
          {locale === "ar" ? `الإبلاغ عن مشكلة في تطبيق ${appName}` : `Report an issue with ${appName}`}
        </p>

        {success ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-base font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
              {t("report.thankYou")}
            </h3>
            <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
              {locale === "ar" ? "سنقوم بمراجعة البلاغ وتحديثه قريباً." : "We will review your submission and address it shortly."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="p-3 rounded-xl text-xs font-semibold"
                style={{
                  background: "hsl(0 84% 60% / 0.1)",
                  color: "hsl(0 84% 60%)",
                  border: "1px solid hsl(0 84% 60% / 0.2)",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Report Type */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                {t("report.selectType")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType("BROKEN_LINK")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    type === "BROKEN_LINK" ? "btn-primary border-transparent" : "btn-ghost"
                  }`}
                  style={{
                    background: type === "BROKEN_LINK" ? "var(--gradient-brand)" : "transparent",
                    color: type === "BROKEN_LINK" ? "white" : "hsl(var(--color-text-secondary))",
                    borderColor: type === "BROKEN_LINK" ? "transparent" : "hsl(var(--color-border))",
                  }}
                >
                  🔗 {locale === "ar" ? "رابط معطل" : "Broken Link"}
                </button>
                <button
                  type="button"
                  onClick={() => setType("COPYRIGHT")}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    type === "COPYRIGHT" ? "btn-primary border-transparent" : "btn-ghost"
                  }`}
                  style={{
                    background: type === "COPYRIGHT" ? "var(--gradient-brand)" : "transparent",
                    color: type === "COPYRIGHT" ? "white" : "hsl(var(--color-text-secondary))",
                    borderColor: type === "COPYRIGHT" ? "transparent" : "hsl(var(--color-border))",
                  }}
                >
                  🛡️ {locale === "ar" ? "حقوق نشر DMCA" : "Copyright / DMCA"}
                </button>
              </div>
            </div>

            {/* Reporter Name */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                {t("report.yourName")}
              </label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="input py-2 px-3 text-xs rounded-xl"
                placeholder={locale === "ar" ? "مثال: أحمد علي" : "e.g. John Doe"}
              />
            </div>

            {/* Reporter Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                {t("report.yourEmail")}
              </label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                className="input py-2 px-3 text-xs rounded-xl"
                placeholder={locale === "ar" ? "john@example.com" : "john@example.com"}
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                {t("report.message")} *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                className="input py-2 px-3 text-xs rounded-xl h-24 resize-none"
                placeholder={
                  type === "BROKEN_LINK"
                    ? locale === "ar" ? "يرجى كتابة تفاصيل حول الرابط المعطل (مثال: تحميل لا يعمل)..." : "Details about the broken link..."
                    : locale === "ar" ? "يرجى تقديم تفاصيل حقوق النشر والروابط المتأثرة..." : "Provide copyright proof or infringement links..."
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="btn-secondary flex-1 py-3 text-xs rounded-xl font-bold"
              >
                {t("common.cancel")}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1 py-3 text-xs rounded-xl font-bold text-white glow-pulse"
                style={{ background: "var(--gradient-brand)" }}
              >
                {submitting ? t("common.loading") : t("report.submitReport")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
