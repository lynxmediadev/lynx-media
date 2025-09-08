-- CreateEnum
CREATE TYPE "public"."RequestStatus" AS ENUM ('NEW', 'IN_REVIEW', 'QUOTED', 'CLOSED_WON', 'CLOSED_LOST');

-- AlterTable
ALTER TABLE "public"."LicensingRequest" ADD COLUMN     "status" "public"."RequestStatus" NOT NULL DEFAULT 'NEW';
