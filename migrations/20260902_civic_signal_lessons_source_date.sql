ALTER TABLE "civic_signal_lessons"
  ADD COLUMN IF NOT EXISTS "source_date" varchar(10);

ALTER TABLE "civic_signal_lessons"
  ADD COLUMN IF NOT EXISTS "sender_platform_id" varchar(100);

ALTER TABLE "civic_signal_lessons"
  ADD COLUMN IF NOT EXISTS "evidence_class" varchar(64)
  DEFAULT 'partner_supplied_adaptation_lesson';

UPDATE "civic_signal_lessons"
SET "source_date" = to_char("received_at", 'YYYY-MM-DD')
WHERE "source_date" IS NULL;

UPDATE "civic_signal_lessons"
SET "sender_platform_id" = 'legacy_civic_signal'
WHERE "sender_platform_id" IS NULL;

ALTER TABLE "civic_signal_lessons"
  ALTER COLUMN "source_date" SET NOT NULL;

ALTER TABLE "civic_signal_lessons"
  ALTER COLUMN "sender_platform_id" SET NOT NULL;

ALTER TABLE "civic_signal_lessons"
  ALTER COLUMN "evidence_class" SET NOT NULL;