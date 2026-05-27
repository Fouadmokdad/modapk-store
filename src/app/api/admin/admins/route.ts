// =============================================================================
// Admins API — Admin Profiles Management (SUPER_ADMIN only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "UPLOADER"]),
  isActive: z.boolean().optional().default(true),
});

/**
 * GET /api/admin/admins — List all admins (SUPER_ADMIN only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:admins")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admins = await db.admin.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: admins });
  } catch (error: any) {
    console.error("GET /api/admin/admins error:", error);
    return NextResponse.json(
      { error: "Failed to fetch administrators" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/admins — Create a new admin account (SUPER_ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:admins")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAdminSchema.parse(body);

    // Verify email uniqueness
    const existing = await db.admin.findUnique({
      where: { email: validated.email.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An administrator with this email address already exists" },
        { status: 409 }
      );
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(validated.password, 12);

    // Create the admin profile
    const newAdmin = await db.admin.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase().trim(),
        passwordHash,
        role: validated.role,
        isActive: validated.isActive,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Log the creation
    await logActivity(
      session.user.id,
      "ADMIN_CREATE",
      `Created administrator account: ${newAdmin.email} (${newAdmin.role})`,
      request
    );

    return NextResponse.json({ data: newAdmin }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/admins error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create administrator account" },
      { status: 500 }
    );
  }
}
