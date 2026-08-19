-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ScheduledBout" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "fighterRedId" TEXT NOT NULL,
    "fighterBlueId" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "weightClass" TEXT NOT NULL,
    "boutOrder" INTEGER NOT NULL DEFAULT 0,
    "fighterRedCorner" TEXT NOT NULL DEFAULT 'RED',
    "fighterBlueCorner" TEXT NOT NULL DEFAULT 'BLUE',
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
INSERT INTO "new_ScheduledBout" ("boutOrder", "cardType", "completed", "completedAt", "confirmedWeight", "eventId", "fighterBlueId", "fighterRedId", "id", "method", "sport", "weightClass", "winnerId") SELECT "boutOrder", "cardType", "completed", "completedAt", "confirmedWeight", "eventId", "fighterBlueId", "fighterRedId", "id", "method", "sport", "weightClass", "winnerId" FROM "ScheduledBout";
DROP TABLE "ScheduledBout";
ALTER TABLE "new_ScheduledBout" RENAME TO "ScheduledBout";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
