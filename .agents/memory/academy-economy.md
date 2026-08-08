---
name: Academy economy server-authoritative rules
description: Invariants for the academy virtual-money system (wallet, stocks, campus funding) and how to verify them.
---

# Academy economy invariants

- Virtual money is server-authoritative: clients never supply amounts or prices; rewards must be idempotent at the DB level, and every mutation runs in one transaction locking **every** row it validates against (wallet AND project — locking only the wallet still allows cap races).
- Server-owned derived fields (funded totals, caps) must never be writable through generic create/update routes, and *all* mutations of a capped entity — including cap reductions — must go through the same locked transaction, or a reduction can interleave with funding.
- Entities that are logically one-per-user need a DB uniqueness constraint, or concurrent creates make the model ambiguous.
- Simulated prices must stay labeled as simulated in both API payloads and UI.
- Progress-driven rewards (adventure/scenario nodes) must lock the progress row and only accept the CURRENT step — otherwise replayed steps farm the reward even when amounts are server-authored.
- Dedup migrations for rows with dependents must reassign/merge dependents and balances before deleting, or the FK aborts the migration.

**Why:** virtual money is only trustworthy if forging, replaying, and racing are all impossible at the DB level; partial fixes (validate-before-lock, unlocked sibling mutation paths, client-triggerable reward endpoints) each reopened the hole.
**How to apply:** every new money path gets lock → re-read → validate → mutate → ledger in one transaction, plus a concurrency race test in the economy verifier and an unauthenticated security probe.
