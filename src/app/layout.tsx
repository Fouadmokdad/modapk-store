import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { generateBaseMetadata, generateOrganizationJsonLd, generateWebSiteJsonLd } from "@/lib/seo";
import { cookies } from "next/headers";
import type { Locale } from "@/lib/i18n";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as "en" | "ar";
  const { getSiteSettings } = await import("@/lib/settings");
  const settings = await getSiteSettings();
  
  const siteTitle = locale === "ar" ? settings.siteTitle.ar : settings.siteTitle.en;
  const siteDescription = locale === "ar" ? settings.siteDescription.ar : settings.siteDescription.en;

  return generateBaseMetadata({
    title: {
      default: `${siteTitle} — ${locale === "ar" ? "تحميل تطبيقات مهكرة" : "Download Premium MOD APKs"}`,
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    metadataBase: new URL(settings.siteUrl),
    alternates: {
      canonical: settings.siteUrl,
      languages: {
        "en": settings.siteUrl,
        "ar": settings.siteUrl,
        "x-default": settings.siteUrl,
      },
    },
  }, locale);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get("locale")?.value || "en") as Locale;
  const dir = locale === "ar" ? "rtl" : "ltr";

  const { getSiteSettings } = await import("@/lib/settings");
  const settings = await getSiteSettings();
  const enTitle = settings.siteTitle.en;
  const siteUrl = settings.siteUrl;

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for Arabic font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#141619" />
        {/* Inline script to prevent flash of wrong theme */}
        <Script
          id="theme-prevent-flash"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var resolved = theme;
                  if (theme === 'system') {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(resolved);
                  document.documentElement.setAttribute('data-theme', resolved);
                  var locale = localStorage.getItem('locale') || 'en';
                  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.lang = locale;
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {/* Global Organization & WebSite Searchbox Structured Data rendered stable in body to prevent head hydration conflicts */}
        <script
          id="jsonld-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateOrganizationJsonLd(enTitle, siteUrl)),
          }}
        />
        <script
          id="jsonld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateWebSiteJsonLd(enTitle, siteUrl)),
          }}
        />

        <Providers locale={locale}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

