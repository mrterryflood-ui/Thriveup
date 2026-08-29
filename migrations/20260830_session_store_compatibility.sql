-- The auth session store is intentionally created by the migration runner so
-- a database that was provisioned without connect-pg-simple's auto-create
-- behavior can still serve login/session requests.

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire"
  ON sessions (expire);