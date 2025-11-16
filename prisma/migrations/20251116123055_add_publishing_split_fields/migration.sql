-- AlterTable
ALTER TABLE "public"."Track" ADD COLUMN     "publisherName" TEXT,
ADD COLUMN     "publisherSharePct" INTEGER,
ADD COLUMN     "writerName" TEXT,
ADD COLUMN     "writerSharePct" INTEGER;
