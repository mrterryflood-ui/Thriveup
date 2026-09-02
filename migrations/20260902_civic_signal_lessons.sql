CREATE TABLE IF NOT EXISTS "civic_signal_lessons" (
  "id" varchar(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson" text NOT NULL,
  "topic" varchar(100) NOT NULL DEFAULT 'general',
  "state" varchar(2) NOT NULL DEFAULT 'US',
  "source" varchar(100) NOT NULL DEFAULT 'civic_signal',
  "confidence" varchar(20) NOT NULL DEFAULT 'moderate',
  "program_ids" jsonb,
  "roi_implication" text,
  "content_hash" varchar(64) NOT NULL,
  "received_at" timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "civic_signal_lessons_content_hash_uq"
  ON "civic_signal_lessons" ("content_hash");

CREATE INDEX IF NOT EXISTS "civic_signal_lessons_topic_state_received_idx"
  ON "civic_signal_lessons" ("topic", "state", "received_at");