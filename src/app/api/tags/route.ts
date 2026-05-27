// =============================================================================
// Tags API — CRUD
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tagSchema } from "@/lib/validators";

export async function GET() {
  try {
    const tags = await db.tag.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { apps: true } } },
    });
    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error("GET /api/tags error:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const validated = tagSchema.parse(body);

    const existing = await db.tag.findUnique({ where: { slug: validated.slug } });
    if (existing) return NextResponse.json({ error: "Tag slug already exists" }, { status: 409 });

    const tag = await db.tag.create({ data: validated });
    return NextResponse.json({ data: tag }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tags error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Tag ID required" }, { status: 400 });

    const body = await request.json();
    const validated = tagSchema.parse(body);

    const tag = await db.tag.update({ where: { id }, data: validated });
    return NextResponse.json({ data: tag });
  } catch (error) {
    console.error("PUT /api/tags error:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Tag ID required" }, { status: 400 });

    await db.tag.delete({ where: { id } });
    return NextResponse.json({ data: { message: "Tag deleted" } });
  } catch (error) {
    console.error("DELETE /api/tags error:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
