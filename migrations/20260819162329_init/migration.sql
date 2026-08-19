-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'FIGHTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Fighter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gym" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Unknown',
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "weightClass" TEXT NOT NULL,
    "bjjBelt" TEXT NOT NULL DEFAULT 'WHITE',
    "lastFightDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mmaWins" INTEGER NOT NULL DEFAULT 0,
    "mmaLosses" INTEGER NOT NULL DEFAULT 0,
    "mmaDraws" INTEGER NOT NULL DEFAULT 0,
    "mmaElo" INTEGER NOT NULL DEFAULT 1200,
    "bjjWins" INTEGER NOT NULL DEFAULT 0,
    "bjjLosses" INTEGER NOT NULL DEFAULT 0,
    "bjjDraws" INTEGER NOT NULL DEFAULT 0,
    "bjjElo" INTEGER NOT NULL DEFAULT 1200,
    "mtWins" INTEGER NOT NULL DEFAULT 0,
    "mtLosses" INTEGER NOT NULL DEFAULT 0,
    "mtDraws" INTEGER NOT NULL DEFAULT 0,
    "mtElo" INTEGER NOT NULL DEFAULT 1200,
    "boxingWins" INTEGER NOT NULL DEFAULT 0,
    "boxingLosses" INTEGER NOT NULL DEFAULT 0,
    "boxingDraws" INTEGER NOT NULL DEFAULT 0,
    "boxingElo" INTEGER NOT NULL DEFAULT 1200,
    CONSTRAINT "Fighter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "weighInDate" TEXT NOT NULL DEFAULT '',
    "weighInTime" TEXT NOT NULL DEFAULT '',
    "promoEvents" TEXT NOT NULL DEFAULT '',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "started" BOOLEAN NOT NULL DEFAULT false,
    "promoterId" TEXT NOT NULL,
    CONSTRAINT "Event_promoterId_fkey" FOREIGN KEY ("promoterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventRequest_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventRequest_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "Fighter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduledBout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "fighterRedId" TEXT NOT NULL,
    "fighterBlueId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "weightClass" TEXT NOT NULL,
    "boutOrder" INTEGER NOT NULL DEFAULT 0,
    "confirmedWeight" TEXT NOT NULL DEFAULT '',
    "cardType" TEXT NOT NULL DEFAULT 'UNDER',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "method" TEXT,
    "completedAt" DATETIME,
    CONSTRAINT "ScheduledBout_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledBout_fighterRedId_fkey" FOREIGN KEY ("fighterRedId") REFERENCES "Fighter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ScheduledBout_fighterBlueId_fkey" FOREIGN KEY ("fighterBlueId") REFERENCES "Fighter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "boutId" TEXT NOT NULL,
    "winnerId" TEXT,
    "method" TEXT NOT NULL,
    "boutOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MatchResult_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "ScheduledBout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EventFighters" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_EventFighters_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EventFighters_B_fkey" FOREIGN KEY ("B") REFERENCES "Fighter" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Fighter_userId_key" ON "Fighter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRequest_eventId_fighterId_key" ON "EventRequest"("eventId", "fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_boutId_key" ON "MatchResult"("boutId");

-- CreateIndex
CREATE UNIQUE INDEX "_EventFighters_AB_unique" ON "_EventFighters"("A", "B");

-- CreateIndex
CREATE INDEX "_EventFighters_B_index" ON "_EventFighters"("B");
