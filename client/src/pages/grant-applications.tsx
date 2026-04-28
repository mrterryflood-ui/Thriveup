import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ExternalLink,
  FileText,
  ShieldCheck,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Target,
  Heart,
  Brain,
  Scale,
} from "lucide-react";

const TODAY = new Date("2026-04-28T12:00:00Z");
const STORAGE_KEY = "tcaf-application-tracker-v1";

type Owner = "Abundant Life" | "TCAF" | "Joint";

interface ChecklistItem {
  id: string;
  label: string;
  owner: Owner;
  detail?: string;
}

interface Deadline {
  label: string;
  date: string; // ISO
  note?: string;
}

interface NarrativeSection {
  name: string;
  pageGuide?: string;
  owner: Owner;
}

interface Pkg {
  id: string;
  title: string;
  shortTitle: string;
  funder: string;
  cfda?: string;
  oppNumber?: string;
  ceiling: string;
  totalAvailable?: string;
  costShare: string;
  deadlines: Deadline[];
  submitUrl: string;
  programInfoUrl?: string;
  icon: typeof Target;
  accent: string; // tailwind color name
  narrativeSections: NarrativeSection[];
  documents: ChecklistItem[];
  notes?: string[];
  subApplications?: { name: string; oppNumber: string; submitUrl: string }[];
}

const SHARED_REGISTRATIONS: ChecklistItem[] = [
  {
    id: "reg-ein",
    label: "Federal EIN active for Abundant Life Church",
    owner: "Abundant Life",
    detail: "Required on every federal application as the legal applicant.",
  },
  {
    id: "reg-sam",
    label: "SAM.gov UEI active (Unique Entity ID)",
    owner: "Abundant Life",
    detail: "Allow 5–10 business days. This is the May 4 bottleneck.",
  },
  {
    id: "reg-grantsgov",
    label: "Grants.gov account + AOR delegated",
    owner: "Abundant Life",
    detail: "AOR (Authorized Organization Representative) must be on file before SF-424 submit.",
  },
  {
    id: "reg-justgrants",
    label: "JustGrants account (DOJ entity profile)",
    owner: "Abundant Life",
    detail: "Required to complete Second Chance Act step 2 by May 11.",
  },
  {
    id: "reg-researchgov",
    label: "Research.gov account",
    owner: "TCAF",
    detail: "TCAF carries this for the NSF 26-508 hub proposal.",
  },
  {
    id: "reg-cep",
    label: "VA Customer Engagement Portal (CEP) registered",
    owner: "Abundant Life",
    detail: "Required before any VA grant payment can flow.",
  },
  {
    id: "reg-vendorfile",
    label: "VA Vendor File Request submitted",
    owner: "Abundant Life",
    detail: "Allow several weeks per VA guidance.",
  },
  {
    id: "reg-idme",
    label: "ID.me account (organizational email)",
    owner: "Abundant Life",
    detail: "Required to access SSG Fox application portal.",
  },
];

