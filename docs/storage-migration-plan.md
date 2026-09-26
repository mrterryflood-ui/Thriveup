# Replit object storage to Vercel Blob plan

## Source inventory

- `server/replit_integrations/object_storage/objectStorage.ts`: Replit-local sidecar credentials, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS`, object normalization and retrieval.
- `server/replit_integrations/object_storage/objectAcl.ts`: `custom:aclPolicy` metadata with visibility, owner, and ACL rules.
- `server/replit_integrations/object_storage/routes.ts`: `POST /api/uploads/request-url` and `GET /objects/*path`.
- Consumers: `server/org-documents-routes.ts`, `server/foster-youth-intake-routes.ts`, `client/src/hooks/use-upload.ts`, `client/src/components/multi-file-upload.tsx`, and `client/src/pages/org-documents-library.tsx`.

## Target design

Use a **private** Vercel Blob store. Private Blob requires authenticated read/write access; on Vercel, OIDC credentials are automatically rotated. Downloads must pass through application authorization or narrowly scoped signed URLs, not become public URLs ([private storage](https://vercel.com/docs/vercel-blob/private-storage), [security](https://vercel.com/docs/vercel-blob/security)).

Create a PostgreSQL `stored_objects` mapping in a future additive migration: source bucket/key/object path; target pathname/URL/version; content type/size/SHA-256; owner user ID; organization ID; visibility; serialized ACL policy; source reference table/ID; migration state; timestamps. The mapping, rather than a Blob URL alone, enforces equivalent authorization and supports rollback.

## Migration procedure and gates

1. **Inventory gate:** owner verifies actual production buckets/prefixes and produces a restricted manifest. Include source key, app path, MIME type, bytes, hash, ACL metadata, owner/org relation, DB references, and orphan/missing status.
2. **Design gate:** map every source ACL to target authorization code and map each file-reference table. Decide whether a source-public object remains public; default to private.
3. **Sandbox gate:** create a private Blob sandbox only after a separate approval. Test type/size limits, direct client upload (for files above Vercel Functions’ 4.5 MB request-body limit), owner/org access, denial, deletion, and audit logs. Vercel recommends client uploads for larger files ([server uploads](https://vercel.com/docs/vercel-blob/server-upload)).
4. **Rehearsal gate:** copy only a restricted test subset, verify hash/size/content type/metadata/database references, and test all consumers against Preview.
5. **Cutover gate:** perform final delta copy during approved write window; update reference mapping transactionally; validate; keep Replit source objects unchanged through rollback period.

No Blob store, files, URLs, source deletions, or storage environment variables are created by this branch.
