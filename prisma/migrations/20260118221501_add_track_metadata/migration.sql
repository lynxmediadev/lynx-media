-- CreateEnum
CREATE TYPE "TrackType" AS ENUM ('INSTRUMENTAL', 'VOCAL', 'VOCAL_INSTRUMENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PricingTier" AS ENUM ('LOW', 'MID', 'HIGH', 'BESPOKE');

-- CreateEnum
CREATE TYPE "ExclusivityType" AS ENUM ('NON_EXCLUSIVE', 'EXCLUSIVE', 'LIMITED_EXCLUSIVE');

-- CreateEnum
CREATE TYPE "TrackVersionKind" AS ENUM ('FULL', 'CUTDOWN', 'ALT_MIX', 'INSTRUMENTAL', 'VOCAL', 'OTHER');

-- CreateEnum
CREATE TYPE "StemGroup" AS ENUM ('INSTRUMENT', 'VOCAL', 'FX', 'PERCUSSION', 'OTHER');

-- AlterTable
ALTER TABLE "PublishingShare" ADD COLUMN     "caeNumber" TEXT,
ADD COLUMN     "pro" TEXT;

-- AlterTable
ALTER TABLE "Track" ADD COLUMN     "bpm" DOUBLE PRECISION,
ADD COLUMN     "budgetCurrency" "Currency",
ADD COLUMN     "budgetMax" INTEGER,
ADD COLUMN     "budgetMin" INTEGER,
ADD COLUMN     "clearedForSync" BOOLEAN,
ADD COLUMN     "exclusiveTermMonths" INTEGER,
ADD COLUMN     "exclusiveTerritories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "exclusivity" "ExclusivityType",
ADD COLUMN     "genres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "key" TEXT,
ADD COLUMN     "oneStop" BOOLEAN,
ADD COLUMN     "pricingTier" "PricingTier",
ADD COLUMN     "restrictedBrands" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "restrictedIndustries" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "restrictedPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "restrictedTerritories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subgenres" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "trackType" "TrackType";

-- CreateTable
CREATE TABLE "TrackVersion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "durationSec" INTEGER,
    "kind" "TrackVersionKind",
    "audioUrl" TEXT,
    "assetKey" TEXT,
    "sortOrder" INTEGER,

    CONSTRAINT "TrackVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackStem" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "StemGroup",
    "durationSec" INTEGER,
    "audioUrl" TEXT,
    "assetKey" TEXT,
    "sortOrder" INTEGER,

    CONSTRAINT "TrackStem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrackVersion_trackId_sortOrder_idx" ON "TrackVersion"("trackId", "sortOrder");

-- CreateIndex
CREATE INDEX "TrackStem_trackId_sortOrder_idx" ON "TrackStem"("trackId", "sortOrder");

-- AddForeignKey
ALTER TABLE "TrackVersion" ADD CONSTRAINT "TrackVersion_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackStem" ADD CONSTRAINT "TrackStem_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
