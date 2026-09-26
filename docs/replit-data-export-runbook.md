# Production data export runbook (operator-only; do not run as part of inventory)

Destination: Convex + Vercel. This runbook preserves the existing PostgreSQL database and stored objects before a *separate* target-model migration. It does not switch traffic or credentials. **No command below has been run by the inventory author.** Keep the source and its backups intact.

## Safety gate

1. Obtain approval from the data owner and choose an encrypted, access-restricted **machine outside the public repository** for the export. Ensure enough disk capacity for a full backup and objects. No dumps, JSONL, manifests with identifiers, URL files, or key material belong in GitHub, chat, Replit project files, or Vercel build logs.
2. In Replit's **Database** tool, select **Production Database**, not Development. In its **Settings** tab, verify connection details and identify whether the running deployment uses this Replit-managed database or an external `DATABASE_URL`. Replit exposes production credentials there; view/copy them only into a secure operator environment, never here. If the app actually uses an external database, use that provider's snapshot/connection procedure instead; Replit's production catalog may not describe it. Note the source database identifier privately without posting the URL.
3. Review the Production Database backup/PITR status in the Database tool and take/confirm a restorable managed backup if available. This is separate from, and does not replace, the manual logical export below. Do not regenerate database credentials, migrate schemas, publish, or stop traffic for this inventory.
4. On the secure machine, install PostgreSQL client tools compatible with PostgreSQL 16 (`pg_dump`, `pg_restore`, `psql`) and verify `pg_dump --version`. Do not run `pg_dump` against a development URL. Use TLS requirements shown in the provider's Production Settings. If network policy blocks direct client access, use the provider-supported export facility; do not weaken security.

## Full PostgreSQL logical backup

The following commands are **examples for the approved operator to run later**. They are read-only against the source; the files they create contain sensitive data and must remain outside the repository. Enter the URL at the hidden prompt rather than pasting it into a tracked file or shell history. A command-line argument to `pg_dump` can be visible to other processes on a shared machine, so perform this only on a trusted, restricted machine; use a private service file/password manager if local policy requires stronger process-list isolation.

```bash
umask 077
OUT="$HOME/thriveup-export-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 "$OUT"
read -r -s -p 'Verified PRODUCTION PostgreSQL URL: ' SOURCE_DATABASE_URL; printf '\n'

# Confirm this is the intended production database before writing any archive.
psql "$SOURCE_DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc \
  "SELECT current_database(), current_setting('server_version'), current_user"

# Complete logical backup: schema, data, large objects, sequences and migration history.
pg_dump --dbname="$SOURCE_DATABASE_URL" --format=custom --blobs \
  --no-owner --no-acl --file="$OUT/production.dump"
pg_dump --dbname="$SOURCE_DATABASE_URL" --schema-only \
  --no-owner --no-acl --file="$OUT/schema.sql"
unset SOURCE_DATABASE_URL

# Inspect archive TOC without exposing records; retain checksums separately.
pg_restore --list "$OUT/production.dump" > "$OUT/archive.toc"
sha256sum "$OUT/production.dump" "$OUT/schema.sql" > "$OUT/checksums.sha256"
```

Confirm `pg_dump` exited successfully and that files are nonempty; the checksum only proves file integrity, **not restoreability**. Restore to a new **isolated, access-restricted PostgreSQL 16 test database** with `pg_restore --no-owner --no-acl --exit-on-error --dbname=<isolated-test-db>` and validate relationships/counts there; never point it at production. The SQL archive is the recovery format, **not** a direct Convex import. Retain the source even after a successful rehearsal.

### Catalog and row-count manifest

In the Replit **Production Database SQL/query** pane, or `psql` connected to the independently verified production endpoint, run these **read-only** queries and save the results only in the restricted export location. `pg_dump --schema-only` and `archive.toc` are the full-fidelity inventories; the queries make them reviewable:

```sql
SELECT current_setting('server_version') AS version;
SELECT nspname AS schema_name
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%' AND nspname <> 'information_schema'
ORDER BY 1;
SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY table_schema, table_name, ordinal_position;
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename, indexname;
SELECT n.nspname AS schema_name, t.relname AS table_name,
       c.conname, c.contype, pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
JOIN pg_class t ON t.oid = c.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
ORDER BY 1, 2, 3;
SELECT extname, extversion FROM pg_extension ORDER BY extname;
SELECT filename, applied_at FROM public.schema_migrations ORDER BY filename;
SELECT schemaname, relname AS table_name, n_live_tup AS planner_estimate,
       last_analyze, last_autoanalyze
FROM pg_stat_user_tables ORDER BY schemaname, relname;
```

