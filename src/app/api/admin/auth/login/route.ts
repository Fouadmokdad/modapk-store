// =============================================================================
// Mobile Admin Login API Endpoint
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { logActivity } from "@/lib/activity-logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email;
    const username = body.username;
    const password = body.password;

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

    // 1. Debug Log: Found user email
    console.log("[DEBUG AUTH] Found user email:", admin ? admin.email : "null");

    if (!admin) {
      // 2. Debug Log: Password compare result (false since user not found)
      console.log("[DEBUG AUTH] Password compare result: false (user not found)");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    
    // 2. Debug Log: Password compare result
    console.log("[DEBUG AUTH] Password compare result:", isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // 3. Debug Log: Account active status
    console.log("[DEBUG AUTH] Account active status:", admin.isActive);

    if (!admin.isActive) {
      return NextResponse.json(
        { error: "Account disabled" },
        { status: 403 }
      );
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
      secret: process.env.NEXTAUTH_SECRET!,
      maxAge: 24 * 60 * 60, // 24 hours
    });

    // 4. Debug Log: Generated token result
    console.log("[DEBUG AUTH] Generated token result:", accessToken ? "SUCCESS" : "FAILURE");

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
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
