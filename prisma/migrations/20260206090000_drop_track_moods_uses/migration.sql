-- Drop legacy arrays now migrated to Tag/TrackTag
ALTER TABLE "Track"
  DROP COLUMN IF EXISTS "moods",
  DROP COLUMN IF EXISTS "uses";
