import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return NextResponse.json({ filename, path: `/uploads/${filename}` });
}
