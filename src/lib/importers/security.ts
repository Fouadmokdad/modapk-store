// =============================================================================
// Importer Module — SSRF and Request Safety Layer
// =============================================================================
import dns from "dns";
import { normalizeDomain } from "./normalize";
import { ImportedAppData, ImporterProtectedSourceError } from "./types";

export const ALLOWED_DOMAINS = [
  "liteapks.com",
  "apkpure.com",
  "apkcombo.com",
  "uptodown.com",
  "happymod.com",
  "modyolo.com",
  "getmodsapk.com",
  "gamedva.com"
];

/**
 * Checks if a normalized host domain is in the explicit parser allowlist.
 */
export function isDomainAllowed(domain: string): boolean {
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Returns true if an IP address resides in a loopback or private network range.
 * Supports IPv4 and IPv6 network blocks (SSRF Protection).
 */
export function isPrivateIp(ip: string): boolean {
  const trimmed = ip.trim();
  const lower = trimmed.toLowerCase();

  // Handle IPv4-mapped IPv6 address (e.g., ::ffff:192.168.1.1)
  if (lower.startsWith("::ffff:")) {
    const ipv4 = trimmed.substring(7);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ipv4)) {
      return isPrivateIp(ipv4);
    }
  }

  // IPv4 Check
  if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
    const parts = trimmed.split(".").map((x) => parseInt(x, 10));
    if (parts.length !== 4 || parts.some(isNaN)) return true; // Treat invalid as unsafe/private
    const [o1, o2, o3, o4] = parts;

    if (o1 === 0) return true; // 0.0.0.0/8 (current network / local)
    if (o1 === 10) return true; // 10.0.0.0/8 (private)
    if (o1 === 127) return true; // 127.0.0.0/8 (loopback)
    if (o1 === 169 && o2 === 254) return true; // 169.254.0.0/16 (link-local)
    if (o1 === 192 && o2 === 168) return true; // 192.168.0.0/16 (private)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12 (private)
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // 100.64.0.0/10 (shared CGNAT)
    if (o1 === 192 && o2 === 0 && o3 === 0) return true; // 192.0.0.0/24 (IETF assignment)
    if (o1 === 192 && o2 === 0 && o3 === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
    if (o1 === 192 && o2 === 88 && o3 === 99) return true; // 192.88.99.0/24 (6to4 relay anycast)
    if (o1 === 198 && o2 >= 18 && o2 <= 19) return true; // 198.18.0.0/15 (benchmarking)
    if (o1 === 198 && o2 === 51 && o3 === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
    if (o1 === 203 && o2 === 0 && o3 === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
    if (o1 >= 224 && o1 <= 239) return true; // 224.0.0.0/4 (multicast)
    if (o1 >= 240) return true; // 240.0.0.0/4 (reserved/broadcast)

    return false;
  }

  // IPv6 Check
  if (
    lower === "::" ||
    lower === "::1" ||
    lower === "0:0:0:0:0:0:0:0" ||
    lower === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }

  const parts6 = lower.split(":");
  if (parts6.length > 0) {
    const firstGroup = parts6[0];
    const parsed = parseInt(firstGroup, 16);
    if (!isNaN(parsed)) {
      if (parsed >= 0xfc00 && parsed <= 0xfdff) return true; // Unique Local fc00::/7
      if (parsed >= 0xfe80 && parsed <= 0xfebf) return true; // Link-Local fe80::/10
      if (parsed >= 0xfec0 && parsed <= 0xfeff) return true; // Deprecated Site-Local fec0::/10
      if (parsed >= 0xff00) return true; // Multicast ff00::/8
      if (parsed === 0x0100) return true; // Discard-only 100::/64
    }
  }

  return false;
}

/**
 * Fetches HTML from a target URL with robust security shields:
 * 1. Strictly allows only http: and https: protocols
 * 2. Resolves DNS to block private IP targets (SSRF Prevention)
 * 3. Connects with strict timeout (8 seconds)
 * 4. Enforces response limit (max 2MB body size) via chunk-by-chunk stream reader
 * 5. Manually handles redirects up to 3 deep, re-resolving DNS and re-checking IPs (Anti-DNS Rebinding)
 * 6. Verifies content type is strictly text/html or application/xhtml+xml
 */
export async function fetchSafeHtml(urlStr: string, redirectCount = 0): Promise<string> {
  if (redirectCount > 3) {
    throw new Error("SSRF Block: Too many HTTP redirects encountered (maximum 3 allowed).");
  }

  // Parse URL safely
  let urlObj: URL;
  try {
    urlObj = new URL(urlStr);
  } catch {
    throw new Error("Validation Error: Invalid URL structure.");
  }

  // Strictly check protocols (Allow only http: and https:)
  const protocol = urlObj.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    throw new Error(`SSRF Block: Protocol "${protocol}" is illegal. Only "http:" and "https:" are permitted.`);
  }

  const domain = normalizeDomain(urlStr);
  if (!isDomainAllowed(domain)) {
    throw new Error(`SSRF Block: Domain "${domain || "unknown"}" is not in the explicit allowlist.`);
  }

  const hostname = urlObj.hostname;

  // DNS pre-resolution & private IP validation (Anti-DNS Rebinding)
  // Resolve ALL IP addresses returned to verify none of them fall into private ranges
  let addresses: dns.LookupAddress[] = [];
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch (err) {
    throw new Error(`DNS Resolution Failure: Failed to resolve address for hostname "${hostname}".`);
  }

  if (!addresses || addresses.length === 0) {
    throw new Error(`DNS Resolution Failure: No IP addresses resolved for "${hostname}".`);
  }

  for (const entry of addresses) {
    if (isPrivateIp(entry.address)) {
      throw new Error(`SSRF Block: Target host "${hostname}" resolved to illegal private IP "${entry.address}".`);
    }
  }

  // Execute fetch with connection timeout abort signals
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 8000);

  try {
    const res = await fetch(urlStr, {
      method: "GET",
      headers: {
        "User-Agent": "MODAPKStoreImporter/1.1 (+https://modapkstore.com/importer-bot; safety-verified)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "manual", // Intercept redirects manually to protect against DNS rebinding / intermediate private IP hops
    });

    clearTimeout(timeoutId);

    // Intercept redirects and validate them completely
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get("location");
      if (!location) {
        throw new Error("Redirect response missing location header.");
      }
      const absoluteRedirectUrl = new URL(location, urlStr).toString();
      // Re-resolve and re-verify everything for the redirect URL recursively
      return fetchSafeHtml(absoluteRedirectUrl, redirectCount + 1);
    }

    // Graceful Protected Source Handling (HTTP 401, 403, 429)
    if ([401, 403, 429].includes(res.status)) {
      let reason = "This source blocks automated metadata extraction.";
      let suggestion = "Try another source or import manually.";
      if (res.status === 401) {
        reason = "Authentication required by source.";
      } else if (res.status === 403) {
        reason = "Access forbidden due to anti-bot challenge.";
        suggestion = "LiteAPKs or other sources may be blocking scrapers. Import manually or choose another source.";
      } else if (res.status === 429) {
        reason = "Rate limited by target domain (Too Many Requests).";
        suggestion = "Please wait a moment before retrying this scrape.";
      }
      throw new ImporterProtectedSourceError(domain, res.status, reason, suggestion);
    }

    if (!res.ok) {
      throw new Error(`Source Server Error: Server responded with status code ${res.status}`);
    }

    // Verify content type is strictly text/html or application/xhtml+xml
    const contentType = res.headers.get("content-type") || "";
    const cleanContentType = contentType.toLowerCase().split(";")[0].trim();
    if (cleanContentType !== "text/html" && cleanContentType !== "application/xhtml+xml") {
      throw new Error(`Invalid Response: Content-Type "${cleanContentType}" is rejected. Only text/html and application/xhtml+xml are allowed.`);
    }

    // Read streaming payload chunk-by-chunk to block full buffering of oversized payloads
    const maxSizeBytes = 2 * 1024 * 1024; // 2MB limit
    const reader = res.body?.getReader();

    if (!reader) {
      // Fallback text read
      const text = await res.text();
      if (text.length > maxSizeBytes) {
        throw new Error("Response Limit: HTML payload exceeds maximum size limit of 2MB.");
      }
      // Intercept anti-bot challenge pages
      const lowerHtml = text.toLowerCase();
      if (
        lowerHtml.includes("cloudflare") && 
        (lowerHtml.includes("cf-challenge") || lowerHtml.includes("challenge-platform") || lowerHtml.includes("ray id") || lowerHtml.includes("just a moment"))
      ) {
        throw new ImporterProtectedSourceError(
          domain, 
          403, 
          "Cloudflare challenge page encountered.", 
          "Cloudflare anti-bot blocks this automated scrape. Try another mirror or manually edit draft."
        );
      }
      if (lowerHtml.includes("captcha") || lowerHtml.includes("robot verification") || lowerHtml.includes("please enable javascript") || lowerHtml.includes("anti-bot")) {
        throw new ImporterProtectedSourceError(
          domain,
          403,
          "Anti-bot page verification challenge.",
          "The site is enforcing a CAPTCHA/JavaScript validation. Please manually input details."
        );
      }
      return text;
    }

    let chunks: Uint8Array[] = [];
    let receivedLength = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (value) {
        receivedLength += value.length;
        if (receivedLength > maxSizeBytes) {
          throw new Error("Response Limit: Fetch aborted as payload exceeds maximum size limit of 2MB.");
        }
        chunks.push(value);
      }
    }

    const joined = new Uint8Array(receivedLength);
    let position = 0;
    for (const chunk of chunks) {
      joined.set(chunk, position);
      position += chunk.length;
    }

    const htmlText = new TextDecoder("utf-8").decode(joined);
    
    // Check for Cloudflare / anti-bot challenge pages in decoded text
    const lowerHtml = htmlText.toLowerCase();
    if (
      lowerHtml.includes("cloudflare") && 
      (lowerHtml.includes("cf-challenge") || lowerHtml.includes("challenge-platform") || lowerHtml.includes("ray id") || lowerHtml.includes("just a moment"))
    ) {
      throw new ImporterProtectedSourceError(
        domain, 
        403, 
        "Cloudflare challenge page encountered.", 
        "Cloudflare anti-bot blocks this automated scrape. Try another mirror or manually edit draft."
      );
    }
    if (lowerHtml.includes("captcha") || lowerHtml.includes("robot verification") || lowerHtml.includes("please enable javascript") || lowerHtml.includes("anti-bot")) {
      throw new ImporterProtectedSourceError(
        domain,
        403,
        "Anti-bot page verification challenge.",
        "The site is enforcing a CAPTCHA/JavaScript validation. Please manually input details."
      );
    }

    return htmlText;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request Timeout: Third-party server failed to respond within 8 seconds.");
    }
    throw error;
  }
}

// =============================================================================
// In-Memory Rate Limiting
// =============================================================================
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitCache = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string, limit = 15, windowMs = 60 * 1000): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitCache.get(ip) || { timestamps: [] };

  // Filter out timestamps older than the window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetTime = oldest + windowMs;
    return { allowed: false, remaining: 0, resetTime };
  }

  record.timestamps.push(now);
  rateLimitCache.set(ip, record);

  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetTime: now + windowMs,
  };
}

// =============================================================================
// In-Memory Preview Caching
// =============================================================================
interface CacheEntry {
  data: ImportedAppData;
  timestamp: number;
}
const previewCache = new Map<string, CacheEntry>();

export function getCachedPreview(url: string): ImportedAppData | null {
  const entry = previewCache.get(url);
  if (entry && Date.now() - entry.timestamp < 5 * 60 * 1000) {
    return entry.data;
  }
  return null;
}

export function setCachedPreview(url: string, data: ImportedAppData): void {
  previewCache.set(url, { data, timestamp: Date.now() });
}

export function clearPreviewCache(): void {
  previewCache.clear();
}
