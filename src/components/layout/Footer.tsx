"use client";

// =============================================================================
// Public Footer — Premium & Site Settings Powered
// =============================================================================
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/hooks/useLocale";

export function Footer() {
  const { locale, t } = useLocale();
  const year = new Date().getFullYear();
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((json) => {
        if (json && json.data) {
          setSettings(json.data);
        }
      })
      .catch((err) => console.error("Failed to load footer settings:", err));
  }, []);

  const txt = (obj: { en: string; ar: string } | null) =>
    obj ? (locale === "ar" && obj.ar ? obj.ar : obj.en) : "";

  const footerSections = [
    {
      title: t("footer.explore"),
      links: [
        { label: t("nav.apps"), href: "/apps" },
        { label: t("nav.games"), href: "/games" },
        { label: t("nav.categories"), href: "/categories" },
        { label: t("footer.trending"), href: "/trending" },
      ],
    },
    {
      title: t("footer.legal"),
      links: [
        { label: t("footer.disclaimer"), href: "/disclaimer" },
        { label: t("footer.privacy"), href: "/privacy" },
        { label: t("footer.terms"), href: "/terms" },
        { label: t("footer.dmca"), href: "/dmca" },
      ],
    },
  ];

  return (
    <footer style={{ background: "hsl(var(--color-bg-secondary))", borderTop: "1px solid hsl(var(--color-border))" }}>
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-brand)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <span className="text-lg font-bold" style={{ color: "hsl(var(--color-text-primary))" }}>
                {txt(settings?.siteTitle) ? (
                  <span>
                    {txt(settings.siteTitle).split(" ")[0]}
                    {txt(settings.siteTitle).split(" ").slice(1).length > 0 && (
                      <span className="text-gradient"> {txt(settings.siteTitle).split(" ").slice(1).join(" ")}</span>
                    )}
                  </span>
                ) : (
                  <span>
                    Mod<span className="text-gradient">APK</span>
                  </span>
                )}
              </span>
            </Link>
            <p className="text-sm max-w-sm mb-6" style={{ color: "hsl(var(--color-text-tertiary))", lineHeight: 1.7 }}>
              {txt(settings?.siteDescription) || t("footer.description")}
            </p>
            <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: "hsl(var(--color-warning) / 0.06)", color: "hsl(var(--color-warning))", border: "1px solid hsl(var(--color-warning) / 0.1)" }}>
              ⚠️ {txt(settings?.disclaimer) || t("footer.disclaimerShort")}
            </div>

            {/* Social Links */}
            {settings?.socialLinks && (
              <div className="flex gap-4 mt-6">
                {settings.socialLinks.twitter && (
                  <a
                    href={settings.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                    style={{ color: "hsl(var(--color-text-tertiary))" }}
                    aria-label="Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {settings.socialLinks.facebook && (
                  <a
                    href={settings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                    style={{ color: "hsl(var(--color-text-tertiary))" }}
                    aria-label="Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                    </svg>
                  </a>
                )}
                {settings.socialLinks.github && (
                  <a
                    href={settings.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-white"
                    style={{ color: "hsl(var(--color-text-tertiary))" }}
                    aria-label="GitHub"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.48-10-10-10z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Link Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-4" style={{ color: "hsl(var(--color-text-primary))" }}>
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-all"
                      style={{ color: "hsl(var(--color-text-tertiary))" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "hsl(var(--color-text-primary))"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "hsl(var(--color-text-tertiary))"; }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid hsl(var(--color-border))" }}
        >
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            © {year} {txt(settings?.siteTitle) || "ModAPK Store"}. {txt(settings?.footerText) || t("footer.rights")}
          </p>
          <p className="text-xs" style={{ color: "hsl(var(--color-text-tertiary))" }}>
            {t("footer.notAffiliated")}
          </p>
        </div>
      </div>
    </footer>
  );
}
