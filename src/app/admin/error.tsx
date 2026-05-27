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

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-3xl mb-6">
        ⚠️
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
        Admin Panel Runtime Error
      </h2>
      <p className="text-sm max-w-md mb-8 leading-relaxed" style={{ color: "hsl(var(--color-text-secondary))" }}>
        A rendering exception occurred in this panel section. The crash was intercepted defensively by our root error boundary.
      </p>
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
