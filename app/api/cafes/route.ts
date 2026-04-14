import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 게시판 URL에서 cafeNumericId, menuId 파싱
// 예: https://cafe.naver.com/f-e/cafes/21676069/menus/28
function parseBoardUrl(boardUrl: string): { cafeNumericId: string; menuId: string } | null {
  const match = boardUrl.match(/\/cafes\/(\d+)\/menus\/(\d+)/);
  if (!match) return null;
  return { cafeNumericId: match[1], menuId: match[2] };
}

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

  // 게시판 URL에서 numericId, boardId 파싱
  let numericId: string | undefined;
  const parsedBoards: { name: string; boardId: string }[] = [];

  for (const b of boards || []) {
    if (!b.name) continue;
    if (b.boardUrl) {
      const parsed = parseBoardUrl(b.boardUrl);
      if (!parsed) return NextResponse.json({ error: `게시판 URL 형식이 올바르지 않습니다: ${b.boardUrl}` }, { status: 400 });
      if (!numericId) numericId = parsed.cafeNumericId;
      parsedBoards.push({ name: b.name, boardId: parsed.menuId });
    } else if (b.boardId) {
      parsedBoards.push({ name: b.name, boardId: b.boardId });
    }
  }

  try {
    const cafe = await prisma.cafe.create({
      data: {
        name,
        url,
        numericId,
        boards: {
          create: parsedBoards,
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
  const { cafeId, boardName, boardUrl } = await req.json();
  if (!cafeId || !boardName || !boardUrl)
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });

  const parsed = parseBoardUrl(boardUrl);
  if (!parsed) return NextResponse.json({ error: "게시판 URL 형식이 올바르지 않습니다." }, { status: 400 });

  try {
    // 카페 numericId가 없으면 업데이트
    const cafe = await prisma.cafe.findUnique({ where: { id: Number(cafeId) } });
    if (cafe && !cafe.numericId) {
      await prisma.cafe.update({ where: { id: Number(cafeId) }, data: { numericId: parsed.cafeNumericId } });
    }

    const board = await prisma.board.create({
      data: { name: boardName, boardId: parsed.menuId, cafeId: Number(cafeId) },
    });
    return NextResponse.json(board);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    if (msg.includes("Unique constraint")) return NextResponse.json({ error: "이미 등록된 게시판입니다." }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 카페 또는 게시판 삭제
export async function DELETE(req: Request) {
  const { id, type } = await req.json();
  try {
    if (type === "board") {
      await prisma.scheduledPost.deleteMany({ where: { boardId: id } });
      await prisma.board.delete({ where: { id } });
    } else {
      await prisma.scheduledPost.deleteMany({ where: { board: { cafeId: id } } });
      await prisma.cafe.delete({ where: { id } });
    }
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "알 수 없는 오류";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
