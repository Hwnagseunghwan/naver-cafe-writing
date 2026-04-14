/**
 * 네이버 카페 자동 글 송출 엔진
 * - 1분마다 예약된 글 체크
 * - 예약 시간 도달 시 Playwright로 로그인 → 글 게시
 * - 실행: npm run poster
 */

import { chromium } from "playwright";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";
import * as cron from "node-cron";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const prisma = new PrismaClient();

async function login(page: import("playwright").Page, naverId: string, naverPw: string): Promise<void> {
  console.log(`  로그인 시도: ${naverId.slice(0, 3)}***`);
  await page.goto("https://nid.naver.com/nidlogin.login", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  // IP보안 OFF
  try {
    const toggle = page.locator(".set_ip_check, #ip_secure_check, [class*='ip_check']").first();
    if (await toggle.isVisible({ timeout: 3000 })) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
  } catch { /* 무시 */ }

  await page.fill("#id", naverId);
  await page.waitForTimeout(500);
  await page.fill("#pw", naverPw);
  await page.waitForTimeout(500);
  await page.click(".btn_login");
  await page.waitForTimeout(4000);

  if (page.url().includes("nidlogin")) {
    console.log("  ⚠️ 추가 인증 필요 - 최대 3분 대기");
    const deadline = Date.now() + 3 * 60 * 1000;
    while (Date.now() < deadline) {
      await page.waitForTimeout(3000);
      if (!page.url().includes("nidlogin")) break;
    }
    if (page.url().includes("nidlogin")) throw new Error("로그인 실패 - 3분 내 인증 미완료");
  }
  console.log("  로그인 성공");
}

async function postToCafe(
  naverId: string,
  naverPw: string,
  cafeUrl: string,
  numericCafeId: string,
  boardId: string,
  title: string,
  content: string,
  imagePaths: string[]
): Promise<string> {
  const browser = await chromium.launch({
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--lang=ko-KR",
    ],
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    viewport: { width: 1920, height: 1080 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    (window as unknown as Record<string, unknown>).chrome = { runtime: {} };
    Object.defineProperty(navigator, "languages", { get: () => ["ko-KR", "ko"] });
  });

  const page = await context.newPage();

  try {
    await login(page, naverId, naverPw);

    // 카페 글쓰기 페이지 이동 (새 UI)
    const writeUrl = `https://cafe.naver.com/ca-fe/cafes/${numericCafeId}/menus/${boardId}/articles/write?boardType=L`;
    console.log(`  글쓰기 URL: ${writeUrl}`);

    await page.goto(writeUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    // 제목 입력 (새 UI - textarea.textarea_input)
    await page.locator("textarea.textarea_input").fill(title);
    await page.waitForTimeout(500);

    // 내용 입력 (SE4 - contenteditable)
    const contentArea = page.locator(".se-section-text").first();
    await contentArea.click();
    await page.waitForTimeout(500);
    await page.evaluate((html: string) => {
      const editable = document.querySelector(".se-section-text") as HTMLElement;
      if (editable) {
        editable.innerHTML = html;
        editable.dispatchEvent(new InputEvent("input", { bubbles: true }));
      }
    }, content);
    await page.waitForTimeout(500);

    // 이미지 첨부 (선택적)
    for (const imgPath of imagePaths) {
      try {
        const absolutePath = path.join(process.cwd(), "public", imgPath);
        if (fs.existsSync(absolutePath)) {
          const fileInput = page.locator("input[type='file']").first();
          await fileInput.setInputFiles(absolutePath);
          await page.waitForTimeout(2000);
        }
      } catch { /* 이미지 첨부 실패 시 무시 */ }
    }

    // 등록 버튼 클릭 (a.BaseButton--skinGreen, <a> 태그임)
    await page.locator("a.BaseButton--skinGreen").click();
    await page.waitForTimeout(3000);

    const postedUrl = page.url();
    console.log(`  게시 완료: ${postedUrl}`);
    return postedUrl;
  } finally {
    await browser.close();
  }
}

async function processScheduledPosts(): Promise<void> {
  const now = new Date();

  const pendingPosts = await prisma.scheduledPost.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: now },
    },
    include: {
      draft: { include: { images: { orderBy: { order: "asc" } } } },
      account: true,
      board: { include: { cafe: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  if (pendingPosts.length === 0) return;

  console.log(`\n[${now.toLocaleString("ko-KR")}] 송출 대상: ${pendingPosts.length}건`);

  for (const post of pendingPosts) {
    console.log(`\n처리 중: [${post.account.naverId}] ${post.draft.title}`);

    // 상태를 running으로 변경
    await prisma.scheduledPost.update({
      where: { id: post.id },
      data: { status: "running" },
    });

    try {
      const imagePaths = post.draft.images.map((img) => img.path);
      const numericCafeId = post.board.cafe.numericId ?? post.board.cafe.url.replace(/^https?:\/\/cafe\.naver\.com\//, "").replace(/\/$/, "");
      const postedUrl = await postToCafe(
        post.account.naverId,
        post.account.naverPw,
        post.board.cafe.url,
        numericCafeId,
        post.board.boardId,
        post.draft.title,
        post.draft.content,
        imagePaths
      );

      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "success",
          postedUrl,
          executedAt: new Date(),
        },
      });
      console.log(`  ✅ 성공`);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "알 수 없는 오류";
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "failed",
          errorMsg,
          executedAt: new Date(),
        },
      });
      console.error(`  ❌ 실패: ${errorMsg}`);
    }
  }
}

async function main() {
  console.log("=== 네이버 카페 자동 송출 엔진 시작 ===");
  console.log("1분마다 예약 글을 체크합니다.\n");

  // 시작 시 즉시 1회 실행
  await processScheduledPosts();

  // 1분마다 체크
  cron.schedule("* * * * *", async () => {
    await processScheduledPosts();
  });
}

main().catch((e) => {
  console.error("치명적 오류:", e);
  process.exit(1);
});
