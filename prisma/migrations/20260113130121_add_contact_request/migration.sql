-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "urgency" INTEGER NOT NULL,
    "deadlineAt" TIMESTAMP(3),
    "pageUrl" TEXT,
    "rawPayload" JSONB,
    "status" "RequestStatus" NOT NULL DEFAULT 'NEW',

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactRequest_createdAt_status_idx" ON "ContactRequest"("createdAt", "status");

-- CreateIndex
CREATE INDEX "ContactRequest_serviceType_idx" ON "ContactRequest"("serviceType");
