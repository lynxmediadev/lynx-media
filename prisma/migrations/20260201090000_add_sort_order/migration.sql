-- Add sortOrder to publishing and master shares
ALTER TABLE "PublishingShare" ADD COLUMN "sortOrder" INTEGER;
ALTER TABLE "MasterShare" ADD COLUMN "sortOrder" INTEGER;
