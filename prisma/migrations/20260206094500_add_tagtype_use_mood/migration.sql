-- Ensure enum TagType has MOOD and USE values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TagType' AND e.enumlabel = 'MOOD') THEN
    ALTER TYPE "TagType" ADD VALUE 'MOOD';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'TagType' AND e.enumlabel = 'USE') THEN
    ALTER TYPE "TagType" ADD VALUE 'USE';
  END IF;
END$$;
