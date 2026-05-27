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
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/email and password are required" },
        { status: 400 }
      );
    }

    // Try finding admin by email or name (username)
    const admin = await db.admin.findFirst({
      where: {
        OR: [
          { email: username.toLowerCase().trim() },
          { name: username.trim() }
        ]
      }
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid username/email or password" },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: "Your account has been disabled" },
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

    return NextResponse.json({
      accessToken,
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
    });
  } catch (error: any) {
    console.error("POST /api/admin/auth/login error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred during login" },
      { status: 500 }
    );
  }
}
