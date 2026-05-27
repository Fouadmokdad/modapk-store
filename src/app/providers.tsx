"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/hooks/useLocale";
import { ThemeProvider } from "@/hooks/useTheme";
import type { Locale } from "@/lib/i18n";


export function Providers({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LocaleProvider initialLocale={locale}>
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

