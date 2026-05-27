// =============================================================================
// Reports API — Public POST + Admin GET/PATCH
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { reportSchema, reportStatusSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const type = searchParams.get("type") || undefined;

    const reports = await db.report.findMany({
      where: {
        ...(status ? { status: status as "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED" } : {}),
        ...(type ? { type: type as "BROKEN_LINK" | "COPYRIGHT" } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: { app: { select: { title: true, slug: true } } },
      take: 100,
    });

    return NextResponse.json({ data: reports });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = reportSchema.parse(body);

    const app = await db.app.findUnique({ where: { id: validated.appId }, select: { id: true } });
    if (!app) return NextResponse.json({ error: "App not found" }, { status: 404 });

    const report = await db.report.create({ data: validated });
    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/reports error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Report ID required" }, { status: 400 });

    const body = await request.json();
    const validated = reportStatusSchema.parse(body);

    const report = await db.report.update({ where: { id }, data: validated });
    return NextResponse.json({ data: report });
  } catch (error: any) {
    console.error("PATCH /api/reports error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}

