"use client";

// =============================================================================
// Admin Header Component
// =============================================================================
import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";

interface AdminHeaderProps {
  onMenuToggle: () => void;
}

export function AdminHeader({ onMenuToggle }: AdminHeaderProps) {
  const { data: session } = useSession();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 transition-all"
      style={{
        height: "var(--header-height)",
        background: "hsl(var(--color-bg-card) / 0.8)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid hsl(var(--color-border))",
      }}
    >
      {/* Left: Mobile Menu + Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl transition-all"
          style={{
            color: "hsl(var(--color-text-secondary))",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "hsl(var(--color-bg-secondary))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl transition-all"
          style={{
            color: "hsl(var(--color-text-secondary))",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "hsl(var(--color-bg-secondary))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {resolvedTheme === "dark" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer"
            style={{
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--color-bg-secondary))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {session?.user?.avatar ? (
              <img
                src={session.user.avatar}
                alt=""
                className="w-8 h-8 rounded-lg object-cover border border-white/10"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(142 71% 45%), hsl(262 83% 58%))",
                }}
              >
                {session?.user?.name?.[0]?.toUpperCase() || "A"}
              </div>
            )}
            <span
              className="text-sm font-medium hidden sm:inline"
              style={{ color: "hsl(var(--color-text-primary))" }}
            >
              {session?.user?.name || "Admin"}
            </span>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfile && (
            <>
              {/* Back drop to click away */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowProfile(false)}
              />
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 shadow-2xl z-50 p-1.5 animate-slide-down"
                style={{
                  background: "hsl(var(--color-bg-card))",
                }}
              >
                {/* Header info */}
                <div className="px-3 py-2.5">
                  <p className="text-xs font-bold text-white truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {session?.user?.email}
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {session?.user?.role?.replace("_", " ")}
                  </span>
                </div>

                <div className="border-t border-white/5 my-1" />

                {/* Submenu links */}
                <Link
                  href="/admin/my-account"
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-white/[0.04] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  My Account
                </Link>

                <button
                  onClick={() => {
                    setShowProfile(false);
                    signOut({ callbackUrl: "/admin/login" });
                  }}
                  className="flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
