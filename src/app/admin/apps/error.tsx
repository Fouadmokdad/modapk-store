"use client";

// =============================================================================
// Defensive Apps Admin Error Boundary
// =============================================================================
import React, { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppsAdminErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Apps Admin Module Runtime Crash Caught:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-2xl mb-5">
        🔧
      </div>
      <h2 className="text-lg font-bold mb-1" style={{ color: "hsl(var(--color-text-primary))" }}>
        Apps Directory Render Failed
      </h2>
      <p className="text-xs max-w-sm mb-6 leading-relaxed" style={{ color: "hsl(var(--color-text-secondary))" }}>
        Failed to dynamically list or render the APK applications list. This has been defensively caught.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => reset()}
          className="btn btn-primary px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer active:scale-95 transition-all"
          style={{
            background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
            color: "#ffffff",
            border: "none",
          }}
        >
          🔄 Reload List
        </button>
        <Link
          href="/admin"
          className="btn btn-secondary px-4 py-2 rounded-xl font-semibold text-xs active:scale-95 transition-all"
          style={{
            background: "hsl(var(--color-bg-secondary))",
            color: "hsl(var(--color-text-primary))",
            border: "1px solid hsl(var(--color-border))",
          }}
        >
          Back to Panel
        </Link>
      </div>
    </div>
  );
}
