-- E-sign external-invitee signing token.
--
-- Adds the per-document random token that lets an off-platform recipient open
-- and sign exactly one document via the public token-scoped endpoints
-- (/api/esign/invite/:id). Previously this column existed only in
-- shared/schema.ts and the dev database (added via ad-hoc SQL), so
-- existing/production databases would error on inserts/reads.
--
-- Delta-only, IDEMPOTENT: safe to run repeatedly and against a database that
-- already received the column via drizzle-kit push or the earlier ad-hoc SQL.

ALTER TABLE "document_signatures" ADD COLUMN IF NOT EXISTS "signing_token" varchar(128);
