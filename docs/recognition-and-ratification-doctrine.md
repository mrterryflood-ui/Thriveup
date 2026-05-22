# Recognition-and-Ratification Doctrine

**Working name:** Recognition-and-Ratification (R&R) implementation doctrine.
**Authored by:** Dr. Terry D. Flood Sr., President, The Collaborative Advocate Foundation (TCAF). Synthesized via RPLICE cross-literature scan, 2026-05-22.
**Status:** Original synthesis. Not yet in the implementation-science literature as a single named doctrine. Cite this document until peer-reviewed.

---

## The doctrine, in one sentence

**Communities are already adapting. The job of the scientific/policy briefing apparatus is to see those adaptations, name the people doing them, and bring them into the fold — with dignity, legal cover, real pay, and durability — because that is the only path that actually moves the counterfactual; any approach that displaces existing adaptation is fighting a current rather than riding one.**

---

## Why this is novel (RPLICE's finding)

The doctrine sits at the intersection of eight existing strands, none of which compile to the full claim:

| Strand | Field | What it gets right | What it misses |
|---|---|---|---|
| **Positive Deviance** (Sternin, Pascale, Singhal; Save the Children Vietnam 1990s → *The Power of Positive Deviance*, 2010) | Public health, org behavior | "Find the families/communities already succeeding against the odds and amplify what they're doing." | Discovery method, not the central job of the briefing apparatus. Stops short of legalize-and-resource. |
| **Harm reduction** (Marlatt; Strang) | Substance use, sexual health | "Meet people where they are; legitimize the safer version of what they're already doing instead of suppressing it." | Domain-trapped in drugs/HIV. Has not generalized to a broader theory of implementation. |
| **Community Health Workers / task-shifting** (WHO; Lewin et al. Cochrane; Earth Institute 1M CHWs report) | Global health systems | Communities were already doing this work informally; the policy move was to recognize, train, pay, and integrate. | Framed as a labor/workforce intervention, not as a meta-principle of how implementation should always work. |
| **Asset-Based Community Development** (McKnight & Kretzmann, 1993) | Community development | "Start from what the community already has, not what it lacks." | Doesn't connect to the policy/briefing/counterfactual machinery. Stays at community-organizing layer. |
| **Diffusion of Innovations — reinvention** (Rogers, 1962/2003, esp. ch. 5–6) | Sociology, innovation studies | Users modifying an innovation as they adopt it is normal, expected, predictive of sustained adoption. | Frames reinvention as adopter behavior, not as a target the formal system should chase and codify. |
| **FRAME / FRAME-IS** (Stirman 2019; Miller 2021) | Implementation science | Vocabulary for adaptations; rates whether they preserve fidelity. | Backwards-facing: documents adaptations after the fact. Doesn't treat un-documented community adaptation as the evidence input. |
| **Street-level bureaucracy** (Lipsky, 1980) | Public administration | Policy is what frontline actors actually do, not what the statute says — they're already adapting. | Descriptive, sometimes elegiac. Doesn't prescribe "and the policy apparatus should chase and ratify those adaptations." |
| **Practice-based evidence** (Green; Ammerman et al., 2014, AJPH) | Public health, primary care | Explicit inversion of EBP: practitioners are doing things that work; document them and build evidence around them. | Methodological piece. Doesn't take the policy/briefing leap. |

**Honorable mentions:** prefigurative politics (social-movement theory); co-production of services (Ostrom; Boyle).

---

## What's actually new (the three contributions)

### 1. The mechanism lives at the BRIEFING layer, not the intervention layer.
Every prior strand acts on the community or the practitioner. R&R says the **scientific/policy briefing apparatus is the actor** — its job is to do the seeing, the translating, and the resourcing. That re-positions implementation science as a **recognition-and-ratification function** rather than a design-and-deploy function. Not cleanly stated in the IS literature.

### 2. The dignity clause as a hard non-displacement constraint.
"Bring it into the fold with dignity — not displace it." This is a normative constraint that prior strands leave implicit. Codifying non-displacement as part of the mechanism rules out the standard failure mode where formalization captures, professionalizes, and ultimately kills the informal practice. Recurring failure stories: CHW → over-medicalized; harm-reduction → clinic-captured; peer-support → clinician-supervised-protocol; doulas → hospital-employed-and-defanged.

