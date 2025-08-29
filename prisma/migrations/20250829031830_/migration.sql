-- CreateIndex
CREATE INDEX "Track_createdAt_id_idx" ON "public"."Track"("createdAt", "id");

-- CreateIndex
CREATE INDEX "Track_moods_idx" ON "public"."Track" USING GIN ("moods");

-- CreateIndex
CREATE INDEX "Track_uses_idx" ON "public"."Track" USING GIN ("uses");
