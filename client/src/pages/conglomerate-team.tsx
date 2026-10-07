import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Users, Building2, Stethoscope, FileCheck2, GraduationCap, HeartHandshake, AlertTriangle, CheckCircle2, ExternalLink, Calendar, Target, Trophy } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ACTIVE_BIDS_SEED, rescoreBid as rescore, daysUntil, fitColor, type ActiveBid, type ActiveBidRubricLine as RubricLine } from "@shared/active-bids";

type Partner = {
  id: string;
  name: string;
  org: string;
  entityType: string;
  location: string;
  lane: string;
  capabilities: string[];
  unitedWayPillars: ("Education" | "Income" | "Health")[];
  caveats?: string;
  icon: typeof Users;
};

const PARTNERS: Partner[] = [
  {
    id: "flood-tcaf",
    name: "Dr. Terry D. Flood Sr.",
    org: "The Collaborative Advocate Foundation (TCAF)",
    entityType: "501(c)(3) public charity · TX",
    location: "Pflugerville, TX",
    lane: "Digital platform, reporting, participant engagement, AI/data infrastructure",
    capabilities: [
      "ThriveUp platform (211 pages, 271 data tables, production-grade)",
      "AI literacy curriculum + tools (multi-model: GPT-5-nano, Claude Haiku, Gemini, DeepSeek)",
      "FAFSA + financial literacy modules",
      "90 trade-sim lessons across 6 skilled trades (CTE-ready)",
      "Talk Your Talk: 107-language reach (89 spoken + 18 sign) for ESL / bilingual family engagement",
      "Grant discovery + RFP-driven writing engine (live funding intelligence, AI fit-scored to partner profiles)",
      "Community Voice (map-based engagement → AI insights → impact stories)",
      "Workforce + reentry tooling (RNR/CBI/NRRC frameworks)",
    ],
    unitedWayPillars: ["Education", "Income", "Health"],
    icon: GraduationCap,
  },
  {
    id: "hargrave-his",
    name: "Eric Hargrave",
    org: "Hargrave Innovative Solutions (HIS)",
    entityType: "For-profit · government services",
    location: "Kansas",
    lane: "Government contract management, compliance oversight, reporting, administrative support",
    capabilities: [
      "2 CFR Part 200 compliance administration",
      "Federal/state/local contract management",
      "Reporting coordination + audit-ready documentation",
      "Subcontractor administration + flow-down clauses",
      "RFP outreach + relationship management",
    ],
    unitedWayPillars: ["Income"],
    icon: FileCheck2,
  },
  {
    id: "vann",
    name: "Dr. J. Michelle Vann",
    org: "Sistahs Can We Talk Inc. (501(c)(3)) / Vanntastic Solutions LLC",
    entityType: "KS 501(c)(3) + for-profit coaching",
    location: "Wichita, KS",
    lane: "Wellness coaching, behavioral engagement, women's mindset, BIPOC women's health",
    capabilities: [
      "Wellness coaching (executive + community)",
      "BIPOC women's health programming (Healthy Me Initiative)",
      "Youth mentoring + digital storytelling",
      "Free cancer-screening events",
      "Published author (Healthy Plates, Stop the Merry-Go-Round, Help Along the Journey, From Supporting Role to Leading Lady)",
    ],
    unitedWayPillars: ["Health", "Education"],
    caveats: "Spouse COI on Iasis Christian Center — never list Iasis as applicant on City of Wichita or federal awards without disclosure.",
    icon: HeartHandshake,
  },
  {
    id: "love-clinic",
    name: "Dr. Chela Love, DNP, FNP",
    org: "Love Clinic & Med Spa",
    entityType: "For-profit clinical practice",
    location: "Wichita, KS",
    lane: "Bilingual primary-care clinical delivery, GLP-1 medication oversight, clinical referral",
    capabilities: [
      "Bilingual (English/Spanish) primary care",
      "GLP-1 medication oversight (weight management)",
      "Clinical referral coordination",
      "Behavioral-health-aware clinical workflow",
      "FNP-led care for underserved populations",
    ],
    unitedWayPillars: ["Health"],
    icon: Stethoscope,
  },
];