### 3. The counterfactual claim is the bite.
R&R is not one way to do implementation. R&R asserts it is **the only path that actually moves the dependent variable**, because any approach that displaces existing adaptation is fighting a current rather than riding one. This is a **falsifiable, testable thesis** — and the right answer to "how does implementation science account for community wisdom?"

---

## Operating implications (how to apply)

When the briefing apparatus (this platform) produces any regional or domain briefing:

1. **See the adaptation that's already there.** Name the people doing it — grandmothers doing childcare, aunties doing eldercare, barbershops doing mental-health check-ins, churches doing food/funeral/immigration navigation, neighbors absorbing returning citizens, cousins doubling up the housing, promotoras doing diabetes outreach, peer-recovery folks holding the relapsing friend, family caregivers doing disability support, side-hustlers doing income smoothing, informal tutors doing literacy, doulas doing perinatal, faith volunteers doing immigration navigation.

2. **Frame the intervention as bringing them INTO the fold** — equipping, training, networking, credentialing, insuring, micro-granting, license-pathway-ing, channeling resources — so they keep doing what they're already doing, but with dignity, legal cover, real pay, and durability.

3. **The success metric is not "we built a thing."** It is **"the people already holding this community got the backing they needed."**

4. **Apply across every domain** — early care, behavioral health, reentry, workforce, food, housing, education, eldercare, immigration, disability. Same lens.

5. **Refuse the displacement trap.** Any proposal that professionalizes the function out of the hands of the existing adapters fails the dignity clause and likely fails the counterfactual.

---

## Where this shows up in the platform

- **Regional Briefing** (`/regional-briefing`) — system prompt in `server/regional-briefing-routes.ts buildSystemPrompt()` encodes the R&R lens into THE BAR section. Sections 4 / 6 / 7 must surface informal adapters by default in every domain.
- **RPLICE** (`/rplice-tools`) — CFIR + RE-AIM + fidelity assessments built around R&R: the "intervention" being assessed is recognition + ratification, not formal-system-build.
- **TCAF capabilities inventory** (`docs/grants/tcaf-capabilities-inventory-2026-05-17.md`) — should reference R&R as the operating doctrine.

---

## Defense lines (for capstone Q&A, funder review, peer challenge)

- "How is this different from Positive Deviance / Harm Reduction / ABCD / CHW models?" → They act on the community or the practitioner. R&R puts the duty on the policy/briefing apparatus and adds non-displacement as a binding constraint.
- "Where's your evidence?" → R&R is a synthesis claim. The component strands are evidence-rich. The novel synthesis is testable: any intervention that displaces existing adaptation should show poorer durability than one that ratifies it. Cite Rogers ch. 5–6 (reinvention predicts sustained adoption) and Stirman (adaptation prevalence is the norm) as nearest-neighbor evidence.
- "Isn't this just romanticizing the informal?" → No. The dignity clause is the firewall against romanticization on one side and capture-and-defang on the other. It demands real pay, legal cover, training, and durability — not "thank the grandmother for her service."
- "Where does this fit on the capstone?" → "Meeting Veterans Where They Already Are: A Trial of App-Based, Community-Embedded Suicide Prevention" — the M2C Transition app is the recognition-and-resourcing apparatus; the 57.3%-not-in-VA-care + the 10-minute window are the evidence that the formal system is missing what veterans are already doing (peer networks, faith/hunting/fishing communities, declining VA care).

---

## Citation (use until peer-reviewed)

Flood, T. D., Sr. (2026). *Recognition-and-Ratification: A briefing-layer doctrine for implementation science.* The Collaborative Advocate Foundation. Internal working paper, May 22, 2026.

---

## Provenance

Synthesized in conversation with RPLICE (Research-to-Practice Lifecycle Implementation & Community Evidence) cross-evaluation, May 22, 2026. Literature scan covered the eight strands above plus prefigurative politics and co-production.
