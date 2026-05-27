// =============================================================================
// Mobile Admin Login API Endpoint
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  let emailLog: string | undefined;
  try {
    const body = await request.json();
    const email = body.email;
    emailLog = email;
    const username = body.username;
    const password = body.password;

    // Detailed Log: Start
    console.error("MOBILE_AUTH_LOGIN_START", { email });

    const identifier = email || username;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/username and password are required" },
        { status: 400 }
      );
    }

    // Try finding admin by email or name (username)
    const admin = await db.admin.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { name: identifier.trim() }
        ]
      }
    });

    // Detailed Log: Admin found
    console.error("MOBILE_AUTH_ADMIN_FOUND", !!admin);

    if (!admin) {
      console.error("MOBILE_AUTH_ACTIVE", false);
      console.error("MOBILE_AUTH_HAS_HASH", false);
      console.error("MOBILE_AUTH_COMPARE", false);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Detailed Log: Active
    console.error("MOBILE_AUTH_ACTIVE", admin.isActive);

    // Detailed Log: Has Hash
    console.error("MOBILE_AUTH_HAS_HASH", !!admin.passwordHash);

    const compareResult = await bcrypt.compare(password, admin.passwordHash);
    
    // Detailed Log: Compare result
    console.error("MOBILE_AUTH_COMPARE", compareResult);

    if (!compareResult) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: "Account disabled" },
        { status: 403 }
      );
    }

    // Resolve JWT secret with fallback
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret (JWT_SECRET or NEXTAUTH_SECRET) is missing in environment variables.");
    }

    // Generate JWT token compatible with NextAuth
    const tokenPayload = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      isActive: admin.isActive,
    };

    const accessToken = await encode({
      token: tokenPayload,
      secret: jwtSecret,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // Update lastLogin timestamp in database
    await db.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    // Log the successful login
    await logActivity(
      admin.id,
      "LOGIN",
      "Successfully logged in via Mobile App REST API",
      request
    );

    const responsePayload = {
      success: true,
      token: accessToken,
      accessToken,
      admin: {
        id: admin.id,
        username: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin,
      },
      user: {
        id: admin.id,
        username: admin.name,
        email: admin.email,
        role: admin.role,
        avatar: admin.avatar,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin,
      }
    };

    const response = NextResponse.json(responsePayload);

    // Set cookie directly in response headers
    const cookieName = process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token";
    response.cookies.set(cookieName, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/admin/auth/login error:", error);
    // Ensure all intermediate detailed logs are printed if crash occurs early
    if (emailLog !== undefined) {
      console.error("[CRASH DETECTED DURING AUTH] email:", emailLog);
    }
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
