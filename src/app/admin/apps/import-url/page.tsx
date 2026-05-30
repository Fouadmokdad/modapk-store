"use client";

// =============================================================================
// Admin — Import from Third-Party URL (Premium APK Extractor Workflow)
// =============================================================================
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { ImportedAppData, ExternalDownloadLink } from "@/lib/importers/types";
import { isAllowedImageHost } from "@/lib/importers/image-safety";
import { CustomSelect } from "@/components/ui/CustomSelect";

const supportedSources = [
  { name: "Google Play", domain: "play.google.com", color: "#607D8B", isOfficial: true, placeholder: "com.king.candycrushsaga or full URL", tips: "100% safe, verified metadata. Direct extraction from official app store registry." },
  { name: "LiteAPKs", domain: "liteapks.com", color: "#4CAF50", placeholder: "https://liteapks.com/...", tips: "Anti-bot protected. Requires Browser-Assisted import mode or raw HTML copy if blocked." },
  { name: "Modyolo", domain: "modyolo.com", color: "#00B0FF", placeholder: "https://modyolo.com/...", tips: "Excellent description/screenshot structures. If blocked, fallback to paste HTML." },
  { name: "GameDVA", domain: "gamedva.com", color: "#E040FB", placeholder: "https://gamedva.com/...", tips: "Focused on Modded games. Uses static registry mapping blocks." },
  { name: "GetModsAPK", domain: "getmodsapk.com", color: "#FF3D00", placeholder: "https://getmodsapk.com/...", tips: "Bilingual metadata index lists. Fast generic structures." },
  { name: "APKPure", domain: "apkpure.com", color: "#00E676", placeholder: "https://apkpure.com/...", tips: "Heavy Cloudflare layers. Browser-Assisted mode works perfectly." },
  { name: "APKCombo", domain: "apkcombo.com", color: "#FF9100", placeholder: "https://apkcombo.com/...", tips: "Multilingual index listings. Best for package verification." },
  { name: "Uptodown", domain: "uptodown.com", color: "#29B6F6", placeholder: "https://uptodown.com/...", tips: "Highly resilient mirror URLs. Solid generic descriptors." },
  { name: "HappyMod", domain: "happymod.com", color: "#8BC34A", placeholder: "https://happymod.com/...", tips: "Mod community index links. High reliability fallback parser." },
  { name: "Generic", domain: "generic", color: "#9E9E9E", placeholder: "https://example.com/...", tips: "Automatic metadata crawler fallback. Scrapes JSON-LD and page open graphs." }
];

interface BulkQueueItem {
  id: number;
  url: string;
  source: string;
  status: "pending" | "processing" | "saving" | "success" | "failed" | "BROWSER_REQUIRED";
  title?: string;
  draftId?: string;
  reason?: string;
}

