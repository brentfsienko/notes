-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "spotifyUserId" TEXT NOT NULL,
    "spotifyTrackId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Note_spotifyUserId_idx" ON "Note"("spotifyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_spotifyUserId_spotifyTrackId_key" ON "Note"("spotifyUserId", "spotifyTrackId");
