-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'SPAM');

-- CreateEnum
CREATE TYPE "TicketSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('NOT_FOUND', 'ERROR_PAGE', 'MANUAL');

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "source" "TicketSource" NOT NULL DEFAULT 'MANUAL',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "severity" "TicketSeverity" NOT NULL DEFAULT 'MEDIUM',
    "summary" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "pageUrl" TEXT,
    "email" CITEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "reporterUserId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" TEXT,
    "meta" JSONB,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupportTicket_status_createdAt_idx" ON "SupportTicket"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_severity_createdAt_idx" ON "SupportTicket"("severity", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_source_createdAt_idx" ON "SupportTicket"("source", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_reporterUserId_createdAt_idx" ON "SupportTicket"("reporterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_resolvedByUserId_createdAt_idx" ON "SupportTicket"("resolvedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
