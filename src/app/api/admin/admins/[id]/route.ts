// =============================================================================
// Admin Detail API — Update or delete administrator accounts (SUPER_ADMIN only)
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";

const updateAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR", "UPLOADER"]).optional(),
  isActive: z.boolean().optional(),
  avatar: z.string().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/admin/admins/[id] — Update administrator details
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:admins")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targetAdmin = await db.admin.findUnique({ where: { id } });
    if (!targetAdmin) {
      return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateAdminSchema.parse(body);

    // Prevent privilege escalation/self-lockouts:
    // A SUPER_ADMIN cannot change their own role or active status to anything else.
    if (session.user.id === id) {
      if (validated.role && validated.role !== targetAdmin.role) {
        return NextResponse.json(
          { error: "You cannot change your own role to prevent lockout" },
          { status: 400 }
        );
      }
      if (validated.isActive !== undefined && validated.isActive !== targetAdmin.isActive) {
        return NextResponse.json(
          { error: "You cannot disable your own administrator account" },
          { status: 400 }
        );
      }
    }

    const updated = await db.admin.update({
      where: { id },
      data: {
        ...(validated.name !== undefined ? { name: validated.name } : {}),
        ...(validated.role !== undefined ? { role: validated.role } : {}),
        ...(validated.isActive !== undefined ? { isActive: validated.isActive } : {}),
        ...(validated.avatar !== undefined ? { avatar: validated.avatar } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        avatar: true,
      },
    });

    // Log update action
    await logActivity(
      session.user.id,
      "ADMIN_EDIT",
      `Updated admin account details for: ${updated.email}. Changed properties: ${Object.keys(validated).join(", ")}`,
      request
    );

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/admins/[id] error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update administrator account" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/admins/[id] — Delete administrator account
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !hasPermission(session.user.role, "manage:admins")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own administrator account" },
        { status: 400 }
      );
    }

    const targetAdmin = await db.admin.findUnique({ where: { id } });
    if (!targetAdmin) {
      return NextResponse.json({ error: "Administrator not found" }, { status: 404 });
    }

    await db.admin.delete({ where: { id } });

    // Log deletion
    await logActivity(
      session.user.id,
      "ADMIN_DELETE",
      `Deleted administrator account: ${targetAdmin.email} (${targetAdmin.role})`,
      request
    );

    return NextResponse.json({
      data: { message: "Administrator account deleted successfully" },
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/admins/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete administrator account" },
      { status: 500 }
    );
  }
}
