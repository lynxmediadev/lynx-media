-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('CLP', 'USD', 'EUR');

-- CreateTable
CREATE TABLE "public"."LicensingRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "projectType" TEXT NOT NULL,
    "media" TEXT,
    "territories" TEXT,
    "term" TEXT,
    "budgetAmount" INTEGER,
    "budgetCurrency" "public"."Currency",
    "mfn" BOOLEAN NOT NULL DEFAULT false,
    "needWhitelist" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "trackId" TEXT NOT NULL,
    "trackTitle" TEXT,
    "trackArtist" TEXT,
    "trackDurationSec" INTEGER,
    "moods" TEXT[],
    "uses" TEXT[],
    "restrictions" TEXT[],
    "pageUrl" TEXT,
    "rawPayload" JSONB,

    CONSTRAINT "LicensingRequest_pkey" PRIMARY KEY ("id")
);
