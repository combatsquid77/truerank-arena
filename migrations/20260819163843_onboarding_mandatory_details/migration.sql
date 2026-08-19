-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Fighter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gym" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT 'Unknown',
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "weightClass" TEXT NOT NULL,
    "bjjBelt" TEXT NOT NULL DEFAULT 'WHITE',
    "titles" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_Fighter" ("age", "bjjBelt", "bjjDraws", "bjjElo", "bjjLosses", "bjjWins", "boxingDraws", "boxingElo", "boxingLosses", "boxingWins", "createdAt", "gender", "gym", "id", "lastFightDate", "location", "mmaDraws", "mmaElo", "mmaLosses", "mmaWins", "mtDraws", "mtElo", "mtLosses", "mtWins", "userId", "weightClass") SELECT "age", "bjjBelt", "bjjDraws", "bjjElo", "bjjLosses", "bjjWins", "boxingDraws", "boxingElo", "boxingLosses", "boxingWins", "createdAt", "gender", "gym", "id", "lastFightDate", "location", "mmaDraws", "mmaElo", "mmaLosses", "mmaWins", "mtDraws", "mtElo", "mtLosses", "mtWins", "userId", "weightClass" FROM "Fighter";
DROP TABLE "Fighter";
ALTER TABLE "new_Fighter" RENAME TO "Fighter";
CREATE UNIQUE INDEX "Fighter_userId_key" ON "Fighter"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL DEFAULT 'password',
    "role" TEXT NOT NULL DEFAULT 'PENDING',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "promoterOrg" TEXT NOT NULL DEFAULT '',
    "promoterSanction" TEXT NOT NULL DEFAULT '',
    "promoterLocation" TEXT NOT NULL DEFAULT '',
    "promoterWebsite" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "onboarded", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "name", "onboarded", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
