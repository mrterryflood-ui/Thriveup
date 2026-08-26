# Studio operational-data lifecycle

## Purpose

The Studio builder is declarative-only. It never receives source code, shell
commands, SQL, custom routes, provider credentials, or executable artifacts.
Generated candidates require administrator review, validation, and explicit
publication.

## Shared multi-instance controls

- Builder and record abuse limits use atomic PostgreSQL rate-window rows rather
  than process memory. The limit is therefore shared by every application
  instance and responds with `Retry-After` when exceeded.
- Public manifest cache entries are checked against a database-backed published
  revision before use. Publishing writes the shared revision only after the
  manifest row is inserted, so another instance does not serve its stale local
  entry.

## Retention and capacity

| Data | Retention | Active capacity | Handling |
| --- | --- | --- | --- |
| Studio audit events | 730 days | 50,000 | Immutable until expiry; the server purges only expired rows and pauses consequential changes if the active capacity is exhausted. |
| Metadata-only import inventories | 90 days | 2,000 | Immutable until expiry; the server purges only expired rows and rejects new inventories when active capacity is exhausted. |
| Shared rate windows | 2 minutes | TTL-bounded | Expired rows are removed by the scheduled Studio maintenance sweep. |
| Organization records | Module-declared 1–365 days | 1,000 per organization/module | Existing organization retention sweep and scoped access rules apply. |

Retention is server-derived at creation time. Public module submissions retain
only declared field keys in audit metadata, never submitted values or identity.
No production-data operation is authorized by this document.