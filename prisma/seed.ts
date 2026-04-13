import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin1234", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {},
    create: {
      email: "admin@admin.com",
      password,
      name: "관리자",
      role: "admin",
    },
  });
  console.log("관리자 계정 생성 완료:", user.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
