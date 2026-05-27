// =============================================================================
// Next.js Middleware — Admin Route Protection
// =============================================================================
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  const response = NextResponse.next();
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
