export type ActiveBidRubricLine = {
  criterion: string;
  weight: number;
  confidence: number;
  ourResponse: string;
  evidence?: string;
};

export type ActiveBid = {
  rfpId: string;
  grantId?: string | null;
  title: string;
  funder: string;
  deadline: string;
  deadlineIso: string;
  teamIds: string[];
  notes: string;
  submission: string;
  rubric: ActiveBidRubricLine[];
};

export function rescoreBid(bid: ActiveBid): { points: number; max: number; pct: number } {
  const scored = bid.rubric.filter(r => r.weight > 0);
  const points = scored.reduce((s, r) => s + r.weight * r.confidence, 0);
  const max = scored.reduce((s, r) => s + r.weight, 0);
  return { points: Math.round(points * 10) / 10, max, pct: max ? Math.round((points / max) * 100) : 0 };
}

export function daysUntil(iso: string): number {
  const d = new Date(iso).getTime();
  return Math.ceil((d - Date.now()) / (1000 * 60 * 60 * 24));
}

export function fitColor(pct: number): "default" | "secondary" | "destructive" {
  if (pct >= 80) return "default";
  if (pct >= 65) return "secondary";
  return "destructive";
}

export const ACTIVE_BIDS_SEED: ActiveBid[] = [
  {
    rfpId: "lwisd-2026-0400-26",
    title: "Professional Development, Assessment, Consultant, Training, Services & Materials",
    funder: "Lake Worth ISD (TX, 4A, ~3,200 students)",
    deadline: "June 4, 2026 at 2:00 PM CT",
    deadlineIso: "2026-06-04T14:00:00-05:00",
    teamIds: ["flood-tcaf", "hargrave-his"],
    notes: "K-12 multi-award vendor pool (5-year term). TCAF prime + HIS compliance sub. Hand-delivered or courier only — no email.",
    submission: "Sealed envelope, hand-delivered or courier, marked with company name + RFP number, to 6805 Telephone Rd, Lake Worth TX 76135. Sign every page of Standard Attributes/Certs/T&C packet.",
    rubric: [
      { criterion: "Purchase price", weight: 30, confidence: 0.90, ourResponse: "Tiered, transparent unit pricing per service line. Volume discounts at 25/50/100-seat thresholds. No per-student SaaS markup — flat campus license model.", evidence: "Pricing sheet in Tab 4, lines mapped to LWISD service categories." },
      { criterion: "Reputation of vendor / vendor's goods or services", weight: 15, confidence: 0.70, ourResponse: "TCAF: 501(c)(3) DETERMINED · 271 production data tables · 211 live pages · 721-grant intelligence engine. Cited national platform with TX pilot.", evidence: "Capability statement, IRS Letter 947, SAM ACTIVE (UEI KDDVD1FGLW35), platform screenshots." },
      { criterion: "Quality of vendor's goods or services", weight: 15, confidence: 0.95, ourResponse: "Implementation-science scaffolding (CFIR · RE-AIM · RPLICE). 90 trade-sim lessons, 39 CFIR constructs, AWS D1.1 alignment, FHIR/CDS-Hooks rigor.", evidence: "Quality narrative Tab 5; demo URLs gated behind district credentials." },
      { criterion: "Extent goods/services meet district needs", weight: 20, confidence: 0.85, ourResponse: "Section-by-section crosswalk to LWISD's stated service categories: PD, assessment, consulting, training, services, materials. AI literacy + CTE/trades + FAFSA + bilingual family engagement (Talk Your Talk, 107 languages) all in-scope.", evidence: "Needs-fit crosswalk Tab 6 — LWISD scope language verbatim → TCAF deliverable." },
      { criterion: "Past relationship between district and vendor", weight: 5, confidence: 0.20, ourResponse: "No prior LWISD relationship — disclosed honestly. Mitigation: 3 TX district references (in pursuit), HIS compliance lead as named contract administrator de-risks first engagement.", evidence: "Reference letters Tab 7; HIS bio + sample compliance plan Tab 8." },
      { criterion: "Long-term cost to district", weight: 10, confidence: 0.90, ourResponse: "5-year TCO model: no per-seat creep, no licensed-curriculum renewal trap. Platform-hosted = district owns data + access at term end.", evidence: "5-year TCO worksheet Tab 4b." },
      { criterion: "Any other relevant factor specifically listed", weight: 5, confidence: 0.85, ourResponse: "Cybersecurity (SOC-2-aligned controls, 0-PHI-egress on health surfaces), data sovereignty, multilingual accessibility, post-contract data export.", evidence: "Tab 9 — security + accessibility + transition-out plan." },
      { criterion: "HUB status (informational, 0 pts scored)", weight: 0, confidence: 0, ourResponse: "Not HUB-certified at submission; certification path noted.", evidence: "N/A" },
      { criterion: "TX-based (informational, 0 pts scored)", weight: 0, confidence: 1, ourResponse: "TCAF principal office: Pflugerville, TX 78660 (Travis County).", evidence: "IRS Letter 947 address; SAM record." },
    ],
  },
  {
    rfpId: "sedgwick-ancillary-2026",
    title: "Employee Ancillary Benefits — Weight Loss / Weight Management",
    funder: "Sedgwick County, KS",
    deadline: "June 2, 2026",
    deadlineIso: "2026-06-02T17:00:00-05:00",
    teamIds: ["flood-tcaf", "vann", "love-clinic", "hargrave-his"],
    notes: "Population-health outcomes, measurable ROI, behavioral engagement, GLP-1 oversight, reporting analytics.",
    submission: "Per Sedgwick County procurement instructions (verify exact channel + sealed-bid requirements before submission).",
    rubric: [
      { criterion: "Clinical capability + GLP-1 oversight", weight: 25, confidence: 0.90, ourResponse: "Love Clinic (Dr. Chela Love, DNP/FNP) — bilingual primary care + GLP-1 medication oversight. Named clinical lead.", evidence: "Love Clinic capability statement + DNP credential + state license." },
      { criterion: "Behavioral engagement + coaching", weight: 20, confidence: 0.85, ourResponse: "Vanntastic (Dr. J. Michelle Vann) — wellness coaching, mindset, BIPOC women's health programming.", evidence: "Vanntastic coaching curriculum + author bio." },
      { criterion: "Reporting + outcomes platform", weight: 20, confidence: 0.90, ourResponse: "TCAF platform: participant engagement tracking, outcome receipts, RPLICE scaffolding, donor/employer reporting, FHIR-aware data layer.", evidence: "Platform demo + sample employer dashboard." },
      { criterion: "Compliance + contract administration", weight: 15, confidence: 0.85, ourResponse: "HIS (Eric Hargrave) — named compliance lead, 2 CFR Part 200, sub administration, audit-ready documentation.", evidence: "HIS capability statement + sample compliance plan." },
      { criterion: "Price + long-term value", weight: 15, confidence: 0.70, ourResponse: "Per-enrollee pricing with outcome-tied success fees. Multi-year TCO favorable vs. fragmented vendor stack.", evidence: "Pricing sheet + TCO worksheet." },
      { criterion: "Other relevant", weight: 5, confidence: 0.80, ourResponse: "Bilingual delivery, data sovereignty, ethical-AI guardrails (no PHI egress; HITL default-on).", evidence: "Security + ethics addendum." },
    ],
  },
];
