// =============================================================================
// Next.js Middleware — Admin Route Protection
// =============================================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let modifiedHeaders: Headers | null = null;

  // Convert Authorization: Bearer <JWT> token into NextAuth session cookies
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      request.cookies.set("next-auth.session-token", token);
      request.cookies.set("__Secure-next-auth.session-token", token);

      modifiedHeaders = new Headers(request.headers);
      const existingCookie = request.headers.get("cookie") || "";
      let newCookie = existingCookie;
      if (!existingCookie.includes("next-auth.session-token")) {
        newCookie = [
          existingCookie,
          `next-auth.session-token=${token}`,
          `__Secure-next-auth.session-token=${token}`
        ].filter(Boolean).join("; ");
      }
      modifiedHeaders.set("cookie", newCookie);
    }
  }

  // -------------------------------------------------------------------------
  // Protect admin routes (except login page and auth API)
  // -------------------------------------------------------------------------
  if (
    pathname.startsWith("/admin") &&
    !pathname.startsWith("/admin/login") &&
    !pathname.startsWith("/api/auth")
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // -------------------------------------------------------------------------
  // Protect admin API routes
  // -------------------------------------------------------------------------
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/api/admin/auth/login") &&
    !pathname.startsWith("/api/apps") &&     // Public GET allowed
    !pathname.startsWith("/api/categories") && // Public GET allowed
    !pathname.startsWith("/api/tags") &&       // Public GET allowed
    !pathname.startsWith("/api/reports") &&    // Public POST allowed
    !pathname.startsWith("/api/pageview") &&   // Public POST allowed
    !pathname.startsWith("/api/download")      // Public GET allowed
  ) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // -------------------------------------------------------------------------
  // Security headers
  // -------------------------------------------------------------------------
  const response = modifiedHeaders
    ? NextResponse.next({ request: { headers: modifiedHeaders } })
    : NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    // Match admin pages
    "/admin/:path*",
    // Match API routes (except static files)
    "/api/:path*",
  ],
};
