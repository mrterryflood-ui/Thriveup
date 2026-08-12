-- Gun Violence Registry tables
-- gun_violence_incidents: geography + type + counts only; no victim PII.
-- gun_violence_imports: audit log for every import batch.
-- Both are idempotent (CREATE TABLE IF NOT EXISTS + DO $$ BEGIN ... END $$).

CREATE TABLE IF NOT EXISTS gun_violence_incidents (
  id              VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id     VARCHAR(255) NOT NULL,
  data_source     VARCHAR(100) NOT NULL,
  occurred_at     TIMESTAMP,
  latitude        REAL,
  longitude       REAL,
  zip             VARCHAR(20),
  city            VARCHAR(100),
  ward            VARCHAR(50),
  victim_count    INTEGER DEFAULT 1,
  fatal_count     INTEGER DEFAULT 0,
  incident_type   VARCHAR(100),
  import_id       VARCHAR(100),
  imported_at     TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  CREATE UNIQUE INDEX gvi_incident_source_uq
    ON gun_violence_incidents (incident_id, data_source);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS gun_violence_imports (
  id                    VARCHAR(100) PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source           VARCHAR(100) NOT NULL,
  record_count          INTEGER NOT NULL,
  imported_at           TIMESTAMP DEFAULT NOW(),
  imported_by_user_id   INTEGER,
  notes                 TEXT
);
