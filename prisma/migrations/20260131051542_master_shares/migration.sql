-- CreateTable
CREATE TABLE "MasterShare" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trackId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sharePct" INTEGER,
    "contact" TEXT,
    "notes" TEXT,

    CONSTRAINT "MasterShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasterShare_trackId_idx" ON "MasterShare"("trackId");

-- AddForeignKey
ALTER TABLE "MasterShare" ADD CONSTRAINT "MasterShare_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;