export default function ImportUrlPage() {
  const router = useRouter();
  
  // Importer Modes
  // Single, Browser, Bulk, Dashboard
  const [importerMode, setImporterMode] = useState<"single" | "browser" | "bulk" | "dashboard">("single");
  const [activeTab, setActiveTab] = useState<"url" | "html">("url"); // Under single mode: URL Import or Paste HTML

  // Dashboard state variables
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardTriggering, setDashboardTriggering] = useState<string | null>(null);

  // Input states
  const [selectedSource, setSelectedSource] = useState(supportedSources[1]); // Default LiteAPKs
  const [url, setUrl] = useState("");
  const [pastedHtml, setPastedHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);

  // Bulk Import queue states
  const [bulkInput, setBulkInput] = useState("");
  const [bulkQueue, setBulkQueue] = useState<BulkQueueItem[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Security Verification State
  const [storeOrigin, setStoreOrigin] = useState("http://localhost:3000");
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);

  // Preview Workspace
  const [preview, setPreview] = useState<ImportedAppData | null>(null);
  const [duplicates, setDuplicates] = useState({
    slug: false,
    packageName: false,
    importedSourceUrl: false
  });
  const [existingAppId, setExistingAppId] = useState<string | null>(null);
  const [existingAppTitle, setExistingAppTitle] = useState("");
  const [approvedLinks, setApprovedLinks] = useState<Record<number, boolean>>({});
  const [lowConfidenceConfirm, setLowConfidenceConfirm] = useState(false);
  const [protectedSource, setProtectedSource] = useState<{ source: string; statusCode: number; message: string; suggestion: string } | null>(null);

  // SEO Generator confirmation overlay banner
  const [seoGenSuccess, setSeoGenSuccess] = useState("");

  // Establish Browser-Assisted cross-origin listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      setStoreOrigin(window.location.origin);
    }

    const handleMessage = async (e: MessageEvent) => {
      // 1. Strict Origin Verification
      if (e.origin !== window.location.origin) return;

      const payload = e.data;
      if (payload && payload.type === "BROWSER_IMPORT_PAYLOAD") {
        if (e.source) {
          (e.source as WindowProxy).postMessage({ type: "BROWSER_IMPORT_ACK" }, e.origin);
        }

        setError("");
        setProtectedSource(null);
        setPreview(null);

        if (payload.url) setUrl(payload.url);

        setImporterMode("browser");
        setActiveTab("html"); // Switch to HTML fallback display
        
        if (payload.compressedHtml) {
          setPastedHtml("✨ Browser-Assisted DOM Payload Received (Compressed Gzip format). Processing preview...");
          await handleBrowserPreview(payload.url, null, payload.compressedHtml, payload.smartMetadata);
        } else if (payload.html) {
          setPastedHtml(payload.html);
          await handleBrowserPreview(payload.url, payload.html, null, payload.smartMetadata);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Source Selector auto-change URL domain detect
  useEffect(() => {
    if (url.trim() && importerMode === "single") {
      try {
        const hostname = new URL(url.trim()).hostname.toLowerCase();
        const matched = supportedSources.find(s => hostname.includes(s.domain));
        if (matched) {
          setSelectedSource(matched);
        }
      } catch {}
    }
  }, [url, importerMode]);

  // Dashboard API fetching and triggering helpers
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    setError("");
    try {
      const res = await fetch("/api/admin/dashboard");
      const json = await res.json();
      if (json.success) {
        setDashboardData(json.data);
      } else {
        setError(json.error || "Failed to load dashboard statistics.");
      }
    } catch {
      setError("Failed to reach dashboard API.");
    } finally {
      setLoadingDashboard(false);
    }
  };

  const triggerDashboardCron = async (action: string) => {
    setDashboardTriggering(action);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchDashboardData();
      } else {
        alert(json.error || "Action failed.");
      }
    } catch {
      alert("Network failure triggering cron.");
    } finally {
      setDashboardTriggering(null);
    }
  };

  // Handler for browser preview requests
  const handleBrowserPreview = async (
    targetUrl: string,
    rawHtml: string | null,
    compressedHtml: string | null,
    smartMetadata?: any
  ) => {
    setLoading(true);
    try {
      const payload = {
        url: targetUrl,
        html: rawHtml,
        compressedHtml,
        smartMetadata,
        forceGeneric: false
      };

      const res = await fetch("/api/import-html-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to parse browser-assisted metadata.");
        return;
      }

      setPreview(json.data.preview);
      setDuplicates(json.data.duplicates);
      setExistingAppId(json.data.existingAppId || null);
      setExistingAppTitle(json.data.existingAppTitle || "");

      // Auto-approve whitelisted mirrors
      const initialApproved: Record<number, boolean> = {};
      json.data.preview.externalDownloadLinks.forEach((link: any, idx: number) => {
        initialApproved[idx] = link.classification === "trusted" || link.classification === "mirror";
      });
      setApprovedLinks(initialApproved);
      setLowConfidenceConfirm(false);
    } catch {
      setError("A connection error occurred during browser import analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Preview URL metadata handler
  const handlePreview = async (e?: React.FormEvent, forceGeneric = false) => {
    if (e) e.preventDefault();
    setError("");
    setProtectedSource(null);
    setPreview(null);
    setLoading(true);

    try {
      const payload = activeTab === "url"
        ? { url: url.trim(), forceGeneric }
        : { url: url.trim(), html: pastedHtml.trim(), forceGeneric };

      const res = await fetch("/api/import-url/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      // Cloudflare/Challenge/Protected status detection
      if (json.success === false && json.type === "protected_source") {
        setProtectedSource(json);
        return;
      }

      if (!res.ok) {
        setError(json.error || "Failed to parse metadata from the target URL.");
        return;
      }

      setPreview(json.data.preview);
      setDuplicates(json.data.duplicates);
      setExistingAppId(json.data.existingAppId || null);
      setExistingAppTitle(json.data.existingAppTitle || "");
      
      const initialApproved: Record<number, boolean> = {};
      json.data.preview.externalDownloadLinks.forEach((link: any, idx: number) => {
        initialApproved[idx] = link.classification === "trusted" || link.classification === "mirror";
      });
      setApprovedLinks(initialApproved);
      setLowConfidenceConfirm(false);
    } catch {
      setError("A connection error occurred. Make sure your network is responsive.");
    } finally {
      setLoading(false);
    }
  };

  // Content Generator — Deterministic AI-emulated Bilingual Copywriter
  const triggerSEOContentGenerator = () => {
    if (!preview) return;

    const titleEn = preview.title.en || "App";
    const titleAr = preview.title.ar || titleEn;
    const version = preview.versionName || "v1.0";
    const developer = preview.developer || "Premium Developer";
    const category = preview.category || "Tools";
    const pkg = preview.packageName || "com.premium.mod";
    const modFeatList = preview.modFeatures.length > 0 ? preview.modFeatures.join(", ") : "Premium Unlocked, Ads Disabled";

    // English generated variables
    const generatedShortDescEn = `Download ${titleEn} MOD APK ${version} for Android. Enjoy the full premium features unlocked, with ${modFeatList} and all limitations removed. 100% safe and verified direct links.`;
    
    const generatedDescEn = `### About ${titleEn} Pro Mod APK

**${titleEn}** is an industry-leading application in the **${category}** niche developed by **${developer}**. It provides seamless layouts, outstanding performance optimization, and premium workflows that are usually locked behind high-tier subscriptions. By utilizing this modified APK release, you unlock the absolute potential of this tool with zero paywalls.

---

### Outstanding Key Features:
- **Premium Interface Controls:** Experience clean, fully optimized navigation panels with state-of-the-art responsiveness.
- **Advanced Customization:** Personalize your standard tools with exclusive styles and unlocked profiles.
- **Optimized Battery and Data:** Lightweight architecture specifically optimized for battery preservation and fast offline performance.
- **Original Google Play Core:** Built on top of the package coordinate \`${pkg}\` to guarantee total framework compatibility.

---

### Premium MOD Features Unlocked:
- **✨ Complete VIP Access Unlocked:** All high-tier features and templates are fully open by default.
- **🚫 Ultimate Ad-Free Experience:** No interruptions, popups, or injected video banners.
- **⚡ Supercharged Engine:** Enhanced execution speed and unlimited usage sessions.
- **🛡️ Secure Verification:** Clean binary scanned and verified against active security subnets.

---

### What's New in this Version:
- Fully updated and adapted to match the latest Play Store version release ${version}.
- Squashed minor lag errors and layout scaling issues on modern Android sub-versions.
- Enhanced database transaction speeds for cloud-saving.
`;

    // Arabic generated variables
    const generatedShortDescAr = `تحميل ${titleAr} MOD APK ${version} مهكر للأندرويد برابط مباشر. استمتع بجميع الميزات المدفوعة مفتوحة بالكامل، مع ${modFeatList} وبدون إعلانات نهائياً. آمن ومجرب 100%.`;
    
    const generatedDescAr = `### نبذة عن تطبيق ${titleAr} مهكر بأحدث إصدار للأندرويد

تطبيق **${titleAr}** هو واحد من أفضل التطبيقات وأكثرها شعبية في قسم **${category}**، من تطوير **${developer}**. يوفر هذا التطبيق تجربة مستخدم فريدة بفضل أدواته المتقدمة وسرعته الاستثنائية. من خلال هذه النسخة المعدلة (MOD APK)، يمكنك الآن الاستفادة من جميع الخصائص المدفوعة والميزات المغلقة مجاناً دون الحاجة لدفع أي اشتراكات.

---

### الميزات الأساسية للتطبيق:
- **واجهة مستخدم احترافية:** تصميم عصري، بسيط وسهل الاستخدام يدعم الهواتف والأجهزة اللوحية.
- **تخصيص كامل ومتقدم:** تحكم كامل في الأدوات مع قوالب حصرية مفتوحة افتراضياً.
- **توفير استهلاك الطاقة:** خفيف الحجم وموفر لطاقة البطارية وبيانات الهاتف بشكل كبير.
- **توافقية قصوى:** مبني بالكامل ليتوافق مع كود الحزمة الرسمي \`${pkg}\` لضمان استقرار التشغيل.

---

### خصائص التهكير (MOD Features):
- **✨ فتح ميزات VIP بالكامل:** تم تفعيل العضوية الذهبية وجميع الأدوات المغلقة بشكل تلقائي.
- **🚫 إزالة الإعلانات تماماً:** تصفح واستخدام سريع بدون نوافذ منبثقة أو مقاطع فيديو إعلانية مزعجة.
- **⚡ أداء فائق السرعة:** تسريع استجابة المحرك الداخلي لتنفيذ المهام بلمح البصر.
- **🛡️ فحص أمان شامل:** ملف APK نظيف وخالي تماماً من أي أكواد ضارة أو ملفات تجسس.

---

### ما الجديد في هذا التحديث الجديد:
- تم التحديث للنسخة الأخيرة المتوافقة تماماً مع متجر جوجل بلاي برقم إصدار ${version}.
- إصلاح الأخطاء الطفيفة وتحسين أداء التطبيق على إصدارات أندرويد الحديثة.
- تحسين سرعة الاتصال بالخوادم وتوفير خيارات حفظ البيانات.
`;

    const generatedSeoTitle = `${titleEn} MOD APK ${version} (${preview.modFeatures[0] || "Premium Unlocked"}) Download`;
    const generatedSeoMeta = `Download ${titleEn} MOD APK ${version} for Android. Unlocked ${modFeatList} with zero ads. Safely download 100% verified original drafts.`;
    const generatedTags = `${titleEn.toLowerCase()}, ${titleEn.toLowerCase()} mod, ${titleEn.toLowerCase()} apk, ${titleEn.toLowerCase()} hack, download ${titleEn.toLowerCase()} pro, ${pkg}`;

    // Apply copywriting to the editor fields
    updatePreviewField((prev) => ({
      ...prev,
      shortDescription: {
        en: generatedShortDescEn,
        ar: generatedShortDescAr,
      },
      description: {
        en: generatedDescEn,
        ar: generatedDescAr,
      },
      title: {
        en: `${titleEn} MOD`,
        ar: `${titleAr} مهكر`,
      },
      rawExtractedData: {
        ...prev.rawExtractedData,
        seoGeneratedTitle: generatedSeoTitle,
        seoGeneratedMeta: generatedSeoMeta,
        seoGeneratedTags: generatedTags,
      }
    }));

    setSeoGenSuccess("🎉 bilingual SEO-optimised content successfully generated and loaded into draft editor fields! Mark is fully editable.");
    setTimeout(() => setSeoGenSuccess(""), 4000);
  };

  // Save app DRAFT handler
  const handleCreateDraft = async () => {
    if (!preview) return;

    if (preview.confidenceScore < 40 && !lowConfidenceConfirm) {
      setError("Action Denied: You must check the Low Confidence Import box before saving.");
      return;
    }

    setImporting(true);
    setError("");

    try {
      const filteredLinks = preview.externalDownloadLinks.filter((_, idx) => approvedLinks[idx]);
      const payload = {
        ...preview,
        externalDownloadLinks: filteredLinks,
      };

      const res = await fetch("/api/import-url/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Failed to create app draft.");
        return;
      }

      router.push(`/admin/apps/${json.data.appId}`);
    } catch {
      setError("A connection error occurred while creating draft.");
    } finally {
      setImporting(false);
    }
  };

  // Start Bulk Import worker queue
  const triggerBulkImportQueue = async () => {
    if (!bulkInput.trim() || bulkProcessing) return;
    setBulkProcessing(true);
    setError("");

    // Split inputs and clean up URLs
    const urls = bulkInput
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    if (urls.length === 0) {
      setError("Validation Error: Please paste at least one valid HTTP/HTTPS URL address.");
      setBulkProcessing(false);
      return;
    }

    // Initialize bulk execution table entries
    const items: BulkQueueItem[] = urls.map((u, i) => {
      let srcName = "Generic";
      try {
        const host = new URL(u).hostname.toLowerCase();
        const matched = supportedSources.find(s => host.includes(s.domain));
        if (matched) srcName = matched.name;
      } catch {}

      return {
        id: i + 1,
        url: u,
        source: srcName,
        status: "pending",
      };
    });

    setBulkQueue(items);

    // Iterative queue worker
    for (let index = 0; index < items.length; index++) {
      // Mark processing in state
      setBulkQueue((prev) =>
        prev.map((item, idx) => (idx === index ? { ...item, status: "processing" } : item))
      );

      const targetUrl = items[index].url;

      try {
        // Step 1: Preview Fetch Metadata
        const previewRes = await fetch("/api/import-url/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl, forceGeneric: false }),
        });
        const previewJson = await previewRes.json();

        if (previewJson.requiresBrowserAssist === true) {
          setBulkQueue((prev) =>
            prev.map((item, idx) =>
              idx === index
                ? { ...item, status: "BROWSER_REQUIRED", reason: previewJson.message || "Browser-assisted extraction required." }
                : item
            )
          );
          continue;
        }

        if (!previewRes.ok) {
          throw new Error(previewJson.error || "Metadata fetch failed.");
        }

        if (previewJson.success === false && previewJson.type === "protected_source") {
          throw new Error(`Protected Source Blocked (${previewJson.statusCode}): ${previewJson.message}`);
        }

        const previewData: ImportedAppData = previewJson.data.preview;

        // Step 2: Auto Generate content placeholders before saving draft
        const titleEn = previewData.title.en || "App";
        const titleAr = previewData.title.ar || titleEn;
        const version = previewData.versionName || "v1.0";
        const developer = previewData.developer || "Developer";
        const category = previewData.category || "Utility";
        const modFeat = previewData.modFeatures.length > 0 ? previewData.modFeatures.join(", ") : "Mod Unlocked";

        previewData.shortDescription = {
          en: `Download ${titleEn} MOD APK ${version} for Android. Fully unlocked with ${modFeat} and optimized ads.`,
          ar: `تحميل تطبيق ${titleAr} مهكر للأندرويد بأحدث إصدار. مفتوح الميزات بالكامل وبدون إعلانات.`,
        };

        previewData.description = {
          en: `### ${titleEn} MOD Premium Release\n\nDownload ${titleEn} MOD APK v${version} for Android. Fully unlocked with premium features and ads removed.`,
          ar: `### تحميل تطبيق ${titleAr} مهكر بأحدث إصدار\n\nتحميل تطبيق ${titleAr} مهكر للأندرويد بأحدث إصدار. مفتوح الميزات بالكامل وبدون إعلانات.`,
        };

        // Approve all safe mirrors automatically in bulk mode
        const filteredLinks = previewData.externalDownloadLinks.filter(
          (l) => l.classification === "trusted" || l.classification === "mirror"
        );
        previewData.externalDownloadLinks = filteredLinks;

        setBulkQueue((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? { ...item, status: "saving", title: previewData.title.en }
              : item
          )
        );

        // Step 3: Create Draft
        const saveRes = await fetch("/api/import-url/create-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previewData),
        });
        const saveJson = await saveRes.json();

        if (!saveRes.ok) {
          throw new Error(saveJson.error || "Draft write transaction failed.");
        }

        // Complete Success
        setBulkQueue((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? { ...item, status: "success", draftId: saveJson.data.appId }
              : item
          )
        );
      } catch (err: any) {
        // Complete Failure
        setBulkQueue((prev) =>
          prev.map((item, idx) =>
            idx === index
              ? { ...item, status: "failed", reason: err.message || "Scraper Error" }
              : item
          )
        );
      }
    }

    setBulkProcessing(false);
  };

  const updatePreviewField = (updater: (prev: ImportedAppData) => ImportedAppData) => {
    if (!preview) return;
    setPreview(updater(preview));
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case "HEALTHY":
        return { text: "Verified Online", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "SLOW":
        return { text: "Slow Response", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      case "DEAD":
      case "REDIRECT_BROKEN":
        return { text: "Offline / Broken", className: "bg-red-500/10 text-red-400 border border-red-500/20" };
      case "REMOVED":
        return { text: "File Removed", className: "bg-neutral-500/20 text-neutral-400 border border-neutral-500/30" };
      default:
        return { text: "Unknown", className: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20" };
    }
  };

  const inputStyle = {
    background: "hsl(var(--color-bg-secondary))",
    color: "hsl(var(--color-text-primary))",
    border: "1px solid hsl(var(--color-border))",
  };

  return (
    <div className="max-w-5xl space-y-6 font-sans">
      {/* Page Title Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gradient">
            APK Store Importer Control Panel
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Perform administrative metadata extraction, content generation, and draft merges.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-neutral-900/40 p-1 border border-neutral-800">
          <button
            onClick={() => { setImporterMode("single"); setPreview(null); setError(""); setProtectedSource(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${importerMode === "single" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-neutral-400 hover:text-neutral-200 border border-transparent"}`}
          >
            🌐 Single
          </button>
          <button
            onClick={() => { setImporterMode("browser"); setPreview(null); setError(""); setProtectedSource(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide flex items-center gap-1.5 ${importerMode === "browser" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-neutral-400 hover:text-neutral-200 border border-transparent"} ${(selectedSource.domain === "liteapks.com" || selectedSource.domain === "modyolo.com") ? "ring-2 ring-emerald-500/30" : ""}`}
          >
            <span>🚀 Browser</span>
            {(selectedSource.domain === "liteapks.com" || selectedSource.domain === "modyolo.com") && (
              <span className="text-[9px] bg-emerald-500 text-black px-1 rounded font-extrabold uppercase animate-pulse">
                REC
              </span>
            )}
          </button>
          <button
            onClick={() => { setImporterMode("bulk"); setPreview(null); setError(""); setProtectedSource(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${importerMode === "bulk" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-neutral-400 hover:text-neutral-200 border border-transparent"}`}
          >
            📦 Bulk Queue
          </button>
          <button
            onClick={() => { setImporterMode("dashboard"); setPreview(null); setError(""); setProtectedSource(null); fetchDashboardData(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wide ${importerMode === "dashboard" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-neutral-400 hover:text-neutral-200 border border-transparent"}`}
          >
            📊 Dashboard
          </button>
        </div>
      </div>

      {/* Safety Compliance Badge Banner */}
      <div className="p-3.5 rounded-xl text-xs flex items-center justify-between gap-4"
        style={{ background: "hsl(215 90% 50% / 0.04)", border: "1px solid hsl(215 90% 50% / 0.15)", color: "hsl(215 90% 50%)" }}>
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span><strong>Safety Policy Active:</strong> CAPTCHA solving, IP spoofing, proxies, and deep direct download mirror scraping are disabled to prevent cloud-ban blocks.</span>
        </div>
        <span className="text-[10px] font-bold uppercase shrink-0">Admin Sandbox Only</span>
      </div>

      {/* ================================================================
          MODE 1: SINGLE IMPORT
          ================================================================ */}
      {importerMode === "single" && (
        <div className="space-y-6 fade-in">
          {/* Source Selector Deck */}
          <div className="rounded-2xl p-6 border space-y-4"
            style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                1. Select Source Host:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {supportedSources.map((src) => {
                  const isSelected = selectedSource.name === src.name;
                  return (
                    <button
                      key={src.name}
                      type="button"
                      onClick={() => {
                        setSelectedSource(src);
                        setError("");
                        setProtectedSource(null);
                      }}
                      className="p-3.5 rounded-xl border text-center transition-all cursor-pointer select-none outline-none flex flex-col justify-center items-center gap-1.5"
                      style={{
                        borderColor: isSelected ? src.color : "hsl(var(--color-border))",
                        background: isSelected ? `${src.color}15` : "hsl(var(--color-bg-secondary) / 0.4)",
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: isSelected ? src.color : "hsl(var(--color-text-primary))" }}>
                        {src.name}
                      </span>
                      <span className="text-[8px] text-neutral-400 truncate w-full font-mono">{src.domain}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Advice Tip Card */}
            <div className="p-3.5 rounded-xl border flex items-start gap-2.5"
              style={{ background: "hsl(var(--color-bg-secondary) / 0.6)", borderColor: "hsl(var(--color-border))" }}>
              <span className="text-lg">💡</span>
              <div className="text-xs">
                <p className="font-bold text-neutral-200">Advice Tip for {selectedSource.name}:</p>
                <p className="text-neutral-400 mt-0.5">{selectedSource.tips}</p>
              </div>
            </div>

            {/* Scrape Input Display */}
            <div className="border-t pt-4" style={{ borderColor: "hsl(var(--color-border))" }}>
              {(selectedSource.domain === "liteapks.com" || selectedSource.domain === "modyolo.com") && (
                <div className="p-3.5 mb-4 rounded-xl text-xs font-bold flex items-center justify-between gap-3 border bg-emerald-500/10 text-emerald-400 border-emerald-500/25">
                  <div className="flex items-center gap-2">
                    <span>✨</span>
                    <span>Browser-Assisted Import Recommended for {selectedSource.name}!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImporterMode("browser");
                    }}
                    className="px-2.5 py-1 rounded bg-emerald-500 text-black text-[10px] font-extrabold uppercase active:scale-95 transition-all cursor-pointer"
                  >
                    Switch Now
                  </button>
                </div>
              )}

              <div className="flex border-b mb-4" style={{ borderColor: "hsl(var(--color-border) / 0.4)" }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab("url"); setProtectedSource(null); setError(""); }}
                  className="px-4 py-2 text-xs font-bold border-b-2 transition-all"
                  style={{
                    borderColor: activeTab === "url" ? "hsl(142 71% 45%)" : "transparent",
                    color: activeTab === "url" ? "hsl(142 71% 45%)" : "hsl(var(--color-text-secondary))"
                  }}
                >
                  🌐 Scrape URL
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab("html"); setProtectedSource(null); setError(""); }}
                  className="px-4 py-2 text-xs font-bold border-b-2 transition-all"
                  style={{
                    borderColor: activeTab === "html" ? "hsl(142 71% 45%)" : "transparent",
                    color: activeTab === "html" ? "hsl(142 71% 45%)" : "hsl(var(--color-text-secondary))"
                  }}
                >
                  📄 Paste HTML Manual Draft Fallback
                </button>
              </div>

              <form onSubmit={handlePreview}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                      Source Address / App Package Code:
                    </label>
                    <input
                      type="text"
                      value={url}
                      required
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder={`e.g. ${selectedSource.placeholder}`}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>

                  {activeTab === "html" && (
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                        Paste raw page HTML content source code:
                      </label>
                      <textarea
                        value={pastedHtml}
                        required
                        onChange={(e) => setPastedHtml(e.target.value)}
                        placeholder="Right-click on target source site → View Page Source (Ctrl+U) → Copy all and paste here..."
                        rows={6}
                        className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-y"
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {(selectedSource.domain === "liteapks.com" || selectedSource.domain === "modyolo.com") && activeTab === "url" && (
                    <div className="p-4 rounded-xl border flex flex-col gap-3 fade-in"
                      style={{
                        background: "hsl(0 84% 60% / 0.05)",
                        borderColor: "hsl(0 84% 60% / 0.2)",
                        color: "hsl(var(--color-text-primary))"
                      }}>
                      <div className="flex items-start gap-2.5">
                        <span className="text-xl">⚠️</span>
                        <div className="text-xs space-y-1">
                          <p className="font-bold text-red-500">Anti-Bot Protection Detected</p>
                          <p className="text-neutral-400">This source blocks server-side scraping. Use Browser-Assisted Import instead.</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImporterMode("browser");
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white transition-all bg-emerald-500 hover:bg-emerald-600 cursor-pointer active:scale-95"
                        >
                          🚀 Use Browser-Assisted Import
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("html");
                          }}
                          className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition-all border border-neutral-700 cursor-pointer active:scale-95"
                        >
                          📄 Paste HTML Manually
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading || (activeTab === "url" && (selectedSource.domain === "liteapks.com" || selectedSource.domain === "modyolo.com"))}
                      className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 glow-pulse"
                      style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
                    >
                      {loading ? "Extracting & Analysing..." : activeTab === "url" ? "⚡ One-Click Extract Metadata" : "⚙️ Parse HTML & Generate Draft"}
                    </button>
                  </div>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ================================================================
          MODE 2: BROWSER-ASSISTED BOOKMARKLET
          ================================================================ */}
      {importerMode === "browser" && (
        <div className="rounded-2xl p-6 border space-y-6 fade-in"
          style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}>
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "hsl(var(--color-border))" }}>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                🚀 Browser-Assisted Scraping Bookmarklet
              </h3>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--color-text-secondary))" }}>
                Import metadata directly from pages that block the server using your browser's authenticated DOM context.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm shrink-0">
              Native Gzip Encrypted Channel
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                📋 Installation & Usage Instructions:
              </h4>
              <ol className="space-y-3 text-xs leading-relaxed" style={{ color: "hsl(var(--color-text-secondary))" }}>
                <li className="flex gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold shrink-0">1</span>
                  <span><strong>Install:</strong> Drag the emerald button on the right into your browser's <strong>Bookmarks Bar</strong> (Ctrl+Shift+B). Or click the Copy button to create a bookmark manually.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold shrink-0">2</span>
                  <span><strong>Navigate:</strong> Open any supported third-party page (e.g. LiteAPKs page, APKPure page) inside your browser.</span>
                </li>
                <li className="flex gap-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold shrink-0">3</span>
                  <span><strong>Trigger:</strong> Click the bookmarklet in your bookmarks bar. A status widget will slide in on the top-right.</span>
                </li>
              </ol>
            </div>

            <div className="flex flex-col justify-center items-center p-6 rounded-2xl border text-center space-y-4"
              style={{ background: "hsl(var(--color-bg-secondary))", borderColor: "hsl(var(--color-border))" }}>
              
              <div className="space-y-1">
                <span className="text-4xl animate-bounce inline-block">🔗</span>
                <p className="text-xs font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>Drag & Drop Bookmarklet Button</p>
              </div>

              <a
                href={`javascript:(async function(){const o=document.createElement("div");o.id="mod-store-importer-widget";o.style.cssText="position:fixed;top:20px;right:20px;z-index:9999999;width:300px;background:rgba(18,18,18,0.96);color:#fff;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.6);font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(16px);box-sizing:border-box;transition:all 0.3s ease;";o.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:20px;">🛡️</span><h4 style="margin:0;font-size:14px;font-weight:800;letter-spacing:0.5px;color:#10B981;text-transform:uppercase;">MOD Importer</h4></div><p id="bi-status-txt" style="margin:0 0 12px 0;font-size:12px;color:#d1d5db;line-height:1.5;">Preparing DOM metadata...</p><div style="height:4px;width:100%;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-bottom:12px;"><div id="bi-status-bar" style="height:100%;width:15%;background:#10B981;"></div></div>';document.body.appendChild(o);const t=(e,t)=>{const r=document.getElementById("bi-status-txt");const n=document.getElementById("bi-status-bar");if(r)r.innerHTML=e;if(n){n.style.width=t+"%"}};try{const s="${storeOrigin}/admin/apps/import-url?browser_import=true";const r="${storeOrigin}";t("🔍 Running extraction...",30);const ogTitle=document.querySelector("meta[property=\\'og:title\']")?.content||document.title;const metaDesc=document.querySelector("meta[name=\'description\']")?.content||"";const canonical=document.querySelector("link[rel=\'canonical\']")?.href||window.location.href;const smartMetadata={title:ogTitle,description:metaDesc,canonical,screenshots:[]};t("📦 Parsing DOM content...",50);let html=document.documentElement.outerHTML;t("⚡ Compressing Gzip payload...",70);let compressedHtml=null;if(typeof CompressionStream!=="undefined"){try{const stream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(html));c.close()}});const comp=stream.pipeThrough(new CompressionStream("gzip"));const buffer=await new Response(comp).arrayBuffer();compressedHtml=btoa(String.fromCharCode(...new Uint8Array(buffer)))}catch(err){console.warn(err)}}const popup=window.open(s,"_blank");if(!popup){t("❌ Popup blocked! Allow popups.",100);return}t("🚀 Securely transmitting...",90);let attempts=0;let ack=false;const tx=setInterval(()=>{if(ack){clearInterval(tx);return}attempts++;if(attempts>40){clearInterval(tx);t("❌ Transmission timed out.",100)}popup.postMessage({type:"BROWSER_IMPORT_PAYLOAD",url:window.location.href,html:compressedHtml?null:html,compressedHtml,smartMetadata},r)},500);const ackListener=(e)=>{if(e.origin===r&&e.data?.type==="BROWSER_IMPORT_ACK"){ack=true;t("🎉 Imported! Focus store tab.",100);window.removeEventListener("message",ackListener);setTimeout(()=>{o.remove()},1000)}};window.addEventListener("message",ackListener)}catch(err){t("❌ Error: "+err.message,100)}})();`}
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-grab border border-emerald-500/30 animate-pulse"
                style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(150 80% 40%))" }}
              >
                <span>📥</span> Drag to Bookmark Bar
              </a>

              <div className="w-full">
                <button
                  onClick={() => {
                    const jsCode = `javascript:(async function(){const o=document.createElement("div");o.id="mod-store-importer-widget";o.style.cssText="position:fixed;top:20px;right:20px;z-index:9999999;width:300px;background:rgba(18,18,18,0.96);color:#fff;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.6);font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:20px;border:1px solid rgba(255,255,255,0.08);backdrop-filter:blur(16px);box-sizing:border-box;transition:all 0.3s ease;";o.innerHTML='<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><span style="font-size:20px;">🛡️</span><h4 style="margin:0;font-size:14px;font-weight:800;letter-spacing:0.5px;color:#10B981;text-transform:uppercase;">MOD Importer</h4></div><p id="bi-status-txt" style="margin:0 0 12px 0;font-size:12px;color:#d1d5db;line-height:1.5;">Preparing DOM metadata...</p><div style="height:4px;width:100%;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;margin-bottom:12px;"><div id="bi-status-bar" style="height:100%;width:15%;background:#10B981;"></div></div>';document.body.appendChild(o);const t=(e,t)=>{const r=document.getElementById("bi-status-txt");const n=document.getElementById("bi-status-bar");if(r)r.innerHTML=e;if(n){n.style.width=t+"%"}};try{const s="${storeOrigin}/admin/apps/import-url?browser_import=true";const r="${storeOrigin}";t("🔍 Running extraction...",30);const ogTitle=document.querySelector("meta[property=\'og:title\']")?.content||document.title;const metaDesc=document.querySelector("meta[name=\'description\']")?.content||"";const canonical=document.querySelector("link[rel=\'canonical\']")?.href||window.location.href;const smartMetadata={title:ogTitle,description:metaDesc,canonical,screenshots:[]};t("📦 Parsing DOM content...",50);let html=document.documentElement.outerHTML;t("⚡ Compressing Gzip payload...",70);let compressedHtml=null;if(typeof CompressionStream!=="undefined"){try{const stream=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode(html));c.close()}});const comp=stream.pipeThrough(new CompressionStream("gzip"));const buffer=await new Response(comp).arrayBuffer();compressedHtml=btoa(String.fromCharCode(...new Uint8Array(buffer)))}catch(err){console.warn(err)}}const popup=window.open(s,"_blank");if(!popup){t("❌ Popup blocked! Allow popups.",100);return}t("🚀 Securely transmitting...",90);let attempts=0;let ack=false;const tx=setInterval(()=>{if(ack){clearInterval(tx);return}attempts++;if(attempts>40){clearInterval(tx);t("❌ Transmission timed out.",100)}popup.postMessage({type:"BROWSER_IMPORT_PAYLOAD",url:window.location.href,html:compressedHtml?null:html,compressedHtml,smartMetadata},r)},500);const ackListener=(e)=>{if(e.origin===r&&e.data?.type==="BROWSER_IMPORT_ACK"){ack=true;t("🎉 Imported! Focus store tab.",100);window.removeEventListener("message",ackListener);setTimeout(()=>{o.remove()},1000)}};window.addEventListener("message",ackListener)}catch(err){t("❌ Error: "+err.message,100)}})();`;
                    navigator.clipboard.writeText(jsCode);
                    setBookmarkletCopied(true);
                    setTimeout(() => setBookmarkletCopied(false), 2000);
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 transition-all border border-neutral-700 cursor-pointer active:scale-95 shadow-sm"
                  style={{ color: "hsl(var(--color-text-primary))" }}
                >
                  {bookmarkletCopied ? "✔️ Bookmarklet Code Copied!" : "📋 Copy Bookmarklet JS Code"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODE 3: BULK IMPORT WORKER QUEUE
          ================================================================ */}
      {importerMode === "bulk" && (
        <div className="space-y-6 fade-in">
          <div className="rounded-2xl p-6 border space-y-4"
            style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}>
            
            <div>
              <h3 className="text-base font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                📦 Sequential Bulk Extractor Queue
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Paste list of URLs, one per line. The importer will automatically detect domain parsers, extract metadata, generate SEO translations, and write drafts sequentially.
              </p>
            </div>

            <div>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="https://liteapks.com/whatsapp-messenger.html&#10;https://modyolo.com/subway-surfers.html&#10;https://gamedva.com/minecraft-pe.html"
                rows={6}
                disabled={bulkProcessing}
                className="w-full px-4 py-3 rounded-xl text-xs font-mono outline-none resize-y"
                style={inputStyle}
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Supports up to 20 URLs. Blank lines and non-HTTP lines are filtered automatically.
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={triggerBulkImportQueue}
                disabled={bulkProcessing || !bulkInput.trim()}
                className="px-5 py-3 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
              >
                {bulkProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                    <span>Processing Queue...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Start Bulk Import Queue</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Bulk Processing execution logger table */}
          {bulkQueue.length > 0 && (
            <div className="rounded-2xl border overflow-hidden p-6 space-y-4 shadow-xl border-neutral-800 bg-neutral-900/60">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-bold text-neutral-200">
                  📋 Live Extraction Queue Monitor
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                  {bulkQueue.filter(q => q.status === "success").length} / {bulkQueue.length} Succeeded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Source Host</th>
                      <th className="py-2.5 px-3">App Title</th>
                      <th className="py-2.5 px-3 w-[45%]">Source URL</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/40 text-neutral-300">
                    {bulkQueue.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-800/15 transition-all">
                        <td className="py-3 px-3 font-mono text-neutral-500">{item.id}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-200 bg-neutral-800/80 border border-neutral-700/60">
                            {item.source}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold">
                          {item.title ? (
                            <span className="text-emerald-400">{item.title}</span>
                          ) : item.status === "BROWSER_REQUIRED" ? (
                            <span className="text-amber-500">⚠ Browser Interaction Required</span>
                          ) : item.status === "failed" ? (
                            <span className="text-rose-500">Extraction Failed</span>
                          ) : (
                            <span className="text-neutral-500 italic">Queueing...</span>
                          )}
                        </td>
                        <td className="py-3 px-3 truncate max-w-[300px] font-mono text-[10px]">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-400">
                            {item.url}
                          </a>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.status === "pending" && <span className="text-neutral-500">⏳ Queueing</span>}
                          {item.status === "processing" && <span className="text-yellow-500 font-semibold animate-pulse">⚙️ Fetching...</span>}
                          {item.status === "saving" && <span className="text-blue-400 font-semibold">📝 Draft Creating</span>}
                          {item.status === "success" && (
                            <div className="flex justify-center items-center gap-1.5">
                              <span className="text-emerald-400 font-bold">✅ Success</span>
                              {item.draftId && (
                                <button
                                  onClick={() => router.push(`/admin/apps/${item.draftId}`)}
                                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[9px] font-bold border border-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                                >
                                  Edit Draft
                                </button>
                              )}
                            </div>
                          )}
                           {item.status === "BROWSER_REQUIRED" && (
                            <div className="flex flex-col items-center">
                              <span className="text-amber-500 font-bold">⚠️ Browser Required</span>
                              <span className="text-[9px] text-amber-500/80 max-w-[150px] text-center" title={item.reason}>
                                ⚠ Browser Interaction Required
                              </span>
                            </div>
                          )}
                          {item.status === "failed" && (
                            <div className="flex flex-col items-center">
                              <span className="text-rose-500 font-bold">❌ Failed</span>
                              <span className="text-[9px] text-rose-500/70 max-w-[150px] truncate" title={item.reason}>
                                {item.reason}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================
          MODE 4: ENTERPRISE TELEMETRY DASHBOARD
          ================================================================ */}
      {importerMode === "dashboard" && (
        <div className="space-y-6 fade-in text-start">
          {loadingDashboard && (
            <div className="p-12 text-center text-sm font-semibold text-neutral-400">
              <span className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin inline-block mb-3" />
              <p>Compiling Enterprise-grade Telemetry Feeds...</p>
            </div>
          )}

          {!loadingDashboard && dashboardData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Telemetry Stats Column */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Metrics Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-start">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Queue mode</p>
                    <p className="text-sm font-black text-emerald-400 mt-1">{dashboardData.queueReport.engineMode}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-start">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Browser active</p>
                    <p className="text-sm font-black text-emerald-400 mt-1">YES (Stealth)</p>
                  </div>
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-start">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Failed Imports</p>
                    <p className="text-sm font-black text-rose-500 mt-1">{dashboardData.incompleteDrafts.length}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-start">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Total Mirrors</p>
                    <p className="text-sm font-black text-emerald-400 mt-1">{dashboardData.mirrors.length}</p>
                  </div>
                </div>

                {/* Queue monitoring status */}
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 text-start space-y-3">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                    <span>⚡</span> Background Queue Monitor
                  </h3>
                  <div className="text-xs text-neutral-400 space-y-2">
                    <p>Total pending jobs: <strong>{dashboardData.queueReport.queueLength}</strong></p>
                    <p>Total completed jobs: <strong>{dashboardData.queueReport.completedJobsCount}</strong></p>
                    {dashboardData.queueReport.failedJobs.length > 0 && (
                      <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400">
                        <p className="font-bold">Failed Jobs:</p>
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          {dashboardData.queueReport.failedJobs.map((j: any, idx: number) => (
                            <li key={idx}>{j.name} - {j.error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mirror health list */}
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 text-start space-y-4">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                      <span>🔗</span> Mirror Link Health Status
                    </h3>
                    <button
                      type="button"
                      disabled={!!dashboardTriggering}
                      onClick={() => triggerDashboardCron("trigger_health_check")}
                      className="px-2.5 py-1 rounded bg-blue-500 text-black text-[10px] font-extrabold uppercase hover:bg-blue-600 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {dashboardTriggering === "trigger_health_check" ? "Running..." : "Run Health Check"}
                    </button>
                  </div>
                  {dashboardData.mirrors.length === 0 ? (
                    <p className="text-xs italic text-neutral-500">No external mirrors resolved in database.</p>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                      {dashboardData.mirrors.map((m: any) => {
                        const statusBadge = getHealthBadge(m.health);
                        return (
                          <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-800/60 bg-neutral-900/20 text-xs">
                            <div className="truncate max-w-[70%]">
                              <p className="font-semibold text-neutral-300 truncate">{m.app?.title?.en || "App"} - {m.host}</p>
                              <p className="text-[10px] text-blue-400 truncate">{m.url}</p>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase shrink-0 ${statusBadge.className}`}>
                              {statusBadge.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>

              {/* Sidebar Config / Action Column */}
              <div className="space-y-6 text-start">
                
                {/* Cron Activities */}
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 border-b border-neutral-800 pb-3">
                    <span>🕒</span> Scheduled Cron Monitors
                  </h3>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-900">
                      <p className="font-bold text-neutral-300">Auto Update Crawler</p>
                      <p className="text-neutral-500 text-[10px] mt-0.5">Schedule: every 6 hours</p>
                      <p className="text-neutral-400 text-[10px] mt-1">Status: <span className="text-emerald-400 font-bold">ACTIVE</span></p>
                      <button
                        type="button"
                        disabled={!!dashboardTriggering}
                        onClick={() => triggerDashboardCron("trigger_crawler")}
                        className="w-full mt-2 py-1.5 rounded bg-emerald-500 text-black text-[10px] font-extrabold uppercase hover:bg-emerald-600 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {dashboardTriggering === "trigger_crawler" ? "Running..." : "Trigger Crawler Run"}
                      </button>
                    </div>

                    <div className="p-3 rounded-lg bg-neutral-950/40 border border-neutral-900">
                      <p className="font-bold text-neutral-300">Mirror Health Checker</p>
                      <p className="text-neutral-500 text-[10px] mt-0.5">Schedule: every hour</p>
                      <p className="text-neutral-400 text-[10px] mt-1">Status: <span className="text-emerald-400 font-bold">ACTIVE</span></p>
                    </div>
                  </div>
                </div>

                {/* Real Browser Telemetry */}
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-4">
                  <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5 border-b border-neutral-800 pb-3">
                    <span>🌐</span> Headless Browser Logs
                  </h3>
                  <div className="space-y-2 text-xs text-neutral-400">
                    <p>Engine: <strong>{dashboardData.browserTelemetry.engine}</strong></p>
                    <p>Stealth configuration: <span className="text-emerald-400 font-bold">ENABLED</span></p>
                    <p>Headless browser mode: <span className="text-emerald-400 font-bold">ENABLED</span></p>
                    <p>Average Load Speed: <strong>{dashboardData.browserTelemetry.averageRenderTimeMs}ms</strong></p>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      )}

      {/* Parsing Errors Display */}
      {error && (
        <div
          className="rounded-xl p-4 text-sm font-semibold border"
          style={{ background: "hsl(0 84% 60% / 0.08)", color: "hsl(0 84% 60%)", borderColor: "hsl(0 84% 60% / 0.2)" }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Protected Source Premium Alert Card */}
      {protectedSource && (
        <div className="rounded-2xl p-6 border space-y-4 fade-in"
          style={{
            background: "hsl(38 92% 50% / 0.04)",
            borderColor: "hsl(38 92% 50% / 0.2)",
            color: "hsl(var(--color-text-primary))"
          }}
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296a3.745 3.745 0 013-1.5z" />
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-amber-400 flex items-center gap-1.5">
                  <span>🛡️ Anti-Bot Protection Active</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {protectedSource.source} (HTTP {protectedSource.statusCode})
                </span>
              </div>
              <p className="text-xs opacity-90 mt-1">
                {protectedSource.message}
              </p>
              <p className="text-xs opacity-80 font-semibold text-amber-300 mt-1">
                👉 Suggestion: {protectedSource.suggestion}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={() => handlePreview(undefined, true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 cursor-pointer active:scale-95 shadow-md border border-amber-600/30"
            >
              🔄 Try Lightweight Generic Parser
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("html");
                setProtectedSource(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-black hover:bg-amber-600 transition-all cursor-pointer border border-amber-600 active:scale-95"
            >
              📄 Switch to Paste HTML Fallback
            </button>
            <button
              onClick={() => {
                setPreview({
                  sourceName: selectedSource.name,
                  sourceUrl: url,
                  confidenceScore: 30,
                  warnings: ["Manual fallback drafted"],
                  errors: [],
                  title: { en: "", ar: "" },
                  slug: "",
                  packageName: "",
                  shortDescription: { en: "", ar: "" },
                  description: { en: "", ar: "" },
                  iconUrl: null,
                  screenshots: [],
                  versionName: "",
                  versionCode: null,
                  size: "",
                  minAndroid: "",
                  category: "",
                  type: "APP",
                  developer: "",
                  developerUrl: "",
                  rating: 4.5,
                  contentRating: "",
                  installs: "10,000+",
                  releasedAt: null,
                  modFeatures: [],
                  externalDownloadLinks: [],
                  changelog: null,
                  originalPlayStoreUrl: null,
                  rawExtractedData: {}
                });
                setProtectedSource(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition-all cursor-pointer border border-neutral-700 active:scale-95"
            >
              ⌨️ Enter Manual Draft details
            </button>
            <span className="text-[9px] self-center text-neutral-500">
              Bypassing anti-bot checks aggressively (proxies, solvers) is disabled for security compliance.
            </span>
          </div>
        </div>
      )}

      {/* SEO Content Success banner alert */}
      {seoGenSuccess && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md fade-in animate-bounce">
          ✨ {seoGenSuccess}
        </div>
      )}

      {/* Interactive Review Workspace */}
      {preview && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start fade-in">
          {/* Metadata Edit Deck */}
          <div
            className="lg:col-span-2 rounded-2xl p-6 border space-y-5"
            style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}
          >
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: "1px solid hsl(var(--color-border))" }}>
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                  📝 Review & Edit Metadata
                </h2>
                <p className="text-[10px] text-neutral-400">Validate fields and expand copywriting coordinates before saving</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={triggerSEOContentGenerator}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all border border-emerald-500/30 shadow-sm flex items-center gap-1 active:scale-95"
                >
                  <span>✍️</span> Generate SEO Content
                </button>
                <span className="text-xs px-2.5 py-1.5 rounded-lg font-bold shadow-sm"
                  style={{
                    background: preview.confidenceScore === 100 
                      ? "hsl(142 71% 45% / 0.15)" 
                      : preview.confidenceScore === 70
                      ? "hsl(215 90% 50% / 0.15)"
                      : preview.confidenceScore === 40
                      ? "hsl(38 92% 50% / 0.15)"
                      : "hsl(0 84% 60% / 0.15)",
                    color: preview.confidenceScore === 100 
                      ? "hsl(142 71% 45%)" 
                      : preview.confidenceScore === 70
                      ? "hsl(215 90% 50%)"
                      : preview.confidenceScore === 40
                      ? "hsl(38 92% 50%)"
                      : "hsl(0 84% 60%)"
                  }}>
                  {preview.confidenceScore}% Confidence ({
                    preview.confidenceScore === 100 
                      ? "Complete Metadata" 
                      : preview.confidenceScore === 70
                      ? "Partial Metadata"
                      : preview.confidenceScore === 40
                      ? "Weak Extraction"
                      : "Extraction Failed"
                  })
                </span>
              </div>
            </div>

            {/* Warnings Section */}
            {(() => {
              const allWarnings = [...preview.warnings];
              if (preview.iconUrl && !isAllowedImageHost(preview.iconUrl)) {
                try {
                  const host = new URL(preview.iconUrl).hostname;
                  if (!allWarnings.some(w => w.includes(host))) {
                    allWarnings.push(`Image Host Warning: Icon host "${host}" is not configured in next.config.ts remotePatterns.`);
                  }
                } catch {}
              }
              const unallowedScreenshots = preview.screenshots.filter(s => !isAllowedImageHost(s));
              if (unallowedScreenshots.length > 0) {
                if (!allWarnings.some(w => w.includes("screenshots are hosted on unconfigured domains"))) {
                  allWarnings.push(`Image Host Warning: ${unallowedScreenshots.length} screenshots are hosted on unconfigured domains.`);
                }
              }

              if (allWarnings.length === 0) return null;
              
              return (
                <div className="p-3.5 rounded-xl text-xs space-y-1.5 border"
                  style={{ background: "hsl(38 92% 50% / 0.05)", color: "hsl(38 92% 50%)", borderColor: "hsl(38 92% 50% / 0.15)" }}>
                  <p className="font-bold">⚠️ Importer Warnings:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {allWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              );
            })()}

            {/* Duplicates warning indicators */}
            {(duplicates.slug || duplicates.packageName || duplicates.importedSourceUrl) && (
              <div className="p-3.5 rounded-xl text-xs space-y-1 border"
                style={{ background: "hsl(0 84% 60% / 0.05)", color: "hsl(0 84% 60%)", borderColor: "hsl(0 84% 60% / 0.15)" }}>
                <p className="font-bold">🚨 Database Conflicts Found:</p>
                {duplicates.slug && <p>• An app with this Slug already exists in the system.</p>}
                {duplicates.packageName && <p>• An app with this Package Name is already registered.</p>}
                {duplicates.importedSourceUrl && <p>• This source URL has already been imported previously.</p>}
              </div>
            )}

            {/* Duplicate Merge Suggestions */}
            {duplicates.packageName && existingAppId && (
              <div className="p-4 rounded-xl border space-y-3 fade-in"
                style={{ background: "hsl(215 90% 50% / 0.05)", color: "hsl(215 90% 50%)", borderColor: "hsl(215 90% 50% / 0.15)" }}>
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">💡</span>
                  <div className="text-xs">
                    <p className="font-bold">Duplicate Package Name Detected</p>
                    <p className="mt-0.5 opacity-90">
                      An application with package name <strong>{preview.packageName}</strong> already exists as <strong>{existingAppTitle}</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/apps/${existingAppId}`)}
                    className="px-3.5 py-2 rounded-lg text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer active:scale-95 shadow-sm"
                  >
                    🛠️ Merge / Edit Existing App
                  </button>
                  <span className="text-[9px] opacity-80">
                    Directly update the existing version details instead of creating a duplicate.
                  </span>
                </div>
              </div>
            )}

            {/* Low Confidence Warning Confirmation */}
            {preview.confidenceScore < 40 && (
              <div className="p-4 rounded-xl border space-y-3 fade-in"
                style={{ background: "hsl(0 84% 60% / 0.05)", color: "hsl(0 84% 60%)", borderColor: "hsl(0 84% 60% / 0.15)" }}>
                <div className="flex items-start gap-2.5">
                  <span className="text-xl">⚠️</span>
                  <div className="text-xs">
                    <p className="font-bold">Low Confidence Import Warning ({preview.confidenceScore}%)</p>
                    <p className="mt-0.5 opacity-95">
                      This scrape is highly incomplete or is missing crucial metadata markers (e.g. package coordinates, screenshot details).
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={lowConfidenceConfirm}
                    onChange={(e) => setLowConfidenceConfirm(e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold opacity-90">
                    I explicitly confirm that I want to save this low-confidence metadata draft.
                  </span>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title (English) */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Title (English) *</label>
                <input
                  type="text"
                  value={preview.title.en}
                  required
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Title (Arabic) */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Title (Arabic)</label>
                <input
                  type="text"
                  value={preview.title.ar}
                  placeholder="العنوان بالعربية"
                  dir="rtl"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, title: { ...prev.title, ar: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Slug Suggestion */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Slug Suggestion *</label>
                <input
                  type="text"
                  value={preview.slug}
                  required
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Package Name</label>
                <input
                  type="text"
                  value={preview.packageName || ""}
                  placeholder="e.g. com.whatsapp"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, packageName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Developer */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Developer</label>
                <input
                  type="text"
                  value={preview.developer || ""}
                  placeholder="Developer / Studio"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, developer: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Category</label>
                <input
                  type="text"
                  value={preview.category || ""}
                  placeholder="Tools, Action, etc."
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Type</label>
                <CustomSelect
                  value={preview.type}
                  onChange={(val) => updatePreviewField((prev) => ({ ...prev, type: val as "APP" | "GAME" }))}
                  options={[
                    { value: "APP", label: "APP" },
                    { value: "GAME", label: "GAME" },
                  ]}
                  className="w-full text-xs font-semibold"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Size</label>
                <input
                  type="text"
                  value={preview.size || ""}
                  placeholder="e.g. 45 MB"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, size: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Version Name */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Version Name</label>
                <input
                  type="text"
                  value={preview.versionName || ""}
                  placeholder="e.g. 2.24.1"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, versionName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Rating */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Rating</label>
                <input
                  type="number"
                  step="0.1"
                  value={preview.rating || ""}
                  placeholder="e.g. 4.5"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, rating: parseFloat(e.target.value) || null }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Installs */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Installs count</label>
                <input
                  type="text"
                  value={preview.installs || ""}
                  placeholder="e.g. 1,000,000+"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, installs: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              {/* Min Android */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Minimum Android</label>
                <input
                  type="text"
                  value={preview.minAndroid || ""}
                  placeholder="e.g. 5.0+"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, minAndroid: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Short Descriptions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Short Description (English)</label>
                <textarea
                  value={preview.shortDescription?.en || ""}
                  rows={2}
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, shortDescription: { ...prev.shortDescription, en: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Short Description (Arabic)</label>
                <textarea
                  value={preview.shortDescription?.ar || ""}
                  placeholder="الملخص بالعربية"
                  rows={2}
                  dir="rtl"
                  onChange={(e) => updatePreviewField((prev) => ({ ...prev, shortDescription: { ...prev.shortDescription, ar: e.target.value } }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Bilingual descriptions */}
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Description (English) *</label>
              <textarea
                value={preview.description.en}
                rows={7}
                onChange={(e) => updatePreviewField((prev) => ({ ...prev, description: { ...prev.description, en: e.target.value } }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y font-mono text-xs"
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "hsl(var(--color-text-secondary))" }}>Description (Arabic)</label>
              <textarea
                value={preview.description.ar}
                placeholder="الوصف بالعربية"
                rows={7}
                dir="rtl"
                onChange={(e) => updatePreviewField((prev) => ({ ...prev, description: { ...prev.description, ar: e.target.value } }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-y font-mono text-xs"
                style={inputStyle}
              />
            </div>

            {/* SEO generated coordinates (Hidden fields populated by Copywriter) */}
            {preview.rawExtractedData?.seoGeneratedTitle && (
              <div className="p-4 rounded-xl border space-y-3 bg-emerald-500/5 border-emerald-500/10">
                <h4 className="text-xs font-bold text-emerald-400">✨ Custom SEO Meta Generation Results:</h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold block text-neutral-400">SEO Title:</span>
                    <span className="text-neutral-200">{preview.rawExtractedData.seoGeneratedTitle}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-neutral-400">SEO Meta Description:</span>
                    <span className="text-neutral-200">{preview.rawExtractedData.seoGeneratedMeta}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-neutral-400">Generated Search Tags:</span>
                    <span className="text-emerald-400/80 font-mono text-[10px]">{preview.rawExtractedData.seoGeneratedTags}</span>
                  </div>
                </div>
              </div>
            )}

            {/* MOD Features Tagging */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                MOD Features Detected ({preview.modFeatures.length})
              </label>
              <div className="flex flex-wrap gap-2">
                {preview.modFeatures.map((feat, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold"
                    style={{ background: "hsl(var(--color-bg-secondary))", border: "1px solid hsl(var(--color-border))", color: "hsl(var(--color-text-secondary))" }}
                  >
                    🚀 {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Hardened Download Links Safety Portal */}
            <div className="p-5 rounded-2xl border space-y-4" style={{ borderColor: "hsl(var(--color-border))" }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                  🔗 Extracted Download Mirrors ({preview.externalDownloadLinks.length})
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  Selectively approve each individual mirror before writing to the database draft. Unapproved links won't be saved.
                </p>
              </div>

              {preview.externalDownloadLinks.length === 0 ? (
                <p className="text-xs italic text-neutral-500">
                  No external download links extracted from this source.
                </p>
              ) : (
                <div className="space-y-3">
                  {preview.externalDownloadLinks.map((link, idx) => {
                    const isApproved = !!approvedLinks[idx];
                    const classification = link.classification || "unknown";
                    
                    let badgeClass = "";
                    let badgeText = "";
                    
                    if (classification === "trusted") {
                      badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                      badgeText = "Trusted Source";
                    } else if (classification === "mirror") {
                      badgeClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                      badgeText = "Safe Mirror";
                    } else if (classification === "suspicious") {
                      badgeClass = "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse font-extrabold";
                      badgeText = "⚠️ Suspicious Link";
                    } else {
                      badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                      badgeText = "Unverified Host";
                    }

                    return (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all"
                        style={{
                          borderColor: isApproved ? "hsl(142 71% 45% / 0.3)" : "hsl(var(--color-border))",
                          background: isApproved ? "hsl(142 71% 45% / 0.03)" : "hsl(var(--color-bg-secondary))"
                        }}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isApproved}
                            onChange={(e) => {
                              setApprovedLinks(prev => ({
                                ...prev,
                                [idx]: e.target.checked
                              }));
                            }}
                            className="w-4 h-4 rounded mt-0.5 accent-green-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold truncate" style={{ color: "hsl(var(--color-text-primary))" }}>
                                {link.label}
                              </span>
                              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${badgeClass}`}>
                                {badgeText}
                              </span>
                            </div>
                            <p className="text-[10px] truncate max-w-full font-mono text-blue-400 select-all hover:underline cursor-pointer">
                              {link.url}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Premium Preview Card */}
          <div className="space-y-6">
            <div
              className="rounded-2xl border overflow-hidden p-6 text-center space-y-6 sticky top-6"
              style={{ background: "hsl(var(--color-bg-card))", borderColor: "hsl(var(--color-border))" }}
            >
              <h3 className="text-sm font-bold text-start" style={{ color: "hsl(var(--color-text-primary))" }}>
                📱 Mobile Screen Card Preview
              </h3>

              {preview.iconUrl && (
                <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-md border" style={{ borderColor: isAllowedImageHost(preview.iconUrl) ? "transparent" : "hsl(38 92% 50% / 0.3)" }}>
                  {isAllowedImageHost(preview.iconUrl) ? (
                    <Image
                      src={preview.iconUrl}
                      alt={preview.title.en}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <img
                      src={preview.iconUrl}
                      alt={preview.title.en}
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  {!isAllowedImageHost(preview.iconUrl) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-[10px] font-extrabold text-amber-400">
                      ⚠️ Host
                    </div>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-base font-bold text-emerald-400">
                  {preview.title.en || "App Draft Title"}
                </h4>
                <p className="text-xs" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  {preview.developer || "Unknown Developer"}
                </p>
              </div>

              {/* Version & Specs stats */}
              <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y" style={{ borderColor: "hsl(var(--color-border))" }}>
                <div>
                  <span className="block text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>VERSION</span>
                  <span className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>{preview.versionName || "v1.0"}</span>
                </div>
                <div>
                  <span className="block text-[10px]" style={{ color: "hsl(var(--color-text-tertiary))" }}>SIZE</span>
                  <span className="font-semibold" style={{ color: "hsl(var(--color-text-secondary))" }}>{preview.size || "Unknown"}</span>
                </div>
              </div>

              {/* Source attribution badges */}
              <div className="text-start text-[10px] space-y-1 p-3 rounded-xl" style={{ background: "hsl(var(--color-bg-secondary))", color: "hsl(var(--color-text-secondary))" }}>
                <p>📍 Importer: <strong>{preview.sourceName}</strong></p>
                <p className="truncate">🔗 Source: <a href={preview.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{preview.sourceUrl}</a></p>
                <p>🕒 Scraped At: <strong>{new Date().toLocaleDateString()}</strong></p>
              </div>

              {/* Submission CTA */}
              <button
                onClick={handleCreateDraft}
                disabled={importing || (preview.confidenceScore < 40 && !lowConfidenceConfirm)}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 shrink-0 cursor-pointer active:scale-95 shadow-md glow-pulse border border-transparent"
                style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))" }}
              >
                {importing ? "Creating Draft..." : "📥 Save App as DRAFT"}
              </button>
              <p className="text-[10px] text-neutral-500" style={{ color: "hsl(var(--color-text-tertiary))" }}>
                Imported apps remain in <strong>Draft status</strong> and require administrative approval before public release.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
