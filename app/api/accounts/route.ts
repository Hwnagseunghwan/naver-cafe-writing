import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.naverAccount.findMany({
    orderBy: { createdAt: "asc" },
  });
  // 비밀번호 마스킹
  return NextResponse.json(accounts.map((a) => ({ ...a, naverPw: "••••••••" })));
}

export async function POST(req: Request) {
  const { nickname, naverId, naverPw } = await req.json();
  if (!nickname || !naverId || !naverPw)
    return NextResponse.json({ error: "모든 항목을 입력해주세요." }, { status: 400 });
  const account = await prisma.naverAccount.create({
    data: { nickname, naverId, naverPw },
  });
  return NextResponse.json({ ...account, naverPw: "••••••••" });
}

export async function PATCH(req: Request) {
  const { id, isActive } = await req.json();
  const account = await prisma.naverAccount.update({
    where: { id },
    data: { isActive },
  });
  return NextResponse.json({ ...account, naverPw: "••••••••" });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.naverAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
