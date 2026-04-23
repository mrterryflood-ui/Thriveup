# TCAF Benefits Enrollment Collaborative

**Request:** $1,000,000 over 24 months · **Match:** $200,000 (20%) · **Region:** Travis, Williamson, Hays, Bastrop, Caldwell · **Primary County:** Travis
**Live hub:** [lifetransitionsaid.org/st-davids](https://lifetransitionsaid.org/st-davids) — *click to experience the platform St. David's would fund*

---

## The Gap

Tens of thousands of 5-county residents are eligible for SNAP, WIC, Medicaid, CHIP, ACA, EITC, CTC, SSI, and SSDI and don't receive them. SNAP and Medicaid take-up trail eligibility by double digits; 35–40% of EITC-eligible filers never claim. Applications are long, fragmented across 9+ portals, English-default, and scheduled around bank hours families do not have. Maria, a Caldwell mother of two, was eligible for Medicaid, WIC, and EITC for three years — in 15 minutes on her phone, in Spanish, she enrolled in all three, capturing ~$8,400/year her family had been leaving on the table.

## The Experience (click the link above)

One 15-minute intake, in English, Spanish, Vietnamese, Mandarin, and Arabic, screens all 9 benefits at once, routes to the right portal with deep-links, captures receipts, and runs denial-to-appeal. Any CHW, promotora, school liaison, pastor, FQHC staffer, or resident on a personal phone runs the same flow. Partners embed the same intake on their sites — no partner pays, no partner builds their own stack.

## The Infrastructure (what's already running in production)

- **ChainWeb** — citation-traceable evidence engine. Every county-, ZIP-, and tract-level number chains to a primary federal source (Census ACS, CDC PLACES, ATSDR SVI, HUD CHAS, FBI CDE). 955 live federal data connections across 67+ agencies.
- **Two front doors, one network** — residents can enter at `lifetransitionsaid.org/st-davids` or TCAF's navigator hub at `/st-davids`. Same intake, same counties, same catalog.
- **RPLICE** (Reciprocal Platform-Linked Intelligence & Coordination Exchange) — authenticated peer-mirror event bus keeps both sites in sync in real time. Deduplicated on `peer | residentRef | program | status`, so **a resident enrolled once is counted once** — verified end-to-end.
- **Live Network View endpoint** publishes `localOwned`, `peerMirrored`, `networkTotal` broken out by peer, benefit, and county. St. David's can audit the count at any moment.

## 24-Month Metrics

| Metric | Target |
|---|---|
| Residents enrolled in ≥1 new benefit | **18,000+** |
| Share from rural Bastrop + Caldwell | **≥40%** |
| Captured annual benefit value to households | **$24M+** |
| 6-month retention | **≥85%** |
| Appeal-win rate on initial denials | **≥70%** |
| Network count integrity | **Single deduplicated total**, auditable live |
| Renewal matrix to St. David's | **Every 90 days** — County × Area × Language |

## Partners, Fidelity, Sustainability

Confirmed: CommUnityCare, Lone Star Circle of Care, Central Health, Foundation Communities, El Buen Samaritano. MOUs in development with Austin ISD, Hays CISD, Bastrop ISD, faith networks, and county HHS. Active HHSC Community Partner Program Level 1. 30-day MAP-GAP fidelity cycle with CFIR + RE-AIM checks. External evaluation by Dell Medical School / UT School of Social Work under IRB-reviewed protocol with quarterly public dashboards. Sustainability: HHSC CPP reimbursements, Medicaid 1115-waiver navigator billing, ongoing TCAF infrastructure investment. Match: $120K in-kind partner clinical staff time + $80K TCAF platform infrastructure.

---

**Legal Entity:** The Collaborative Advocate Foundation (Texas nonprofit corporation; 501(c)(3) determination pending) · **UEI:** KDDVD1FGLW35
**Live Platform:** [lifetransitionsaid.org/st-davids](https://lifetransitionsaid.org/st-davids)
