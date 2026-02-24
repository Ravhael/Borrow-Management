-- Migration: copy demo column to needDetails, then remove demo
BEGIN;

ALTER TABLE "Loans" ADD COLUMN IF NOT EXISTS "needDetails" JSONB;

-- copy values from demo into needDetails when present
UPDATE "Loans" SET "needDetails" = demo WHERE demo IS NOT NULL;

-- drop the old demo column (safe even if it doesn't exist)
ALTER TABLE "Loans" DROP COLUMN IF EXISTS demo;

COMMIT;
