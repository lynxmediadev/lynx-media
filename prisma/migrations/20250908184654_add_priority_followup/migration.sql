-- CreateEnum
CREATE TYPE "public"."RequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "public"."LicensingRequest" ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3),
ADD COLUMN     "priority" "public"."RequestPriority" NOT NULL DEFAULT 'MEDIUM';

-- CreateIndex
CREATE INDEX "LicensingRequest_priority_idx" ON "public"."LicensingRequest"("priority");

-- CreateIndex
CREATE INDEX "LicensingRequest_nextFollowUpAt_idx" ON "public"."LicensingRequest"("nextFollowUpAt");
