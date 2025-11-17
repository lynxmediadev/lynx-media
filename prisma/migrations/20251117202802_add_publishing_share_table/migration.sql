/*
  Warnings:

  - You are about to drop the column `publisherIpiNumber` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `publisherName` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `publisherSharePct` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `writerIpiNumber` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `writerName` on the `Track` table. All the data in the column will be lost.
  - You are about to drop the column `writerSharePct` on the `Track` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."PublishingRole" AS ENUM ('WRITER', 'PUBLISHER');

-- AlterTable
ALTER TABLE "public"."Track" DROP COLUMN "publisherIpiNumber",
DROP COLUMN "publisherName",
DROP COLUMN "publisherSharePct",
DROP COLUMN "writerIpiNumber",
DROP COLUMN "writerName",
DROP COLUMN "writerSharePct";

-- CreateTable
CREATE TABLE "public"."PublishingShare" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackId" TEXT NOT NULL,
    "role" "public"."PublishingRole" NOT NULL,
    "name" TEXT NOT NULL,
    "ipiNumber" TEXT,
    "sharePct" INTEGER,

    CONSTRAINT "PublishingShare_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."PublishingShare" ADD CONSTRAINT "PublishingShare_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "public"."Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
