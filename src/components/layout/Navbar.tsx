"use client";

// =============================================================================
// Public Navbar — APK Platform Style
// =============================================================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/hooks/useLocale";
import { useTheme } from "@/hooks/useTheme";

const navLinks = [
  { href: "/", labelKey: "nav.home" },
  { href: "/apps", labelKey: "nav.apps" },
  { href: "/games", labelKey: "nav.games" },
  { href: "/categories", labelKey: "nav.categories" },
];

export function Navbar() {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all"
        style={{
          height: "var(--header-height)",
          background: scrolled ? "hsl(var(--color-bg-primary) / 0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid hsl(var(--color-border) / 0.5)" : "1px solid transparent",
        }}
      >
        <div className="container h-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--gradient-brand)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight hidden sm:inline" style={{ color: "hsl(var(--color-text-primary))" }}>
              Mod<span className="text-gradient">APK</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                style={{
                  color: isActive(link.href) ? "hsl(var(--color-accent))" : "hsl(var(--color-text-secondary))",
                  background: isActive(link.href) ? "hsl(var(--color-accent-soft))" : "transparent",
                }}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          {/* Search + Actions */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="btn-ghost rounded-xl p-2.5"
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Language */}
            <button
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="btn-ghost rounded-xl px-2.5 py-2 text-xs font-semibold"
            >
              {locale === "en" ? "عربي" : "EN"}
            </button>

            {/* Theme */}
            <button
              onClick={toggleTheme}
              className="btn-ghost rounded-xl p-2.5"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {/* Mobile menu */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="btn-ghost rounded-xl p-2.5 lg:hidden"
              aria-label="Menu"
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Search overlay */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 fade-in" style={{ background: "hsl(var(--color-bg-primary) / 0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid hsl(var(--color-border))" }}>
            <form onSubmit={handleSearch} className="container py-4">
              <div className="search-bar max-w-2xl mx-auto">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--color-text-tertiary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search.placeholder")}
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color: "hsl(var(--color-text-primary))" }}
                />
                <button type="submit" className="btn-primary py-2.5 px-5 text-xs rounded-xl">
                  {t("search.button")}
                </button>
              </div>
            </form>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden fade-in" onClick={() => setMobileOpen(false)} />
          <div
            className="fixed top-0 right-0 bottom-0 z-50 w-72 lg:hidden slide-in-right"
            style={{ background: "hsl(var(--color-bg-card))" }}
          >
            <div className="p-6 space-y-2 mt-16">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: isActive(link.href) ? "hsl(var(--color-accent))" : "hsl(var(--color-text-secondary))",
                    background: isActive(link.href) ? "hsl(var(--color-accent-soft))" : "transparent",
                  }}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="pt-4" style={{ borderTop: "1px solid hsl(var(--color-border))" }}>
                <Link href="/search" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium" style={{ color: "hsl(var(--color-text-secondary))" }}>
                  🔍 {t("nav.search")}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer */}
      <div style={{ height: "var(--header-height)" }} />
    </>
  );
}
