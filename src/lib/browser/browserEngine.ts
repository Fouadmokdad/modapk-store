// =============================================================================
// Browser Engine — Playwright Headless Browser Automation (Stealth)
// =============================================================================
import { chromium, Browser, BrowserContext, Page } from "playwright";

let browserInstance: Browser | null = null;
let contextInstance: BrowserContext | null = null;

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Launches the Playwright Chromium browser with stealth configuration.
 */
export async function launchBrowser(): Promise<Browser> {
  if (browserInstance) {
    return browserInstance;
  }

  // Launch browser with anti-detection args
  browserInstance = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-infobars",
      "--window-position=0,0",
      "--ignore-certifcate-errors",
      "--ignore-certifcate-errors-spki-list",
    ],
  });

  return browserInstance;
}

/**
 * Closes the active browser and context instances.
 */
export async function closeBrowser(): Promise<void> {
  if (contextInstance) {
    await contextInstance.close();
    contextInstance = null;
  }
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Navigates to the target URL using real browser context, wait rules, and returns fully hydrated DOM.
 */
export async function extractRenderedHTML(url: string): Promise<string> {
  const browser = await launchBrowser();

  // Create context with custom viewport, user agent and languages to simulate normal user
  if (!contextInstance) {
    contextInstance = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
      timezoneId: "America/New_York",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      },
    });

    // Stealth: override navigator.webdriver
    await contextInstance.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });
  }

  const page = await contextInstance.newPage();

  try {
    // Navigate with human-like timing
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Human-like delay after navigation
    await page.waitForTimeout(1500 + Math.random() * 1500);

    // Wait for DOM hydration / network idle
    try {
      await page.waitForLoadState("networkidle", { timeout: 8000 });
    } catch {
      // Ignore networkidle timeouts, page may poll continuously
    }

    // Check for Cloudflare challenge / JS challenges and wait
    const isCloudflare = await page.evaluate(() => {
      const text = document.body.innerText || "";
      return text.includes("Cloudflare") || text.includes("checking your browser") || text.includes("Verify you are human") || !!document.querySelector("#challenge-running");
    });

    if (isCloudflare) {
      console.log(`Cloudflare detected on ${url}, waiting for challenge to solve...`);
      // Wait up to 12 seconds for the challenge page to refresh or redirect
      await page.waitForTimeout(10000);
    }

    // Capture the fully rendered HTML DOM
    const html = await page.content();
    return html;
  } finally {
    await page.close();
  }
}
