import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { randomBytes } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "/var/uploads";
const PUBLIC_BASE = process.env.UPLOAD_PUBLIC_BASE ?? "https://app.controla.group/uploads";

const ALLOWED_MIME = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "audio/webm", "audio/mpeg", "audio/wav", "audio/ogg",
  "application/pdf", "text/plain", "application/json",
]);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "file too large (max 25MB)" }, { status: 413 });
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: `mime not allowed: ${file.type}` }, { status: 415 });
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
    const id = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(join(UPLOAD_DIR, id), buf);

    return NextResponse.json({
      url: `${PUBLIC_BASE}/${id}`,
      name: file.name,
      size: file.size,
      mime: file.type,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "upload failed" }, { status: 500 });
  }
}
