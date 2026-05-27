"use client";

// =============================================================================
// Defensive Admin Error Boundary — React Error Boundary for /admin
// =============================================================================
import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error defensively to trace analytics
    console.error("Admin Panel Runtime Crash Caught by Error Boundary:", error);
  }, [error]);

  const copyError = () => {
    navigator.clipboard.writeText(
      `Message: ${error.message}\nStack: ${error.stack || "N/A"}\nDigest: ${error.digest || "N/A"}`
    );
    alert("Error logs copied to clipboard!");
  };

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-3xl mb-6">
        ⚠️
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
        Admin Panel Runtime Error
      </h2>
      <p className="text-sm max-w-md mb-4 leading-relaxed" style={{ color: "hsl(var(--color-text-secondary))" }}>
        A rendering exception occurred in this panel section. The crash was intercepted defensively by our root error boundary.
      </p>

      {/* Development error display */}
      <div className="w-full max-w-lg mb-6 text-left bg-black/40 border border-red-500/20 p-4 rounded-xl font-mono text-xs overflow-auto max-h-48 text-red-400">
        <p className="font-bold mb-1">Error: {error.message || String(error)}</p>
        {isDev && error.stack && (
          <pre className="whitespace-pre-wrap opacity-80 mt-2">{error.stack}</pre>
        )}
        {error.digest && <p className="opacity-60 mt-1">Digest: {error.digest}</p>}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="btn btn-primary px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer active:scale-95 transition-all"
          style={{
            background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
            color: "#ffffff",
            boxShadow: "0 4px 12px hsl(142 71% 45% / 0.15)",
            border: "none",
          }}
        >
          🔄 Retry Component
        </button>
        <button
          onClick={copyError}
          className="btn btn-secondary px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer active:scale-95 transition-all"
          style={{
            background: "hsl(var(--color-bg-secondary))",
            color: "hsl(var(--color-text-primary))",
            border: "1px solid hsl(var(--color-border))",
          }}
        >
          📋 Copy Details
        </button>
        <Link
          href="/admin"
          className="btn btn-secondary px-5 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-all"
          style={{
            background: "hsl(var(--color-bg-secondary))",
            color: "hsl(var(--color-text-primary))",
            border: "1px solid hsl(var(--color-border))",
          }}
        >
          Dashboard Home
        </Link>
      </div>
    </div>
  );
}
