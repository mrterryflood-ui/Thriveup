-- Academy economy integrity: enforce one wallet and one campus project per
-- user at the DB level so concurrent first-creates can't produce duplicates
-- and ON CONFLICT upserts work. Idempotent: safe to run against a database
-- that already has the constraints (dev push) or duplicate rows (old data).

-- 1. Reconcile duplicate wallets BEFORE deleting anything:
--    keep one canonical wallet per user (highest total_earned, then oldest),
--    reassign all ledger rows to it, and merge the duplicate balances/totals
--    into it so no money or history is lost.
WITH keepers AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM academy_wallets
  ORDER BY user_id, total_earned DESC, created_at ASC, id ASC
)
UPDATE academy_transactions t
   SET wallet_id = k.id
  FROM academy_wallets w
  JOIN keepers k ON k.user_id = w.user_id
 WHERE t.wallet_id = w.id AND w.id <> k.id;

WITH keepers AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM academy_wallets
  ORDER BY user_id, total_earned DESC, created_at ASC, id ASC
), dup_totals AS (
  SELECT k.id AS keeper_id,
         SUM(w.balance) AS bal, SUM(w.total_earned) AS earned,
         SUM(w.total_invested) AS invested, SUM(w.campus_contributed) AS contributed
  FROM academy_wallets w
  JOIN keepers k ON k.user_id = w.user_id AND w.id <> k.id
  GROUP BY k.id
)
UPDATE academy_wallets w
   SET balance = w.balance + d.bal,
       total_earned = w.total_earned + d.earned,
       total_invested = w.total_invested + d.invested,
       campus_contributed = w.campus_contributed + d.contributed
  FROM dup_totals d
 WHERE w.id = d.keeper_id;

-- Now the duplicates have no dependent rows and no unmerged value; drop them.
WITH keepers AS (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM academy_wallets
  ORDER BY user_id, total_earned DESC, created_at ASC, id ASC
)
DELETE FROM academy_wallets w
 USING keepers k
 WHERE k.user_id = w.user_id AND w.id <> k.id;

DO $$ BEGIN
  ALTER TABLE academy_wallets ADD CONSTRAINT academy_wallets_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

-- 2. Dedupe campus projects: keep the most-funded (then oldest) row. No other
--    table references academy_campus_projects, so a straight delete is safe.
DELETE FROM academy_campus_projects a USING academy_campus_projects b
 WHERE a.user_id = b.user_id AND a.id <> b.id
   AND (a.amount_funded < b.amount_funded
        OR (a.amount_funded = b.amount_funded AND a.created_at > b.created_at)
        OR (a.amount_funded = b.amount_funded AND a.created_at = b.created_at AND a.id > b.id));

DO $$ BEGIN
  ALTER TABLE academy_campus_projects ADD CONSTRAINT academy_campus_projects_user_id_unique UNIQUE (user_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;
