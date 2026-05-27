"use client";

import React, { useEffect } from "react";
import Link from "next/link";

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error("Unhandled App Runtime Error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{ background: "hsl(var(--color-bg-primary))" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-5 blur-[120px]"
          style={{ background: "hsl(0 84% 60%)" }}
        />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="card-glass p-8 sm:p-10 border" style={{ borderColor: "hsl(var(--color-border))" }}>
          <div className="text-5xl mb-4 animate-pulse">⚠️</div>
          <h1 className="text-xl font-bold mb-2" style={{ color: "hsl(var(--color-text-primary))" }}>
            Something went wrong!
          </h1>
          <p className="text-xs mb-8 leading-relaxed" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            An unexpected error occurred while rendering this page. Our team has been notified.
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => reset()}
              className="btn-primary w-full justify-center py-3 rounded-xl font-semibold text-sm"
            >
              🔄 Try Again
            </button>
            <Link
              href="/"
              className="btn-secondary w-full justify-center py-3 rounded-xl font-semibold text-sm inline-block"
            >
              🏠 Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
