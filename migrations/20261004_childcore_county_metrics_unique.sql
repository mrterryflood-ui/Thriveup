-- ChildCORE sends a current snapshot every 30 minutes. Keep one authoritative
-- row per county so retries and concurrent deliveries cannot grow the table or
-- make freshness ambiguous.
DELETE FROM childcore_county_metrics older
USING childcore_county_metrics newer
WHERE older.fips_code = newer.fips_code
  AND (
    older.received_at < newer.received_at
    OR (older.received_at = newer.received_at AND older.id < newer.id)
  );

CREATE UNIQUE INDEX IF NOT EXISTS childcore_county_metrics_fips_unique
  ON childcore_county_metrics (fips_code);