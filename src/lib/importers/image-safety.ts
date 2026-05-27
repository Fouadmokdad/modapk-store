// =============================================================================
// Importer Module — Browser-Safe Image Security Helper
// =============================================================================

/**
 * Verifies if an external image URL hostname is whitelisted under Next.js remotePatterns.
 * Built to be pure TS and browser-safe, allowing client components to import it safely.
 */
export function isAllowedImageHost(urlStr: string): boolean {
  if (!urlStr) return false;
  try {
    const url = new URL(urlStr);
    const host = url.hostname.toLowerCase();
    
    const allowedHosts = [
      "play-lh.googleusercontent.com",
      "res.cloudinary.com",
      "lh3.googleusercontent.com",
      "modyolo.com",
      "www.modyolo.com",
      "liteapks.com",
      "www.liteapks.com",
      "getmodsapk.com",
      "www.getmodsapk.com",
      "gamedva.com",
      "www.gamedva.com",
      "apkpure.com",
      "www.apkpure.com",
      "apkcombo.com",
      "www.apkcombo.com",
      "happymod.com",
      "www.happymod.com"
    ];

    if (allowedHosts.includes(host)) {
      return true;
    }

    // Match uptodown.com subdomains (*.uptodown.com and uptodown.com)
    if (host === "uptodown.com" || host.endsWith(".uptodown.com")) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
