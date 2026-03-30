-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "spotifyUserId" TEXT NOT NULL,
    "spotifyTrackId" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_spotifyUserId_idx" ON "Note"("spotifyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_spotifyUserId_spotifyTrackId_key" ON "Note"("spotifyUserId", "spotifyTrackId");
