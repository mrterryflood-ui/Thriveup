-- Trade Sims adaptive growth path (task: mastery gating, weakness tracking,
-- stretch tiers, tutor history).
--
-- Delta-only, IDEMPOTENT migration: this project has historically synced
-- schema with `drizzle-kit push` (no prior migration files), so existing
-- databases already contain every other table. Every statement here is
-- guarded so the migration is safe to apply to:
--   * an existing production/dev database (pre- or post-push), and
--   * a fresh database after the full schema push.

ALTER TABLE "trade_sims_lesson_progress" ADD COLUMN IF NOT EXISTS "solo_passed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_sims_lesson_progress" ADD COLUMN IF NOT EXISTS "stretch_passed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_sims_lesson_progress" ADD COLUMN IF NOT EXISTS "mastery_override" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "trade_sims_lesson_progress" ADD COLUMN IF NOT EXISTS "override_note" text;--> statement-breakpoint
ALTER TABLE "trade_sims_lesson_progress" ADD COLUMN IF NOT EXISTS "weak_concepts" jsonb;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trade_sims_attempt_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"anon_session_id" varchar(64),
	"lesson_id" integer NOT NULL,
	"tier" varchar(16) DEFAULT 'standard' NOT NULL,
	"passed" boolean NOT NULL,
	"missed_concepts" jsonb,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "trade_sims_attempt_events" ADD CONSTRAINT "trade_sims_attempt_events_lesson_id_trade_sims_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."trade_sims_lessons"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trade_sims_attempts_user_lesson" ON "trade_sims_attempt_events" USING btree ("user_id","lesson_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trade_sims_attempts_anon_lesson" ON "trade_sims_attempt_events" USING btree ("anon_session_id","lesson_id");