const PACKAGES: Pkg[] = [
  {
    id: "bja-sca",
    title: "BJA Second Chance Act — Three-grant package",
    shortTitle: "BJA Second Chance Act (×3)",
    funder: "DOJ / Bureau of Justice Assistance",
    cfda: "16.812",
    oppNumber: "FY25 SCA trio",
    ceiling: "Varies by sub-program — see NOFO PDFs",
    costShare: "Confirm in each NOFO",
    deadlines: [
      { label: "Grants.gov SF-424 + forms", date: "2026-05-04T20:00:00Z", note: "Step 1 — basic forms only" },
      { label: "JustGrants full application", date: "2026-05-11T20:00:00Z", note: "Step 2 — narrative + budget + attachments" },
    ],
    submitUrl: "https://www.grants.gov/search-results-detail/361671",
    programInfoUrl: "https://bja.ojp.gov/funding/opportunities",
    icon: Scale,
    accent: "blue",
    subApplications: [
      {
        name: "Improving Reentry Education and Employment Outcomes",
        oppNumber: "Grants.gov 361671",
        submitUrl: "https://www.grants.gov/search-results-detail/361671",
      },
      {
        name: "Family-Based Substance Use Disorder Treatment Program",
        oppNumber: "Grants.gov 361632",
        submitUrl: "https://www.grants.gov/search-results-detail/361632",
      },
      {
        name: "Community-based Reentry Program",
        oppNumber: "Grants.gov 361634",
        submitUrl: "https://www.grants.gov/search-results-detail/361634",
      },
    ],
    narrativeSections: [
      { name: "Description of the Issue", pageGuide: "see NOFO", owner: "Joint" },
      { name: "Project Design and Implementation", pageGuide: "see NOFO", owner: "TCAF" },
      { name: "Capabilities and Competencies", pageGuide: "see NOFO", owner: "Abundant Life" },
      { name: "Plan for Collecting Data Required for Performance Measures", owner: "TCAF" },
      { name: "Budget Worksheet and Budget Narrative", owner: "Joint" },
      { name: "Letters of Support / MOUs", owner: "Abundant Life" },
      { name: "Tribal Authorizing Resolution (if applicable)", owner: "Abundant Life" },
      { name: "Research and Evaluation Independence and Integrity", owner: "TCAF" },
    ],
    documents: [
      { id: "bja-doc-501c3", label: "501(c)(3) determination letter", owner: "Abundant Life" },
      { id: "bja-doc-articles", label: "Articles of incorporation + bylaws", owner: "Abundant Life" },
      { id: "bja-doc-audit", label: "Most recent financial statements / Form 990", owner: "Abundant Life" },
      { id: "bja-doc-board", label: "Current board roster with affiliations", owner: "Abundant Life" },
      { id: "bja-doc-mou", label: "MOU between Abundant Life and TCAF (fiscal sponsor / tech partner)", owner: "Joint" },
      { id: "bja-doc-budget", label: "Detailed line-item budget + budget narrative", owner: "Joint" },
      { id: "bja-doc-logic", label: "Logic model + performance measure plan", owner: "TCAF" },
      { id: "bja-doc-letters", label: "3+ partner letters of support (corrections, courts, workforce)", owner: "Abundant Life" },
      { id: "bja-doc-resumes", label: "Key personnel resumes / position descriptions", owner: "Joint" },
    ],
    notes: [
      "DOJ uses a TWO-STEP submission. SF-424 must be in Grants.gov by May 4 (8 PM ET). Full narrative goes into JustGrants by May 11 (8 PM ET).",
      "Page limits, award ceilings, and required attachments live in each individual NOFO PDF — download from the Grants.gov detail page (link above) to confirm before drafting.",
    ],
  },
  {
    id: "centene",
    title: "Centene Foundation — Behavioral Health Community Grants (Spring 2026)",
    shortTitle: "Centene Foundation Spring 2026",
    funder: "Centene Charitable Foundation",
    ceiling: "Typically $25K – $250K (confirm in portal)",
    costShare: "None typically required",
    deadlines: [{ label: "Spring cycle closes", date: "2026-05-31T23:59:00Z" }],
    submitUrl: "https://centenefoundation.org",
    programInfoUrl: "https://centenefoundation.org",
    icon: Heart,
    accent: "rose",
    narrativeSections: [
      { name: "Organization Background and Mission", owner: "Abundant Life" },
      { name: "Statement of Need (Texas behavioral health)", owner: "Joint" },
      { name: "Program Description and Population Served", owner: "TCAF" },
      { name: "Goals, Objectives, Measurable Outcomes", owner: "TCAF" },
      { name: "Project Budget and Sustainability", owner: "Joint" },
      { name: "Evaluation Plan", owner: "TCAF" },
    ],
    documents: [
      { id: "ctn-doc-501c3", label: "Current 501(c)(3) determination letter", owner: "Abundant Life" },
      { id: "ctn-doc-990", label: "Most recent IRS Form 990", owner: "Abundant Life" },
      { id: "ctn-doc-budget-org", label: "Current organizational operating budget", owner: "Abundant Life" },
      { id: "ctn-doc-budget-proj", label: "Project-specific budget", owner: "Joint" },
      { id: "ctn-doc-board", label: "Board of directors list", owner: "Abundant Life" },
      { id: "ctn-doc-audit", label: "Most recent audited financials (if available)", owner: "Abundant Life" },
    ],
    notes: [
      "Foundation-style application — narrative is shorter than federal but evaluation rigor still matters.",
      "Centene values measurable health outcomes and integration with their Medicaid managed-care footprint in Texas (Superior HealthPlan).",
    ],
  },
  {
    id: "nsf-26-508",
    title: "NSF 26-508 TechAccess: AI-Ready America (TX State Coordination Hub)",
    shortTitle: "NSF 26-508 TechAccess",
    funder: "NSF (TIP/EDU/CISE) with DOL/ETA, USDA-NIFA, SBA",
    oppNumber: "NSF 26-508",
    ceiling: "$1,000,000 / year × 3 years (Year 4 optional)",
    totalAvailable: "10 hubs in Round 1",
    costShare: "None required",
    deadlines: [
      { label: "Round 1 Letter of Intent due", date: "2026-06-16T23:59:00Z", note: "REQUIRED — no LOI = no full proposal" },
      { label: "Round 1 full proposal due", date: "2026-07-16T23:59:00Z" },
    ],
    submitUrl: "https://www.research.gov",
    programInfoUrl: "https://www.nsf.gov/funding/opportunities/nsf26-508",
    icon: Brain,
    accent: "purple",
    narrativeSections: [
      { name: "Project Summary (Overview, Intellectual Merit, Broader Impacts)", pageGuide: "1 page", owner: "TCAF" },
      { name: "Project Description", pageGuide: "15 pages typical NSF limit — confirm in solicitation", owner: "TCAF" },
      { name: "References Cited", owner: "TCAF" },
      { name: "Biographical Sketches (key personnel)", owner: "Joint" },
      { name: "Budget + Budget Justification", pageGuide: "3 pages narrative", owner: "TCAF" },
      { name: "Current and Pending Support", owner: "Joint" },
      { name: "Facilities, Equipment, and Other Resources", owner: "TCAF" },
      { name: "Data Management and Sharing Plan", pageGuide: "2 pages", owner: "TCAF" },
      { name: "Mentoring Plan (if postdocs)", owner: "TCAF" },
      { name: "Letters of Collaboration (federal partners + Texas anchors)", owner: "Joint" },
    ],
    documents: [
      { id: "nsf-doc-loi", label: "Letter of Intent submitted in Research.gov", owner: "TCAF" },
      { id: "nsf-doc-rplice", label: "RPLICE v2 protocol documentation packet", owner: "TCAF" },
      { id: "nsf-doc-hub-kit", label: "Open Hub Adoption Kit draft (for the other 55 jurisdictions)", owner: "TCAF" },
      { id: "nsf-doc-tx-anchors", label: "TX anchor letters: workforce board, community college, USDA extension, SBA SBDC", owner: "TCAF" },
      { id: "nsf-doc-fed-letters", label: "Coordination letters from DOL/ETA, USDA-NIFA, SBA regional offices", owner: "TCAF" },
      { id: "nsf-doc-bios", label: "Bio sketches for PI, Co-PIs, senior personnel", owner: "Joint" },
      { id: "nsf-doc-budget", label: "3-year budget with annual breakdown", owner: "TCAF" },
    ],
    notes: [
      "ONE proposal per institution — TCAF is the lead applicant for the AI hub (not Abundant Life).",
      "Round 1 awards 10 hubs nationally. If we miss June 16 LOI, next chance is Round 2 LOI Dec 15, 2026.",
      "Texas angle: leverage RPLICE v2 + 24-platform AI ecosystem as the unique national-scale asset.",
    ],
  },
  {
    id: "ssg-fox",
    title: "VA SSG Fox Suicide Prevention Grant Program — FY27",
    shortTitle: "SSG Fox VA-FOX-SP-FY2027",
    funder: "VA Office of Mental Health & Suicide Prevention",
    cfda: "64.055",
    oppNumber: "VA-FOX-SP-FY2027",
    ceiling: "Up to $750,000 / year (renewable)",
    totalAvailable: "$112M total across all FY27 awards",
    costShare: "None required",
    deadlines: [{ label: "Application due", date: "2026-06-12T20:59:00Z", note: "4:59 PM ET hard cutoff" }],
    submitUrl: "https://www.grants.gov/search-results-detail/361498",
    programInfoUrl: "https://www.mentalhealth.va.gov/ssgfox-grants/index.asp",
    icon: ShieldCheck,
    accent: "amber",
    narrativeSections: [
      { name: "Executive Summary", owner: "Joint" },
      { name: "Need and Target Population (TX veterans at risk)", owner: "Joint" },
      { name: "Outreach and Identification Plan", owner: "Abundant Life" },
      { name: "Baseline Mental Health Screening Protocol (required for all participants 18+)", owner: "TCAF" },
      { name: "Suicide Risk Education for Families and Community", owner: "Abundant Life" },
      { name: "Clinical Services / Emergency Treatment Linkages", owner: "TCAF" },
      { name: "Case Management Workflow", owner: "Joint" },
      { name: "Peer Support Program", owner: "Abundant Life" },
      { name: "VA Benefits Assistance Plan", owner: "TCAF" },
      { name: "Non-traditional / Innovative Approaches (optional)", owner: "TCAF" },
      { name: "Performance Measurement and Evaluation", owner: "TCAF" },
      { name: "Budget and Budget Narrative", owner: "Joint" },
      { name: "Key Personnel Qualifications", owner: "Joint" },
    ],
    documents: [
      { id: "fox-doc-501c3", label: "501(c)(3) determination letter", owner: "Abundant Life" },
      { id: "fox-doc-cep", label: "Active VA Customer Engagement Portal registration", owner: "Abundant Life" },
      { id: "fox-doc-vendor", label: "Vendor File Request approval", owner: "Abundant Life" },
      { id: "fox-doc-idme", label: "ID.me account on file", owner: "Abundant Life" },
      { id: "fox-doc-clinical", label: "Letters from clinical partners (LMHA, FQHCs, VA medical center)", owner: "Joint" },
      { id: "fox-doc-peer", label: "Peer support certification documentation", owner: "Abundant Life" },
      { id: "fox-doc-screening", label: "Mental health screening tool license / protocol", owner: "TCAF" },
      { id: "fox-doc-budget", label: "Detailed annual budget (renewable years 2 & 3)", owner: "Joint" },
      { id: "fox-doc-ta-webinar", label: "Attended FY27 NEW Applicant TA webinar", owner: "Joint" },
      { id: "fox-doc-app-guide", label: "Downloaded FY27 SSG Fox SPGP Application Guide", owner: "TCAF" },
    ],
    notes: [
      "Application opened April 13, 2026 — already open. 45 days remain.",
      "Priority categories: rural, tribal lands, US territories, high minority/women veteran populations, high crisis-line call volumes. TX rural counties are a strong fit.",
      "Renewable up to multiple years — write the application as a sustainable multi-year program, not a one-shot pilot.",
    ],
  },
];

