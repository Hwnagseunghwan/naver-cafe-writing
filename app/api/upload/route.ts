import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });

  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ filename, path: blob.url });
}
