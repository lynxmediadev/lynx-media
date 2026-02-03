-- Ensure citext is available in the shadow DB and target DB
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateTable
CREATE TABLE "Mood" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" CITEXT NOT NULL,
    "slug" CITEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "Mood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackMood" (
    "trackId" TEXT NOT NULL,
    "moodId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackMood_pkey" PRIMARY KEY ("trackId","moodId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mood_name_key" ON "Mood"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Mood_slug_key" ON "Mood"("slug");

-- CreateIndex
CREATE INDEX "Mood_name_idx" ON "Mood"("name");

-- CreateIndex
CREATE INDEX "Mood_slug_idx" ON "Mood"("slug");

-- CreateIndex
CREATE INDEX "TrackMood_moodId_idx" ON "TrackMood"("moodId");

-- CreateIndex
CREATE INDEX "TrackMood_trackId_idx" ON "TrackMood"("trackId");

-- AddForeignKey
ALTER TABLE "TrackMood" ADD CONSTRAINT "TrackMood_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackMood" ADD CONSTRAINT "TrackMood_moodId_fkey" FOREIGN KEY ("moodId") REFERENCES "Mood"("id") ON DELETE CASCADE ON UPDATE CASCADE;
