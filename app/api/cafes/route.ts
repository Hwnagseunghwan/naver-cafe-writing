import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cafes = await prisma.cafe.findMany({
    include: { boards: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(cafes);
}

export async function POST(req: Request) {
  const { name, url, boards } = await req.json();
  if (!name || !url)
    return NextResponse.json({ error: "카페명과 URL을 입력해주세요." }, { status: 400 });

  const cafe = await prisma.cafe.create({
    data: {
      name,
      url,
      boards: {
        create: (boards || []).map((b: { name: string; boardId: string }) => ({
          name: b.name,
          boardId: b.boardId,
        })),
      },
    },
    include: { boards: true },
  });
  return NextResponse.json(cafe);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.cafe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
