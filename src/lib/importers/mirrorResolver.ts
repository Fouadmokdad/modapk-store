// =============================================================================
// Importer Module — Download Mirror Resolver
// =============================================================================
import { getStrategyForDomain } from "./sourceStrategies";
import { normalizeDomain } from "./normalize";
import { launchBrowser } from "../browser/browserEngine";

export interface ResolvedMirror {
  host: string;
  url: string;
}

const MIRROR_HOSTS = [
  { name: "Mediafire", patterns: ["mediafire.com"] },
  { name: "Mega", patterns: ["mega.nz", "mega.co.nz"] },
  { name: "Google Drive", patterns: ["drive.google.com", "docs.google.com"] },
  { name: "Dropbox", patterns: ["dropbox.com"] },
  { name: "OneDrive", patterns: ["onedrive.live.com", "1drv.ms"] },
  { name: "Telegram", patterns: ["t.me", "telegram.me"] },
  { name: "APKPure", patterns: ["apkpure.com"] },
  { name: "APKCombo", patterns: ["apkcombo.com"] },
  { name: "Direct APK CDN", patterns: [".apk"] },
];

/**
 * Classifies the hosting service of a given URL.
 */
export function classifyMirrorHost(url: string): string {
  const lowerUrl = url.toLowerCase();
  for (const host of MIRROR_HOSTS) {
    if (host.patterns.some(pat => lowerUrl.includes(pat))) {
      return host.name;
    }
  }
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return "Unknown Mirror";
  }
}

/**
 * Automatically follows nested redirects, countdowns, and clicks download buttons
 * using a headless browser context to capture the true destination link.
 */
export async function resolveFinalMirrorUrl(initialUrl: string): Promise<ResolvedMirror> {
  const host = classifyMirrorHost(initialUrl);

  // If it's already a direct link or a known cloud storage provider, return it directly
  if (
    host === "Mediafire" ||
    host === "Mega" ||
    host === "Google Drive" ||
    host === "Dropbox" ||
    host === "OneDrive" ||
    host === "Telegram"
  ) {
    return { host, url: initialUrl };
  }

  // If it's an intermediate page that might contain countdown timers or click buttons, resolve using Playwright
  console.log(`[MirrorResolver] Resolving intermediate landing page: ${initialUrl}`);
  const browser = await launchBrowser();
  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  try {
    let finalUrl = initialUrl;
    
    // Listen for navigation / redirect events
    page.on("framenavigated", frame => {
      if (frame === page.mainFrame()) {
        finalUrl = frame.url();
      }
    });

    await page.goto(initialUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(2000);

    // 1. Wait for countdown timers if any are visible on screen
    const hasCountdown = await page.evaluate(() => {
      const text = document.body.innerText || "";
      const matches = text.match(/wait|seconds|counting|downloading/i);
      return !!matches;
    });

    if (hasCountdown) {
      console.log("[MirrorResolver] Possible countdown timer detected, waiting 6 seconds...");
      await page.waitForTimeout(6000);
    }

    // 2. Scan for and click intermediate download buttons
    const clicked = await page.evaluate(() => {
      // Find elements that look like download buttons
      const buttons = Array.from(document.querySelectorAll("a, button, input[type='button'], input[type='submit']"));
      const downloadBtn = buttons.find(el => {
        const text = (el.textContent || (el as HTMLInputElement).value || "").toLowerCase().trim();
        const href = el.getAttribute("href") || "";
        return (
          (text.includes("download") || text.includes("get link") || text.includes("start download") || text.includes("تحميل")) &&
          !href.startsWith("#") &&
          !href.startsWith("javascript")
        );
      });

      if (downloadBtn) {
        if (downloadBtn.tagName.toLowerCase() === "a" && downloadBtn.getAttribute("href")) {
          window.location.href = downloadBtn.getAttribute("href")!;
          return true;
        } else {
          (downloadBtn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log("[MirrorResolver] Intermediate download button clicked, waiting for redirect...");
      await page.waitForTimeout(4000);
    }

    // Return the final navigated URL
    return {
      host: classifyMirrorHost(finalUrl),
      url: finalUrl,
    };
  } catch (err: any) {
    console.error(`[MirrorResolver] Failed to resolve final mirror for ${initialUrl}: ${err.message}`);
    return { host, url: initialUrl }; // fallback
  } finally {
    await page.close();
    await context.close();
  }
}

/**
 * Scrapes all raw mirror link coordinates from page HTML content.
 */
export function extractRawMirrorLinks(html: string): string[] {
  const matches: string[] = [];
  
  // Extract links matching known storage hosts or apk extensions
  const regex = /href=["'](https?:\/\/[^"']+)["']/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const url = match[1];
    const host = classifyMirrorHost(url);
    const lower = url.toLowerCase();
    
    // Save link if it belongs to one of our target hosts
    const isValidMirror = MIRROR_HOSTS.some(m => lower.includes(m.patterns[0])) || lower.endsWith(".apk");
    if (isValidMirror && !matches.includes(url)) {
      matches.push(url);
    }
  }

  return matches;
}
