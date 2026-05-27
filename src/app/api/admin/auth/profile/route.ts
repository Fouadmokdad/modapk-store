// =============================================================================
// Mobile Admin Profile API Endpoint
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await db.admin.findUnique({
      where: { id: token.id as string },
    });

    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      id: admin.id,
      username: admin.name,
      email: admin.email,
      role: admin.role,
      avatar: admin.avatar,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin,
    });
  } catch (error: any) {
    console.error("GET /api/admin/auth/profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile information" },
      { status: 500 }
    );
  }
}