function daysFromToday(iso: string): number {
  const d = new Date(iso);
  const ms = d.getTime() - TODAY.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function deadlineColor(days: number): string {
  if (days <= 7) return "text-red-600 dark:text-red-400";
  if (days <= 21) return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function ownerBadge(owner: Owner) {
  const styles: Record<Owner, string> = {
    "Abundant Life": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    TCAF: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200",
    Joint: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  };
  return (
    <Badge variant="outline" className={`${styles[owner]} border-0 text-xs`} data-testid={`badge-owner-${owner.toLowerCase().replace(/ /g, "-")}`}>
      {owner}
    </Badge>
  );
}

function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface TrackerState {
  registrations: Record<string, boolean>;
  documents: Record<string, boolean>; // keyed by documentId
  narratives: Record<string, boolean>; // keyed by `${pkgId}::${idx}`
}

const EMPTY_STATE: TrackerState = { registrations: {}, documents: {}, narratives: {} };

function loadState(): TrackerState {
  if (typeof window === "undefined") return EMPTY_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw);
    return {
      registrations: parsed.registrations || {},
      documents: parsed.documents || {},
      narratives: parsed.narratives || {},
    };
  } catch {
    return EMPTY_STATE;
  }
}

export default function GrantApplicationsPage() {
  const [state, setState] = useState<TrackerState>(EMPTY_STATE);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function toggle(group: keyof TrackerState, key: string) {
    setState((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: !prev[group][key] },
    }));
  }

  const regProgress = useMemo(() => {
    const done = SHARED_REGISTRATIONS.filter((r) => state.registrations[r.id]).length;
    return { done, total: SHARED_REGISTRATIONS.length };
  }, [state.registrations]);

  const nextDeadline = useMemo(() => {
    const all = PACKAGES.flatMap((p) => p.deadlines.map((d) => ({ ...d, pkg: p.shortTitle })));
    const future = all.filter((d) => new Date(d.date) >= TODAY).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return future[0];
  }, []);

  const totalAvailable = "$115M+ across the 4 packages";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 max-w-7xl">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold" data-testid="heading-page-title">
            Application Tracker
          </h1>
        </div>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Single source of truth for the four federal and foundation packages Abundant Life Church (501(c)(3) lead applicant) and TCAF
          (technology + healthcare admin) are pursuing together. Deadlines, registrations, narrative roles, and required documents — all in
          one place. Checklist progress saves to your browser.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card data-testid="card-stat-funding">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-sm text-muted-foreground">Total opportunity</div>
                <div className="text-2xl font-bold" data-testid="text-total-funding">{totalAvailable}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-deadline">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <div>
                <div className="text-sm text-muted-foreground">Next hard deadline</div>
                {nextDeadline ? (
                  <>
                    <div className={`text-2xl font-bold ${deadlineColor(daysFromToday(nextDeadline.date))}`} data-testid="text-next-deadline-days">
                      {daysFromToday(nextDeadline.date)} days
                    </div>
                    <div className="text-xs text-muted-foreground" data-testid="text-next-deadline-detail">
                      {formatDeadline(nextDeadline.date)} · {nextDeadline.pkg}
                    </div>
                  </>
                ) : (
                  <div className="text-2xl font-bold">—</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-registrations">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Pre-app registrations</div>
                <div className="text-2xl font-bold" data-testid="text-registrations-progress">
                  {regProgress.done} / {regProgress.total}
                </div>
                <Progress value={(regProgress.done / regProgress.total) * 100} className="mt-2 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20" data-testid="card-bja-warning">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <strong>Critical timeline note:</strong> The three BJA Second Chance Act applications use a TWO-STEP submission. The Grants.gov
            SF-424 must be in by <strong>May 4, 2026 (8 PM ET)</strong>; the full narrative + budget then flows into JustGrants by{" "}
            <strong>May 11, 2026 (8 PM ET)</strong>. SAM.gov registration takes 5–10 business days — start it today if not already active.
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-shared-registrations">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Shared pre-application registrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {SHARED_REGISTRATIONS.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/30 transition-colors"
              data-testid={`row-registration-${item.id}`}
            >
              <Checkbox
                checked={!!state.registrations[item.id]}
                onCheckedChange={() => toggle("registrations", item.id)}
                className="mt-1"
                data-testid={`checkbox-registration-${item.id}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${state.registrations[item.id] ? "line-through text-muted-foreground" : ""}`}>
                    {item.label}
                  </span>
                  {ownerBadge(item.owner)}
                </div>
                {item.detail && <div className="text-xs text-muted-foreground mt-1">{item.detail}</div>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Target className="h-6 w-6 text-blue-600" />
          The four active packages
        </h2>

        {PACKAGES.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            documents={state.documents}
            narratives={state.narratives}
            onToggleDocument={(id) => toggle("documents", id)}
            onToggleNarrative={(key) => toggle("narratives", key)}
          />
        ))}
      </div>

      <Card className="bg-muted/40">
        <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="h-4 w-4" />
            What's verified live vs. what still needs the NOFO PDF
          </div>
          <p>
            Deadlines, opportunity numbers, ceilings, registration requirements, and submission portals on this page were all confirmed
            against the live federal sources (Grants.gov, bja.ojp.gov, mentalhealth.va.gov, NSF.gov, centenefoundation.org) on April 28,
            2026. Page limits and exact attachment lists for the BJA Second Chance Act trio live inside each NOFO PDF — download them from
            the Grants.gov detail links above and the document checklists will be sharpened.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

interface PackageCardProps {
  pkg: Pkg;
  documents: Record<string, boolean>;
  narratives: Record<string, boolean>;
  onToggleDocument: (id: string) => void;
  onToggleNarrative: (key: string) => void;
}

function PackageCard({ pkg, documents, narratives, onToggleDocument, onToggleNarrative }: PackageCardProps) {
  const Icon = pkg.icon;
  const docDone = pkg.documents.filter((d) => documents[d.id]).length;
  const docTotal = pkg.documents.length;
  const narrDone = pkg.narrativeSections.filter((_, i) => narratives[`${pkg.id}::${i}`]).length;
  const narrTotal = pkg.narrativeSections.length;
  const overall = Math.round(((docDone + narrDone) / (docTotal + narrTotal)) * 100);

  const accentBorder: Record<string, string> = {
    blue: "border-l-blue-500",
    rose: "border-l-rose-500",
    purple: "border-l-purple-500",
    amber: "border-l-amber-500",
  };

  return (
    <Card className={`border-l-4 ${accentBorder[pkg.accent] || "border-l-blue-500"}`} data-testid={`card-package-${pkg.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <Icon className="h-7 w-7 text-blue-600 dark:text-blue-400 mt-1" />
            <div>
              <CardTitle className="text-xl" data-testid={`heading-package-${pkg.id}`}>{pkg.title}</CardTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {pkg.funder}
                {pkg.cfda && <> · CFDA {pkg.cfda}</>}
                {pkg.oppNumber && <> · {pkg.oppNumber}</>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono" data-testid={`badge-progress-${pkg.id}`}>
              {overall}% ready
            </Badge>
            <a href={pkg.submitUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="default" size="sm" data-testid={`button-submit-${pkg.id}`}>
                Open submission portal <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </a>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="p-3 rounded-md border bg-muted/30">
            <div className="text-xs text-muted-foreground">Award ceiling</div>
            <div className="font-semibold" data-testid={`text-ceiling-${pkg.id}`}>{pkg.ceiling}</div>
          </div>
          {pkg.totalAvailable && (
            <div className="p-3 rounded-md border bg-muted/30">
              <div className="text-xs text-muted-foreground">Pool</div>
              <div className="font-semibold" data-testid={`text-pool-${pkg.id}`}>{pkg.totalAvailable}</div>
            </div>
          )}
          <div className="p-3 rounded-md border bg-muted/30">
            <div className="text-xs text-muted-foreground">Cost share</div>
            <div className="font-semibold" data-testid={`text-costshare-${pkg.id}`}>{pkg.costShare}</div>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Deadlines
          </div>
          <div className="space-y-2">
            {pkg.deadlines.map((d, i) => {
              const days = daysFromToday(d.date);
              return (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-2 rounded-md border bg-card"
                  data-testid={`row-deadline-${pkg.id}-${i}`}
                >
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-medium">{d.label}</span>
                    {d.note && <span className="text-xs text-muted-foreground">— {d.note}</span>}
                  </div>
                  <div className={`text-sm font-bold ${deadlineColor(days)}`}>
                    {formatDeadline(d.date)} · {days >= 0 ? `${days}d` : "PAST"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {pkg.subApplications && (
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Sub-applications in this package
            </div>
            <div className="space-y-2">
              {pkg.subApplications.map((sub, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 p-2 rounded-md border bg-card"
                  data-testid={`row-subapp-${pkg.id}-${i}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium">{sub.name}</div>
                    <div className="text-xs text-muted-foreground">{sub.oppNumber}</div>
                  </div>
                  <a href={sub.submitUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" data-testid={`button-subapp-${pkg.id}-${i}`}>
                      Open <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> Narrative sections ({narrDone}/{narrTotal})
              </span>
            </div>
            <Progress value={(narrDone / narrTotal) * 100} className="h-1.5 mb-3" />
            <div className="space-y-2">
              {pkg.narrativeSections.map((sec, i) => {
                const key = `${pkg.id}::${i}`;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors"
                    data-testid={`row-narrative-${pkg.id}-${i}`}
                  >
                    <Checkbox
                      checked={!!narratives[key]}
                      onCheckedChange={() => onToggleNarrative(key)}
                      className="mt-0.5"
                      data-testid={`checkbox-narrative-${pkg.id}-${i}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm ${narratives[key] ? "line-through text-muted-foreground" : ""}`}>{sec.name}</span>
                        {sec.pageGuide && (
                          <span className="text-xs text-muted-foreground">({sec.pageGuide})</span>
                        )}
                        {ownerBadge(sec.owner)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Required documents ({docDone}/{docTotal})
              </span>
            </div>
            <Progress value={(docDone / docTotal) * 100} className="h-1.5 mb-3" />
            <div className="space-y-2">
              {pkg.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors"
                  data-testid={`row-document-${doc.id}`}
                >
                  <Checkbox
                    checked={!!documents[doc.id]}
                    onCheckedChange={() => onToggleDocument(doc.id)}
                    className="mt-0.5"
                    data-testid={`checkbox-document-${doc.id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${documents[doc.id] ? "line-through text-muted-foreground" : ""}`}>{doc.label}</span>
                      {ownerBadge(doc.owner)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {pkg.notes && pkg.notes.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Notes
            </div>
            {pkg.notes.map((n, i) => (
              <div key={i} className="text-xs text-muted-foreground">
                · {n}
              </div>
            ))}
          </div>
        )}

        {pkg.programInfoUrl && (
          <div className="text-xs text-muted-foreground">
            Program info:{" "}
            <a
              href={pkg.programInfoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
              data-testid={`link-programinfo-${pkg.id}`}
            >
              {pkg.programInfoUrl}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
