-- CreateTable
CREATE TABLE "public"."Post" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Track" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "coverUrl" TEXT,
    "moods" TEXT[],
    "uses" TEXT[],
    "isrc" TEXT,
    "iswc" TEXT,
    "upc" TEXT,
    "master" TEXT,
    "publishingSplit" TEXT,
    "licenseType" TEXT,
    "territories" TEXT,
    "term" TEXT,
    "mediaBuy" TEXT,
    "mfn" BOOLEAN,
    "restrictions" TEXT[],
    "contentIdEnrolled" BOOLEAN,
    "contentIdAdmin" TEXT,
    "contentIdWhitelist" TEXT,
    "assetKey" TEXT NOT NULL DEFAULT '',
    "assetMime" TEXT NOT NULL DEFAULT '',
    "assetSize" INTEGER NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION,
    "loudnessLufs" DOUBLE PRECISION,

    CONSTRAINT "Track_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_name_idx" ON "public"."Post"("name");

-- CreateIndex
CREATE INDEX "Track_artist_idx" ON "public"."Track"("artist");

-- CreateIndex
CREATE INDEX "Track_title_idx" ON "public"."Track"("title");