// Types + helpers + seed all live in shared/active-bids.ts. The seed below is
// kept only as a render fallback when the /api/active-bids query is loading or
// the table is empty — the DB is the source of truth.
const ACTIVE_BIDS_FALLBACK: ActiveBid[] = [
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
      { criterion: "Reputation of vendor / vendor's goods or services", weight: 15, confidence: 0.70, ourResponse: "TCAF: 501(c)(3) DETERMINED · 271 production data tables · 211 live pages · live funding intelligence engine. Cited national platform with TX pilot.", evidence: "Capability statement, IRS Letter 947, SAM ACTIVE (UEI KDDVD1FGLW35), platform screenshots." },
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

const UNITED_WAY_PITCH = [
  {
    pillar: "Education" as const,
    headline: "K-12 → workforce pipeline",
    bullets: [
      "ThriveUp AI literacy + STEM concepts (with real working physics simulators)",
      "Six skilled-trade lesson tracks (90 lessons total) — CTE-aligned",
      "FAFSA navigation + college-and-career readiness",
      "Bilingual family engagement via Talk Your Talk (107 languages)",
    ],
  },
  {
    pillar: "Income" as const,
    headline: "Workforce + financial stability",
    bullets: [
      "Mission Transition (M2C) — veteran-to-civilian workforce pathways",
      "Apprenticeship + trade certification pilots (target: 200 learners by Jul 1, 2026)",
      "Financial literacy modules + benefits navigation (LifeBridge)",
      "Reentry workforce alignment using RNR/CBI/NRRC frameworks",
    ],
  },
  {
    pillar: "Health" as const,
    headline: "Whole-person + behavioral health",
    bullets: [
      "Whole-Person Health Ecosystem (FHIR/CDS-Hooks, clinical-grade)",
      "SafeCogniCare — PHQ-9/GAD-7/C-SSRS/PCL-5/ACES screening (0-PHI-egress, HITL default-on)",
      "Black Maternal Health, Black Men's Health Hub, HerHealth Network",
      "Love Clinic clinical delivery (when teamed) for bilingual primary care + GLP-1",
    ],
  },
];

export default function ConglomerateTeamPage() {
  // DB is the source of truth shared with the AI writer engine. Fall back to
  // the bundled fallback seed so the dashboard never renders blank during the
  // first paint.
  const { data: bidsResp } = useQuery<{ bids: ActiveBid[] }>({ queryKey: ["/api/active-bids"] });
  const ACTIVE_BIDS: ActiveBid[] = (bidsResp?.bids && bidsResp.bids.length > 0)
    ? bidsResp.bids.map(b => ({ ...b, deadlineIso: typeof b.deadlineIso === "string" ? b.deadlineIso : new Date(b.deadlineIso as unknown as string | number | Date).toISOString() }))
    : ACTIVE_BIDS_FALLBACK;
  return (
    <div className="container max-w-6xl mx-auto py-10 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Users className="w-7 h-7 text-primary" />
          Teaming Network & Capabilities
        </h1>
        <p className="text-muted-foreground mt-2 max-w-3xl">
          Our delivery network. <strong>Teaming is per-proposal, based on lane fit</strong> — we do not assume a standing default team on every bid. The partner roster below shows who we can bring to the table; the active-bids panel shows who is actually named on each open RFP.
        </p>
      </div>

      <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div>
            <CardTitle className="text-base">Doctrine: per-proposal teaming + rubric-first writing</CardTitle>
            <CardDescription>No standing default team — partners are named RFP-by-RFP based on lane fit. Every response section maps to a scoring criterion in the funder's rubric. We write to reviewers, not end users.</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Tracking dashboard — sorted by deadline</CardTitle>
          <CardDescription>Honest self-rescore against each funder's rubric (sum of weight × confidence). Not marketing inflation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" data-testid="table-tracking">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b">
                  <th className="py-1.5 pr-2 font-medium">Funder / RFP</th>
                  <th className="py-1.5 px-2 font-medium w-28">Deadline</th>
                  <th className="py-1.5 px-2 font-medium w-20 text-center">Days left</th>
                  <th className="py-1.5 px-2 font-medium w-32 text-center">Rubric fit</th>
                  <th className="py-1.5 pl-2 font-medium w-44">Team</th>
                </tr>
              </thead>
              <tbody>
                {[...ACTIVE_BIDS].sort((a, b) => new Date(a.deadlineIso).getTime() - new Date(b.deadlineIso).getTime()).map(bid => {
                  const score = rescore(bid);
                  const days = daysUntil(bid.deadlineIso);
                  const team = bid.teamIds.map(id => PARTNERS.find(p => p.id === id)?.name.split(" ").slice(0, 2).join(" ")).filter(Boolean);
                  return (
                    <tr key={bid.rfpId} className="border-b last:border-b-0 align-top hover:bg-muted/30" data-testid={`tracking-${bid.rfpId}`}>
                      <td className="py-2 pr-2">
                        <a href={`#bid-${bid.rfpId}`} className="font-medium hover:underline">{bid.funder}</a>
                        <div className="text-xs text-muted-foreground">{bid.title.length > 70 ? bid.title.slice(0, 70) + "…" : bid.title}</div>
                      </td>
                      <td className="py-2 px-2 text-xs">{bid.deadline}</td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant={days <= 14 ? "destructive" : days <= 30 ? "secondary" : "outline"} data-testid={`days-${bid.rfpId}`}>{days}d</Badge>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <Badge variant={fitColor(score.pct)} data-testid={`fit-${bid.rfpId}`}>{score.pct}% · {score.points}/{score.max}</Badge>
                      </td>
                      <td className="py-2 pl-2 text-xs text-muted-foreground">{team.join(" · ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />Scan for new bids</CardTitle>
          <CardDescription>The grant-discovery engine pulls from Grants.gov · SAM.gov · USASpending · curated state/local/foundation — intelligently aligned to the community partners we serve.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="default" asChild data-testid="button-scan-grants">
            <Link href="/grants"><Target className="w-4 h-4 mr-1" />Browse all opportunities</Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-this-week">
            <Link href="/this-week"><Calendar className="w-4 h-4 mr-1" />This Week (Monday brief)</Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-my-grants">
            <Link href="/my-grants"><Trophy className="w-4 h-4 mr-1" />My Grants & Win Rate</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild data-testid="button-rfp-writer">
            <Link href="/grant-narrative">Open RFP-driven writer →</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Active bids — confirmed teams</CardTitle>
          <CardDescription>The actual team named on each open RFP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ACTIVE_BIDS.map(bid => {
            const team = bid.teamIds.map(id => PARTNERS.find(p => p.id === id)!).filter(Boolean);
            const score = rescore(bid);
            return (
              <div key={bid.rfpId} id={`bid-${bid.rfpId}`} className="border rounded-lg p-4 scroll-mt-20" data-testid={`bid-${bid.rfpId}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{bid.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{bid.funder}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="destructive"><Calendar className="w-3 h-3 mr-1" />{bid.deadline}</Badge>
                    <Badge variant={fitColor(score.pct)} className="text-xs">Rubric fit: {score.pct}% · {score.points}/{score.max}</Badge>
                  </div>
                </div>
                <p className="text-sm mt-2">{bid.notes}</p>
                <div className="mt-3">
                  <div className="text-xs text-muted-foreground mb-1">Named team:</div>
                  <div className="flex flex-wrap gap-2">
                    {team.map(p => (
                      <Badge key={p.id} variant="secondary" data-testid={`team-${bid.rfpId}-${p.id}`}>{p.name.split(" ").slice(0, 2).join(" ")} · {p.org.split("(")[0].trim().split(" ").slice(0, 3).join(" ")}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold text-sm">Reviewer rubric — our response per criterion</h4>
                    <Badge variant="outline" className="text-xs ml-auto">writing TO the scorers, not to end users</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse" data-testid={`rubric-${bid.rfpId}`}>
                      <thead>
                        <tr className="text-left text-xs text-muted-foreground border-b">
                          <th className="py-1.5 pr-2 font-medium">Scoring criterion</th>
                          <th className="py-1.5 px-2 font-medium w-14 text-center">Pts</th>
                          <th className="py-1.5 px-2 font-medium w-20 text-center">Self-rate</th>
                          <th className="py-1.5 px-2 font-medium">Our response (reviewer-facing)</th>
                          <th className="py-1.5 pl-2 font-medium">Evidence / tab</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bid.rubric.map((r, i) => (
                          <tr key={i} className="border-b last:border-b-0 align-top" data-testid={`rubric-row-${bid.rfpId}-${i}`}>
                            <td className="py-2 pr-2 font-medium">{r.criterion}</td>
                            <td className="py-2 px-2 text-center">
                              <Badge variant={r.weight >= 20 ? "default" : r.weight >= 10 ? "secondary" : "outline"} className="text-xs">{r.weight}</Badge>
                            </td>
                            <td className="py-2 px-2 text-center">
                              {r.weight > 0 ? (
                                <Badge variant={r.confidence >= 0.8 ? "default" : r.confidence >= 0.6 ? "secondary" : "destructive"} className="text-xs">{Math.round(r.confidence * 100)}%</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground">{r.ourResponse}</td>
                            <td className="py-2 pl-2 text-xs text-muted-foreground italic">{r.evidence ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t">
                          <td className="py-1.5 pr-2 text-xs text-muted-foreground font-medium">Total scored</td>
                          <td className="py-1.5 px-2 text-center"><Badge>{score.max}</Badge></td>
                          <td className="py-1.5 px-2 text-center"><Badge variant={fitColor(score.pct)}>{score.pct}%</Badge></td>
                          <td colSpan={2} className="py-1.5 pl-2 text-xs text-muted-foreground italic">{bid.submission}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Partner roster</CardTitle>
          <CardDescription>The pool we draw from. Each partner is named on a bid only when their lane materially fits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PARTNERS.map(p => {
            const Icon = p.icon;
            return (
              <div key={p.id} className="border rounded-lg p-4" data-testid={`partner-${p.id}`}>
                <div className="flex items-start gap-3">
                  <Icon className="w-8 h-8 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-sm text-muted-foreground">{p.org} · {p.location}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{p.entityType}</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.unitedWayPillars.map(pillar => (
                          <Badge key={pillar} variant="outline" className="text-xs">UW: {pillar}</Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm mt-2"><strong>Lane:</strong> {p.lane}</p>
                    <div className="mt-2">
                      <div className="text-xs text-muted-foreground mb-1">Capabilities:</div>
                      <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground">
                        {p.capabilities.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                    {p.caveats && (
                      <div className="mt-2 text-xs flex items-start gap-1 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                        <span><strong>Caveat:</strong> {p.caveats}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-blue-300 dark:border-blue-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />United Way alignment</CardTitle>
          <CardDescription>How this network maps to United Way's three impact pillars — Education, Income, Health — for chapter partnerships and pooled-funding pursuits.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {UNITED_WAY_PITCH.map(pillar => (
            <div key={pillar.pillar} data-testid={`uw-${pillar.pillar.toLowerCase()}`}>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default">{pillar.pillar}</Badge>
                <h4 className="font-semibold">{pillar.headline}</h4>
              </div>
              <ul className="text-sm space-y-0.5 list-disc list-inside text-muted-foreground ml-2">
                {pillar.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
          <Separator />
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" />Why United Way fits us (and we fit them)</h4>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
              <li>We deliver in all three UW pillars from a single operational platform — fewer vendors for a chapter to manage.</li>
              <li>Production-grade reporting + outcome tracking out of the box (donor receipts, participant engagement, RPLICE implementation-science scaffolding).</li>
              <li>Bilingual / multilingual reach (107 languages) supports UW's equity priorities and immigrant/refugee populations.</li>
              <li>Per-proposal teaming means a UW chapter gets exactly the partners needed for the local ask — clinical when health-led, coaching when wellness-led, compliance always.</li>
              <li>TCAF's 501(c)(3) status (public charity 170(b)(1)(A)(vi)) is compatible with UW funding flows — no fiscal-sponsor friction.</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button variant="default" asChild data-testid="button-find-uw-grants">
              <Link href="/grants?source=United Way"><ExternalLink className="w-4 h-4 mr-1" />Find United Way grants</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-open-writer">
              <Link href="/grant-narrative">Draft a UW response</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
