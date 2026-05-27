// =============================================================================
// API Endpoint — Generate short-lived download token
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "download-secret-key-123456";

/**
 * POST /api/download/token — Generates a short-lived cryptographically signed token
 * to prevent download direct hotlinking and ensure user completed the countdown.
 */
export async function POST(request: NextRequest) {
  try {
    const { linkId, mirrorId } = await request.json();
    const targetId = mirrorId || linkId;
    if (!targetId) {
      return NextResponse.json({ error: "linkId or mirrorId is required" }, { status: 400 });
    }

    // Origin/Referer verification
    const referer = request.headers.get("referer");
    const host = request.headers.get("host") || "";
    if (referer) {
      try {
        if (!referer.includes(host)) {
          return NextResponse.json({ error: "Security Violation: Referer host does not match origin host" }, { status: 403 });
        }
      } catch {
        return NextResponse.json({ error: "Security Violation: Malformed referer header" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Security Violation: Direct downloads are prohibited. Enforce countdown page viewing." }, { status: 403 });
    }

    // Generate token: targetId + expiresAt + signature
    const expiresAt = Date.now() + 60 * 1000; // 60 seconds lifetime
    const dataToSign = `${targetId}:${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", SECRET)
      .update(dataToSign)
      .digest("hex");

    const token = Buffer.from(`${targetId}:${expiresAt}:${signature}`).toString("base64");

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("POST /api/download/token error:", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
