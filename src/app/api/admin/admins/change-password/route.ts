// =============================================================================
// Change Password API — Secure profile self-management
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity-logger";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * PUT /api/admin/admins/change-password — Update own password
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    const admin = await db.admin.findUnique({
      where: { id: session.user.id },
    });

    if (!admin) {
      return NextResponse.json({ error: "Administrator profile not found" }, { status: 404 });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(validated.currentPassword, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    // Hash and update to new password
    const newPasswordHash = await bcrypt.hash(validated.newPassword, 12);
    await db.admin.update({
      where: { id: session.user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Log password change
    await logActivity(
      session.user.id,
      "PASSWORD_CHANGE",
      "Successfully updated profile password",
      request
    );

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error: any) {
    console.error("PUT /api/admin/admins/change-password error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update password" },
      { status: 500 }
    );
  }
}
