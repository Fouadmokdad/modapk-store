import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

const SECRET = process.env.NEXTAUTH_SECRET || "download-secret-key-123456";

/**
 * GET /api/download?mirrorId=xxx&token=yyy — Track download event and redirect externally
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mirrorId = searchParams.get("mirrorId");
    const linkId = searchParams.get("linkId");
    const token = searchParams.get("token");

    const targetId = mirrorId || linkId;

    if (!targetId) {
      return NextResponse.json(
        { error: "linkId or mirrorId is required" },
        { status: 400 }
      );
    }

    // Decrypt and verify token
    let isTokenValid = false;
    if (token) {
      try {
        const decoded = Buffer.from(token, "base64").toString("utf-8");
        const [tId, tExpiresAt, tSignature] = decoded.split(":");

        if (tId === targetId && parseInt(tExpiresAt) > Date.now()) {
          const dataToSign = `${tId}:${tExpiresAt}`;
          const expectedSignature = crypto
            .createHmac("sha256", SECRET)
            .update(dataToSign)
            .digest("hex");

          if (expectedSignature === tSignature) {
            isTokenValid = true;
          }
        }
      } catch (err) {
        console.error("Token parsing error:", err);
      }
    }

    // Security block: if token is invalid, redirect back to countdown gate page
    if (!isTokenValid) {
      if (mirrorId) {
        const mirror = await db.downloadMirror.findUnique({
          where: { id: mirrorId },
          include: { version: { include: { app: true } } },
        });

        if (mirror && mirror.version?.app) {
          const redirectUrl = new URL(`/download/${mirror.version.app.slug}`, request.url);
          redirectUrl.searchParams.set("mirrorId", mirrorId);
          redirectUrl.searchParams.set("hotlinked", "1");
          return NextResponse.redirect(redirectUrl.toString(), 302);
        }
      } else if (linkId) {
        const link = await db.downloadLink.findUnique({
          where: { id: linkId },
          include: { version: { include: { app: true } } },
        });

        if (link && link.version?.app) {
          const redirectUrl = new URL(`/download/${link.version.app.slug}`, request.url);
          redirectUrl.searchParams.set("linkId", linkId);
          redirectUrl.searchParams.set("hotlinked", "1");
          return NextResponse.redirect(redirectUrl.toString(), 302);
        }
      }

      return NextResponse.json(
        { error: "Security Error: Direct hotlinking or invalid download token detected" },
        { status: 403 }
      );
    }

    // Extract request info for analytics
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const country = request.headers.get("cf-ipcountry") || "unknown";

    if (mirrorId) {
      // Find the download mirror
      const mirror = await db.downloadMirror.findUnique({
        where: { id: mirrorId },
        include: {
          version: {
            select: {
              id: true,
              appId: true,
            },
          },
        },
      });

      if (!mirror) {
        return NextResponse.json({ error: "Download mirror not found" }, { status: 404 });
      }

      // Record download event & increment counters
      Promise.all([
        db.downloadEvent.create({
          data: {
            appId: mirror.version.appId,
            versionId: mirror.version.id,
            mirrorId: mirror.id,
            ip,
            ipAddress: ip,
            userAgent,
            country,
          },
        }),
        db.downloadMirror.update({
          where: { id: mirror.id },
          data: { clickCount: { increment: 1 } },
        }),
        db.app.update({
          where: { id: mirror.version.appId },
          data: { downloadCount: { increment: 1 } },
        }),
      ]).catch((err) => {
        console.error("Failed to record mirror download event:", err);
      });

      // Redirect to external download URL
      const destUrl = mirror.downloadUrl || mirror.url;
      if (!destUrl) {
        return NextResponse.json({ error: "Mirror URL is empty" }, { status: 500 });
      }
      return NextResponse.redirect(destUrl, 302);

    } else {
      // Fallback to legacy DownloadLink
      const link = await db.downloadLink.findUnique({
        where: { id: linkId! },
        include: {
          version: {
            select: {
              id: true,
              appId: true,
            },
          },
        },
      });

      if (!link) {
        return NextResponse.json({ error: "Download link not found" }, { status: 404 });
      }

      // Record download event
      Promise.all([
        db.downloadEvent.create({
          data: {
            appId: link.version.appId,
            versionId: link.version.id,
            linkId: link.id,
            ip,
            ipAddress: ip,
            userAgent,
            country,
          },
        }),
        db.app.update({
          where: { id: link.version.appId },
          data: { downloadCount: { increment: 1 } },
        }),
      ]).catch((err) => {
        console.error("Failed to record legacy link download event:", err);
      });

      // Redirect to external download URL
      return NextResponse.redirect(link.url, 302);
    }

  } catch (error) {
    console.error("GET /api/download error:", error);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
