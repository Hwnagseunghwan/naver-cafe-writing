import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cafes = await prisma.cafe.findMany({
    include: { boards: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(cafes);
}

// 카페 추가
export async function POST(req: Request) {
  const { name, url, boards } = await req.json();
  if (!name || !url)
    return NextResponse.json({ error: "카페명과 URL을 입력해주세요." }, { status: 400 });

  try {
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
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    if (msg.includes("Unique constraint")) return NextResponse.json({ error: "이미 등록된 카페 URL입니다." }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 기존 카페에 게시판 추가
export async function PATCH(req: Request) {
  const { cafeId, boardName, boardId } = await req.json();
  if (!cafeId || !boardName || !boardId)
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });

  try {
    const board = await prisma.board.create({
      data: { name: boardName, boardId, cafeId: Number(cafeId) },
    });
    return NextResponse.json(board);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    if (msg.includes("Unique constraint")) return NextResponse.json({ error: "이미 등록된 게시판 ID입니다." }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 카페 또는 게시판 삭제
export async function DELETE(req: Request) {
  const { id, type } = await req.json();
  try {
    if (type === "board") {
      await prisma.board.delete({ where: { id } });
    } else {
      await prisma.cafe.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
