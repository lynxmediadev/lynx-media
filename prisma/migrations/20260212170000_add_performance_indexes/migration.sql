-- Performance indexes for frequent read paths in edit/catalog/tag modules.

CREATE INDEX IF NOT EXISTS "Track_updatedAt_id_idx"
ON "Track"("updatedAt", "id");

CREATE INDEX IF NOT EXISTS "PublishingShare_trackId_role_sortOrder_idx"
ON "PublishingShare"("trackId", "role", "sortOrder");

CREATE INDEX IF NOT EXISTS "MasterShare_trackId_sortOrder_idx"
ON "MasterShare"("trackId", "sortOrder");

CREATE INDEX IF NOT EXISTS "Tag_type_name_idx"
ON "Tag"("type", "name");

CREATE INDEX IF NOT EXISTS "TrackTag_trackId_assignedAt_idx"
ON "TrackTag"("trackId", "assignedAt");

CREATE INDEX IF NOT EXISTS "TrackTag_tagId_assignedAt_idx"
ON "TrackTag"("tagId", "assignedAt");
