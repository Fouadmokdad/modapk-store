"use client";

import React from "react";

export default function RootLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "hsl(var(--color-bg-primary))" }}
    >
      {/* Ambient background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "var(--gradient-brand)" }}
        />
      </div>

      <div className="text-center relative z-10">
        {/* Shimmer loading spinner */}
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-dashed animate-spin"
            style={{ borderColor: "hsl(var(--color-accent))", animationDuration: "3s" }} />
          <div className="absolute inset-2 rounded-full border-4 border-double animate-spin"
            style={{ borderColor: "hsl(var(--color-accent) / 0.4)", animationDuration: "1.5s", animationDirection: "reverse" }} />
        </div>
        <p className="text-sm font-semibold tracking-wide animate-pulse" style={{ color: "hsl(var(--color-text-secondary))" }}>
          MOD<span className="text-gradient">APK</span> Store
        </p>
      </div>
    </div>
  );
}
