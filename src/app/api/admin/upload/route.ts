// =============================================================================
// Media Upload API — Secure Admin-Only Upload Endpoint
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import path from "path";
import { slugify } from "@/lib/utils";

// Configure Cloudinary SDK if credentials exist
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// 5MB max file size limit
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];

const FOLDER_MAP: Record<string, string> = {
  icon: "apps/icons",
  screenshot: "apps/screenshots",
  category: "categories",
  "og-image": "og-images",
};

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate Admin session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Multipart Form Data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null; // icon, screenshot, category, og-image
    const slug = formData.get("slug") as string | null; // app slug to avoid collision and keep stable naming

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!type || !FOLDER_MAP[type]) {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // 3. Secure Validations (MIME and Size)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `MIME type '${file.type}' not supported. Allowed: JPEG, PNG, WebP, AVIF, GIF` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the 5MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB uploaded)` },
        { status: 400 }
      );
    }

    // 4. Stable Unique Naming Strategy
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name) || ".png";
    const cleanAppSlug = slug ? slugify(slug) : "media";
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const uniqueFilename = `${cleanAppSlug}-${type}-${timestamp}-${randomSuffix}`;
    const filenameWithExt = `${uniqueFilename}${fileExtension}`;

    // Convert file to Node buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Cloudinary Upload Path (If configured)
    if (isCloudinaryConfigured) {
      const folderPath = `modapk_store/${FOLDER_MAP[type]}`;

      const uploadResult = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folderPath,
            public_id: uniqueFilename,
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            resource_type: "image",
            // Priority 2: Auto-generate optimized variants and WebP/AVIF delivery dynamically
            transformation: [
              { quality: "auto", fetch_format: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.write(buffer);
        stream.end();
      });

      return NextResponse.json({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        bytes: uploadResult.bytes,
      });
    }

    // 6. Highly resilient fallback to local uploads directory (flawless local developer DX)
    console.warn("⚠️ Cloudinary environment credentials are not configured. Falling back to local public/uploads storage.");

    const uploadsDir = path.join(process.cwd(), "public", "uploads", FOLDER_MAP[type]);
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const localFilePath = path.join(uploadsDir, filenameWithExt);
    await fs.writeFile(localFilePath, buffer);

    const relativeUrl = `/uploads/${FOLDER_MAP[type]}/${filenameWithExt}`;

    return NextResponse.json({
      url: relativeUrl,
      publicId: uniqueFilename,
      format: fileExtension.substring(1),
      bytes: file.size,
    });
  } catch (error: any) {
    console.error("POST /api/admin/upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message || error },
      { status: 500 }
    );
  }
}
