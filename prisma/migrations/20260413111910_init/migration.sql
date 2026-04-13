-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "NaverAccount" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nickname" TEXT NOT NULL,
    "naverId" TEXT NOT NULL,
    "naverPw" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Cafe" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Board" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "cafeId" INTEGER NOT NULL,
    CONSTRAINT "Board_cafeId_fkey" FOREIGN KEY ("cafeId") REFERENCES "Cafe" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" INTEGER NOT NULL,
    CONSTRAINT "Draft_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DraftImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "draftId" INTEGER NOT NULL,
    CONSTRAINT "DraftImage_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduledPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "draftId" INTEGER NOT NULL,
    "accountId" INTEGER NOT NULL,
    "boardId" INTEGER NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "postedUrl" TEXT,
    "errorMsg" TEXT,
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduledPost_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "Draft" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPost_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "NaverAccount" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduledPost_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "NaverAccount_naverId_key" ON "NaverAccount"("naverId");

-- CreateIndex
CREATE UNIQUE INDEX "Cafe_url_key" ON "Cafe"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Board_cafeId_boardId_key" ON "Board"("cafeId", "boardId");
