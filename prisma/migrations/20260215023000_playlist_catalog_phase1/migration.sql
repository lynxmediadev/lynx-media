-- 032 catalog -> playlists (phase 1)

DO $$
BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CLIENT';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Playlist"
ADD COLUMN "publicId" CITEXT;

UPDATE "Playlist"
SET "publicId" = "id"
WHERE "publicId" IS NULL;

ALTER TABLE "Playlist"
ALTER COLUMN "publicId" SET NOT NULL;

ALTER TABLE "Playlist"
ADD COLUMN "isMainCatalog" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "embedEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isAutoAllTracks" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "Playlist_publicId_key" ON "Playlist"("publicId");
CREATE INDEX "Playlist_publicId_idx" ON "Playlist"("publicId");
CREATE INDEX "Playlist_isMainCatalog_visibility_status_updatedAt_idx"
  ON "Playlist"("isMainCatalog", "visibility", "status", "updatedAt");

CREATE TABLE "PlaylistViewer" (
  "playlistId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlaylistViewer_pkey" PRIMARY KEY ("playlistId","userId")
);

ALTER TABLE "PlaylistViewer"
  ADD CONSTRAINT "PlaylistViewer_playlistId_fkey"
  FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlaylistViewer"
  ADD CONSTRAINT "PlaylistViewer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PlaylistViewer_userId_createdAt_idx" ON "PlaylistViewer"("userId", "createdAt");
