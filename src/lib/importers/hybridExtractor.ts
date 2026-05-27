// =============================================================================
// Importer Module — Advanced Hybrid Extractor
// =============================================================================
import { fetchSafeHtml } from "./security";
import { extractRenderedHTML } from "../browser/browserEngine";

export interface ExtractionTelemetry {
  method: "LIGHTWEIGHT_SCRAPE" | "REAL_BROWSER_AUTOMATION";
  url: string;
  timestamp: string;
  htmlLength: number;
  cloudflareChallenged: boolean;
  attempts: number;
}

/**
 * Advanced HTML extractor:
 * 1. Tries standard axios/fetch safe scraper.
 * 2. If blocked by anti-bot, Cloudflare, or throws ImporterProtectedSourceError:
 * 3. Launches headless Playwright browser to bypass blocks and render DOM.
 * 4. Saves extraction source telemetry.
 */
export async function hybridFetchHtml(url: string): Promise<{ html: string; telemetry: ExtractionTelemetry }> {
  const timestamp = new Date().toISOString();
  let attempts = 1;

  try {
    // Attempt 1: Lightweight fetchSafeHtml scraper
    console.log(`[HybridExtractor] Attempting lightweight scrape for: ${url}`);
    const html = await fetchSafeHtml(url);
    
    // Check if the returned page looks like a cloudflare challenge page anyway
    const lowerHtml = html.toLowerCase();
    const isCF = lowerHtml.includes("cloudflare") && 
      (lowerHtml.includes("cf-challenge") || lowerHtml.includes("challenge-platform") || lowerHtml.includes("ray id") || lowerHtml.includes("just a moment"));

    if (isCF) {
      throw new Error("Cloudflare challenge page detected in lightweight fetch.");
    }

    return {
      html,
      telemetry: {
        method: "LIGHTWEIGHT_SCRAPE",
        url,
        timestamp,
        htmlLength: html.length,
        cloudflareChallenged: false,
        attempts,
      },
    };
  } catch (err: any) {
    console.log(`[HybridExtractor] Lightweight scraper blocked or failed: ${err.message || err}. Falling back to Playwright real browser automation...`);
    attempts++;

    try {
      // Attempt 2: Real Browser headless automation
      const html = await extractRenderedHTML(url);
      
      const lowerHtml = html.toLowerCase();
      const cloudflareChallenged = lowerHtml.includes("cloudflare") && 
        (lowerHtml.includes("cf-challenge") || lowerHtml.includes("challenge-platform") || lowerHtml.includes("ray id") || lowerHtml.includes("just a moment"));

      return {
        html,
        telemetry: {
          method: "REAL_BROWSER_AUTOMATION",
          url,
          timestamp,
          htmlLength: html.length,
          cloudflareChallenged,
          attempts,
        },
      };
    } catch (browserErr: any) {
      console.error(`[HybridExtractor] Playwright real browser fallback failed: ${browserErr.message || browserErr}`);
      throw new Error(`Hybrid scraping pipeline failed completely. Lightweight error: ${err.message}. Browser error: ${browserErr.message}`);
    }
  }
}
