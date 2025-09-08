-- CreateIndex
CREATE INDEX "LicensingRequest_createdAt_status_idx" ON "public"."LicensingRequest"("createdAt", "status");

-- CreateIndex
CREATE INDEX "LicensingRequest_assignee_idx" ON "public"."LicensingRequest"("assignee");
