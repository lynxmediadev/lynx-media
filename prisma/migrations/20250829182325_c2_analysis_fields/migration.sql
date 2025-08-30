/*
  Warnings:

  - You are about to alter the column `durationSec` on the `Track` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "public"."Track" ADD COLUMN     "analysisAt" TIMESTAMPTZ(6),
ADD COLUMN     "bitrateKbps" INTEGER,
ADD COLUMN     "channels" INTEGER,
ADD COLUMN     "sampleRateHz" INTEGER,
ADD COLUMN     "waveform" JSONB,
ALTER COLUMN "durationSec" SET DATA TYPE INTEGER;