**Do not interpret a zero planner estimate as an empty table.** The read-only Replit production replica returned zero for all `n_live_tup` values during this inventory. For reliable counts, after restoring the backup into the isolated test database, execute `SELECT count(*)` for each application table with a reviewed, schema-qualified allowlist; record those counts and compare them with an independently verified source count from the same snapshot. Large tables may need scheduled read-only count windows to avoid load. Full dumps across active writes are transactionally consistent for PostgreSQL, but object storage is a separate system; use a final reconciliation window for cross-system references.

## Object storage manifest and export

1. In Replit **App Storage/Object Storage**, inspect the **production** environment and each bucket/namespace that the app uses. Confirm it corresponds to the production `PRIVATE_OBJECT_DIR` and `PUBLIC_OBJECT_SEARCH_PATHS` roots used by `server/replit_integrations/object_storage/objectStorage.ts`. Record *names/counts privately*, not in this repository. The source code's storage client authenticates through a Replit localhost sidecar; its credentials/paths are not portable to Vercel. **Do not assume that the development workspace's SDK can see production objects.**
2. For every authorized production prefix, build a restricted JSONL/CSV manifest with `{environment,bucket,key,appObjectPath,contentType,size,sha256,customMetadata,aclPolicy,ownerId,organizationId,referencingTable,referencingId,visibility,exportStatus}`. `custom:aclPolicy` is object metadata (`server/replit_integrations/object_storage/objectAcl.ts`), not just a DB column. Join app paths to organization documents, foster-youth intake uploads, and other referencing records in the DB backup. Audit objects without DB references and DB references without objects; do not assume all are public.
3. Once the provider confirms an **authorized production-scoped** SDK/console export method, use the Replit App Storage UI download action for individual objects or a production-scoped SDK `list`/`getMetadata`/`download` loop for bulk objects. The existing app uses `@google-cloud/storage`: `objectStorageClient.bucket(bucketName).getFiles({prefix,autoPaginate:true})`, `file.getMetadata()` and `file.download({destination})` are the equivalent SDK calls. Run only from a trusted context with verified **production** bucket access, never by guessing a bucket name or using a development sidecar. The UI/SDK method available for bulk production access has **not** been verified; do not claim an export happened based on a development listing.
4. If using a script, derive the destination path from a safe manifest ID or hash, not raw object keys (which may contain traversal segments), and preserve the exact original key in the restricted manifest. Download files with private permissions; calculate SHA-256 of each local file; compare count/bytes/hash and `custom:aclPolicy` against the manifest. Encrypt and separately back up files and manifest; do not publicly expose private document URLs. Do not delete source objects, change ACLs, or overwrite names during enumeration.
5. The future destination storage provider has not been selected. Map each source key to a target file ID/URL in a crosswalk and implement equivalent access checks before testing a copy. Convex storage or Vercel Blob are possible destinations, **neither is implied by using Vercel for hosting**. Validate app DB references and private-read behavior on a test environment before owner approval of cutover.

## Reconciliation and handoff

- Store the DB dump, schema-only SQL, archive TOC, checksum file, read-only table/column/index/constraint/migration inventories, validated row counts, object manifest, exported objects and ID/key crosswalk together in restricted storage with retention controls.
- Cross-check users/roles, organization relations, applications/referrals, object references, and sensitive audit records; report missing/duplicate keys before target import. Preserve original Replit subject IDs as source identifiers; do not import active `sessions` as valid target sessions.
- A separate project must design the Convex schema and transform data, choose auth and file storage, port PostgreSQL-backed routes, rehearse import, then explicitly approve a write freeze/change capture and rollback plan. No target import or production change is authorized by this runbook.

Source documentation: [Replit SQL Database](https://docs.replit.com/features/data-and-storage/sql-database), [connection details](https://docs.replit.com/features/data-and-storage/connection-details), [data recovery](https://docs.replit.com/features/data-and-storage/data-recovery), [App Storage](https://docs.replit.com/features/data-and-storage/object-storage), and [App Storage JavaScript SDK](https://docs.replit.com/features/sdks/object-storage-javascript-sdk).