-- CreateEnum
CREATE TYPE "PlaylistStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PlaylistVisibility" AS ENUM ('PRIVATE', 'INTERNAL', 'PUBLIC');

-- CreateEnum
CREATE TYPE "SoundKitStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServiceOfferStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MIX_MASTER', 'PRODUCTION', 'COMPOSITION', 'SOUND_DESIGN', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'NEGOTIATION', 'SIGNED', 'EXPIRED', 'CANCELED');

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" CITEXT NOT NULL,
    "description" TEXT,
    "status" "PlaylistStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "PlaylistVisibility" NOT NULL DEFAULT 'INTERNAL',
    "coverUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerUserId" TEXT,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "playlistId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("playlistId","trackId")
);

-- CreateTable
CREATE TABLE "SoundKit" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" CITEXT NOT NULL,
    "description" TEXT,
    "status" "SoundKitStatus" NOT NULL DEFAULT 'DRAFT',
    "price" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "coverUrl" TEXT,
    "previewUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerUserId" TEXT,

    CONSTRAINT "SoundKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOffer" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" CITEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL DEFAULT 'OTHER',
    "status" "ServiceOfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "priceFrom" INTEGER,
    "priceTo" INTEGER,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "turnaroundDays" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "ownerUserId" TEXT,

    CONSTRAINT "ServiceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractRecord" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "counterpartyName" TEXT NOT NULL,
    "counterpartyEmail" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" INTEGER,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "fileUrl" TEXT,
    "notes" TEXT,
    "requestId" TEXT,
    "trackId" TEXT,
    "ownerUserId" TEXT,

    CONSTRAINT "ContractRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_slug_key" ON "Playlist"("slug");

-- CreateIndex
CREATE INDEX "Playlist_status_updatedAt_idx" ON "Playlist"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Playlist_visibility_updatedAt_idx" ON "Playlist"("visibility", "updatedAt");

-- CreateIndex
CREATE INDEX "Playlist_ownerUserId_updatedAt_idx" ON "Playlist"("ownerUserId", "updatedAt");

-- CreateIndex
CREATE INDEX "PlaylistTrack_trackId_idx" ON "PlaylistTrack"("trackId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_playlistId_sortOrder_idx" ON "PlaylistTrack"("playlistId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SoundKit_slug_key" ON "SoundKit"("slug");

-- CreateIndex
CREATE INDEX "SoundKit_status_updatedAt_idx" ON "SoundKit"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "SoundKit_ownerUserId_updatedAt_idx" ON "SoundKit"("ownerUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceOffer_slug_key" ON "ServiceOffer"("slug");

-- CreateIndex
CREATE INDEX "ServiceOffer_status_updatedAt_idx" ON "ServiceOffer"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ServiceOffer_category_status_updatedAt_idx" ON "ServiceOffer"("category", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "ServiceOffer_ownerUserId_updatedAt_idx" ON "ServiceOffer"("ownerUserId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContractRecord_contractNumber_key" ON "ContractRecord"("contractNumber");

-- CreateIndex
CREATE INDEX "ContractRecord_status_updatedAt_idx" ON "ContractRecord"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "ContractRecord_counterpartyName_updatedAt_idx" ON "ContractRecord"("counterpartyName", "updatedAt");

-- CreateIndex
CREATE INDEX "ContractRecord_ownerUserId_updatedAt_idx" ON "ContractRecord"("ownerUserId", "updatedAt");

-- CreateIndex
CREATE INDEX "ContractRecord_trackId_idx" ON "ContractRecord"("trackId");

-- CreateIndex
CREATE INDEX "ContractRecord_requestId_idx" ON "ContractRecord"("requestId");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoundKit" ADD CONSTRAINT "SoundKit_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffer" ADD CONSTRAINT "ServiceOffer_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRecord" ADD CONSTRAINT "ContractRecord_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractRecord" ADD CONSTRAINT "ContractRecord_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
