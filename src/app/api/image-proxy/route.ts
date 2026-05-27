// =============================================================================
// API Route — CDN Image Proxy
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { isAllowedImageHost } from "@/lib/importers/image-safety";
import crypto from "crypto";

const PROXY_SIGNING_KEY = process.env.NEXTAUTH_SECRET || "default-secure-image-signing-key-value-must-change";

/**
 * Creates a signed signature token for an image URL.
 */
export function signImageProxyUrl(url: string): string {
  return crypto.createHmac("sha256", PROXY_SIGNING_KEY).update(url).digest("hex");
}

/**
 * GET /api/image-proxy?url=...&sig=...
 * Proxies, caches, and protects external images from Next.js whitelist restrictions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  const sig = searchParams.get("sig");

  if (!targetUrl) {
    return NextResponse.json({ error: "Missing required url parameter." }, { status: 400 });
  }

  // 1. Domain Allowlist Check
  if (!isAllowedImageHost(targetUrl)) {
    return NextResponse.json({ error: "Host domain is not in the explicit image allowlist." }, { status: 403 });
  }

  // 2. Request Signature Verification (SSRF / Abuse protection)
  if (process.env.NODE_ENV === "production" && sig) {
    const expectedSig = signImageProxyUrl(targetUrl);
    if (sig !== expectedSig) {
      return NextResponse.json({ error: "Security signature mismatch." }, { status: 403 });
    }
  }

  try {
    // 3. Fetch image safely with connection timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "MODAPKStoreImageProxy/1.1 (+https://modapkstore.com; safety-verified)",
        "Accept": "image/*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({ error: `External server returned status code: ${res.status}` }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Target URL does not point to a valid image file." }, { status: 400 });
    }

    // 4. Pipe image buffer
    const buffer = await res.arrayBuffer();
    
    // Create response with client and edge caching headers (Cache-Control)
    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json({ error: "Image fetch request timed out." }, { status: 504 });
    }
    return NextResponse.json({ error: `Image proxy failure: ${err.message}` }, { status: 500 });
  }
}
