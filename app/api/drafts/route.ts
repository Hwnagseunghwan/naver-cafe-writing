import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const drafts = await prisma.draft.findMany({
    include: { author: { select: { name: true } }, images: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(drafts);
}

export async function POST(req: Request) {
  const { title, content, authorId, images } = await req.json();
  if (!title || !content || !authorId)
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });

  const draft = await prisma.draft.create({
    data: {
      title,
      content,
      authorId: Number(authorId),
      images: {
        create: (images || []).map((img: { filename: string; path: string }, i: number) => ({
          filename: img.filename,
          path: img.path,
          order: i,
        })),
      },
    },
    include: { images: true },
  });
  return NextResponse.json(draft);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.draft.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
