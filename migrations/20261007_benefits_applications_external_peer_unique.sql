-- Peer enrollment mirrors must be idempotent under concurrent retries.
-- PostgreSQL unique constraints permit multiple NULLs, so local rows with no
-- peer identity remain unaffected.
DELETE FROM benefits_applications a
USING benefits_applications b
WHERE a.external_id IS NOT NULL
  AND a.peer_platform IS NOT NULL
  AND a.external_id = b.external_id
  AND a.peer_platform = b.peer_platform
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS benefits_applications_external_peer_uq
  ON benefits_applications (external_id, peer_platform);