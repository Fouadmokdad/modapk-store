// =============================================================================
// Importer Module — Hostname Normalization Utility
// =============================================================================

/**
 * Normalizes any URL input string to extract a consistent lowercase domain name.
 * Strips 'www.', trailing slashes, and paths, keeping only the raw canonical host.
 * Example: "https://GameDVA.com/some-app/" -> "gamedva.com"
 */
export function normalizeDomain(urlStr: string): string {
  try {
    const trimmed = urlStr.trim();
    if (!trimmed) return "";
    
    // Add protocol prefix if missing so URL parser doesn't crash
    let formatted = trimmed;
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = "https://" + formatted;
    }
    
    const urlObj = new URL(formatted);
    let host = urlObj.hostname.toLowerCase();
    
    // Strip leading www.
    if (host.startsWith("www.")) {
      host = host.substring(4);
    }
    
    return host;
  } catch (error) {
    console.error("Failed to normalize domain for URL:", urlStr, error);
    return "";
  }
}
