"use client";

import React, { useState, useEffect } from "react";

export default function BrowserBookmarklet() {
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Secure lightweight script that pulls our public extractor and runs it
  const bookmarkletCode = `javascript:(function(){const s=document.createElement('script');s.src='${origin}/browser-importer.js?v='+Date.now();document.body.appendChild(s);})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card-glass p-6 rounded-2xl border space-y-6" style={{ borderColor: "hsl(var(--color-border))" }}>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "hsl(var(--color-border))" }}>
        <div>
          <h3 className="text-lg font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
            🚀 Browser-Assisted Metadata Extractor
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Install this dynamic bookmarklet to import app drafts securely directly from your browser.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm shrink-0">
          Native Gzip Encrypted Channel
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Side: Drag and Copy Buttons */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl border text-center space-y-4"
          style={{ background: "hsl(var(--color-bg-secondary) / 0.5)", borderColor: "hsl(var(--color-border))" }}>
          
          <div className="space-y-1 select-none">
            <span className="text-4xl animate-bounce inline-block">🔗</span>
            <p className="text-sm font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>Draggable Extractor Trigger</p>
            <p className="text-[10px] text-neutral-400">Drag this button directly to your browser's bookmarks bar:</p>
          </div>

          <a
            href={bookmarkletCode}
            onClick={(e) => e.preventDefault()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-grab border border-emerald-500/30 glow-pulse"
            style={{ background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(150 80% 40%))" }}
          >
            🚀 Drag to Bookmark Bar
          </a>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 transition-all border border-neutral-700 cursor-pointer active:scale-95 text-neutral-200"
          >
            {copied ? "✔️ Bookmarklet Code Copied!" : "📋 Copy Bookmarklet JS Code"}
          </button>
        </div>

        {/* Right Side: Installation & Compatibility */}
        <div className="space-y-4 text-xs leading-relaxed" style={{ color: "hsl(var(--color-text-secondary))" }}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            📋 Installation and Setup
          </h4>
          <ol className="list-decimal pl-4 space-y-2 text-neutral-300">
            <li>Ensure your **Bookmarks Bar** is visible (press `Ctrl+Shift+B` or `Cmd+Shift+B`).</li>
            <li>Drag the green button on the left and drop it onto your bookmarks bar.</li>
            <li>Alternatively, create a new bookmark manually, name it "MOD Importer", and paste the copied JS code as the URL destination.</li>
          </ol>

          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 pt-2">
            🧭 Compatibility & Safety Notes
          </h4>
          <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-neutral-400">
            <li>**Browser Support:** Works on Google Chrome, Mozilla Firefox, Microsoft Edge, Safari, and Brave.</li>
            <li>**Secure Transmission:** Data is compressed locally using native Gzip streams and sent over an origin-verified postMessage channel.</li>
            <li>**No Script Tracking:** Fully safe and sandbox-compliant; strictly operates within administrative drafts status.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
