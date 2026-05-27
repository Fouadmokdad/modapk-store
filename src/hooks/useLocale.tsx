"use client";

// =============================================================================
// Locale Provider — Manages language and direction (RTL/LTR)
// =============================================================================
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Locale } from "@/lib/i18n";
import { defaultLocale, getDirection, localeConfig } from "@/lib/i18n";

// Static imports for translations to avoid dynamic client fetches and hydration flashes
import en from "../../public/locales/en.json";
import ar from "../../public/locales/ar.json";

const translationsMap: Record<Locale, Record<string, any>> = { en, ar };

interface LocaleContextType {
  locale: Locale;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  getLocalizedText: (field: Record<string, string> | string | null | undefined) => string;
}

const LocaleContext = createContext<LocaleContextType | null>(null);

export function LocaleProvider({
  children,
  initialLocale = defaultLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const dir = getDirection(locale);
  const translations = translationsMap[locale] || en;

  // Keep document attributes in sync with language and direction changes
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [locale, dir]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocaleState(newLocale);
    // Persist in localStorage for fallback
    localStorage.setItem("locale", newLocale);
    // Set cookie so that next server render immediately picks up the new locale
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string>): string => {
      const keys = key.split(".");
      let value: any = translations;

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k];
        } else {
          return key;
        }
      }

      let result = typeof value === "string" ? value : key;

      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          result = result.replace(new RegExp(`{${paramKey}}`, "g"), paramValue);
        }
      }

      return result;
    },
    [translations]
  );

  const getLocalizedText = useCallback(
    (field: Record<string, string> | string | null | undefined): string => {
      if (!field) return "";
      if (typeof field === "string") return field;
      return field[locale] || field["en"] || "";
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, dir, setLocale, t, getLocalizedText }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}

