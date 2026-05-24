# Topic: Ecosystem

The 15 public-facing platforms + caveats. Full DB-level catalog in `docs/ecosystem-catalog.md`.

---

## External count rule

**External count = 15, never 25.** (25 are in DB internally; 10 are not yet public services.)

## The 15 (public-facing)

1. **Whole-Person Health (WPH)** — behavioral safety floor
2. **Talk Your Talk (TYT)** — `talkyourtalk.net` (89 spoken + 18 sign = 107 languages/dialects)
3. **Sankofa Network** — health/community
4. **Black Maternal Health Network**
5. **Black Men's Health Hub**
6. **HerHealth Network** (Holistic Black Feminine Health Hub)
7. **SafeCogniCare** — cognitive/dementia
8. **Perfectly Different** — disability/IDD
9. **LifeBridge** — SDOH navigation
10. **Mission Transition (M2C)** — veterans/transition
11. **Minority Center of Excellence**
12. **ISSS** — Integrated Supports for Thriving Youth
13. **RPLICE / BetterScience** — Research-to-Practice Lifecycle Implementation & Community Evidence
14. **SafeReport** (safereports.net) — clinical/BH
15. **Civic Signal** — civic engagement

## Quintet to lead with

Talk Your Talk · Civic Signal · LifeBridge · ThriveUp Academy · Whole-Person Health.

## SafeReport detail (archive A3)

- safereports.net
- **Compliance-Grade AI for Clinical Settings**
- CDS / FHIR / CDS Hooks
- **0-PHI-egress** · **HITL-default-on**
- PHQ-9 / GAD-7 / C-SSRS / PCL-5 / ACES screening battery
- Part of behavioral-health stack

## Caveats

- **TYT row URL self-overwrites to `lexibridge.net`** on every heartbeat (real fix lives in TYT workspace)
- **10/25 DB rows aren't public services** (don't expose externally)
- Some URLs are shared: `implementationineducatio.com` hosts both ISSS + BetterScience
- Always **re-probe before linking** externally

## Editing rules

🚨 `ECOSYSTEM_PLATFORMS` array in `server/ecosystem-connector.ts:658` **overwrites DB on every startup**:
- Auto-syncs name/url/role/domain/description/capabilities/dataFlowConfig/grantAlignment (UPDATE)
- DELETEs DB rows not in the array
- `publicVisible` survives (kept from DB)
- **Edit BOTH** the array AND the DB when adding/renaming

## Hub pinger caveats

- False-positive: marks platforms "online" even when DNS fails or heartbeat >7 days stale
- `curl HTTP 000` = unbound custom domain (not necessarily down)
- Check `ecosystem_platforms.health_status` for ground truth

## Full DB catalog

→ `docs/ecosystem-catalog.md` (all 25 rows with publicVisible flags + heartbeat status + URL history)
