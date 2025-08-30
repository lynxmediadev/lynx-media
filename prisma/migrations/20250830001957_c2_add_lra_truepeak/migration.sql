/*
  Warnings:

  - The `waveform` column on the `Track` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Track" ADD COLUMN     "loudnessRangeLu" DOUBLE PRECISION,
ADD COLUMN     "lraHighLufs" DOUBLE PRECISION,
ADD COLUMN     "lraLowLufs" DOUBLE PRECISION,
ADD COLUMN     "truePeakDbfs" DOUBLE PRECISION,
ALTER COLUMN "analysisAt" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "waveform",
ADD COLUMN     "waveform" BYTEA;
