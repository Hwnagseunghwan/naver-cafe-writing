import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const posts = await prisma.scheduledPost.findMany({
    include: {
      draft: { select: { title: true } },
      account: { select: { nickname: true, naverId: true } },
      board: { include: { cafe: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const { draftId, accountId, boardId, scheduledAt } = await req.json();
  if (!draftId || !accountId || !boardId || !scheduledAt)
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });

  const post = await prisma.scheduledPost.create({
    data: {
      draftId: Number(draftId),
      accountId: Number(accountId),
      boardId: Number(boardId),
      scheduledAt: new Date(scheduledAt),
    },
    include: {
      draft: { select: { title: true } },
      account: { select: { nickname: true, naverId: true } },
      board: { include: { cafe: { select: { name: true } } } },
    },
  });
  return NextResponse.json(post);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const post = await prisma.scheduledPost.findUnique({ where: { id } });
  if (post?.status === "running")
    return NextResponse.json({ error: "실행 중인 예약은 삭제할 수 없습니다." }, { status: 400 });
  await prisma.scheduledPost.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
