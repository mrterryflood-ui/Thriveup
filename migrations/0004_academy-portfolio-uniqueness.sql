-- One portfolio row per (user, stock): merge any duplicate holdings (sum
-- shares, weighted-average buy price), then enforce uniqueness so first-buy
-- races collapse at the DB level. Idempotent.
WITH keepers AS (
  SELECT DISTINCT ON (user_id, stock_id) id, user_id, stock_id
  FROM academy_portfolios
  ORDER BY user_id, stock_id, created_at ASC, id ASC
), dup_totals AS (
  SELECT k.id AS keeper_id,
         SUM(p.shares) AS extra_shares,
         SUM(p.shares * p.avg_buy_price) AS extra_cost
  FROM academy_portfolios p
  JOIN keepers k ON k.user_id = p.user_id AND k.stock_id = p.stock_id AND p.id <> k.id
  GROUP BY k.id
)
UPDATE academy_portfolios p
   SET avg_buy_price = CASE WHEN p.shares + d.extra_shares > 0
         THEN ROUND((p.shares * p.avg_buy_price + d.extra_cost) / (p.shares + d.extra_shares), 2)
         ELSE p.avg_buy_price END,
       shares = p.shares + d.extra_shares
  FROM dup_totals d
 WHERE p.id = d.keeper_id;

WITH keepers AS (
  SELECT DISTINCT ON (user_id, stock_id) id, user_id, stock_id
  FROM academy_portfolios
  ORDER BY user_id, stock_id, created_at ASC, id ASC
)
DELETE FROM academy_portfolios p
 USING keepers k
 WHERE k.user_id = p.user_id AND k.stock_id = p.stock_id AND p.id <> k.id;

DO $$ BEGIN
  ALTER TABLE academy_portfolios ADD CONSTRAINT academy_portfolios_user_stock_unique UNIQUE (user_id, stock_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;
