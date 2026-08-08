-- Academy stock daily-simulation idempotency marker.
--
-- Adds the UTC calendar date of the last applied daily price move to
-- academy_stocks. The simulate endpoint (POST /api/academy/stocks/simulate)
-- uses this to advance the market at most once per day: if a stock's
-- last_simulated_date already equals today's UTC date, the move is skipped, so
-- repeated calls on the same day no longer compound the price.
--
-- Delta-only, IDEMPOTENT: safe to run repeatedly and against a database that
-- already received the column via drizzle-kit push.

ALTER TABLE "academy_stocks" ADD COLUMN IF NOT EXISTS "last_simulated_date" varchar(10);
