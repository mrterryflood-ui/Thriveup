import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Heart,
  ClipboardCheck,
  Target,
  Repeat,
} from "lucide-react";

const DEADLINE = new Date("2026-04-27T17:00:00-05:00");
const TODAY = new Date("2026-04-16T00:00:00-05:00");

const LOI_DRAFT = `Across Travis, Williamson, Hays, Bastrop, and Caldwell counties, an estimated 192,029 people qualify for public benefits they are not receiving — a 60% enrollment gap. Over $192 million in annual SNAP, Medicaid, CHIP, EITC, and WIC benefits go unclaimed because families face language barriers, transportation gaps, no broadband, and deep system distrust. No single organization can close this gap alone.

That is why TCAF is building a cross-sector coalition — not just delivering services, but connecting partners who each bring what the others lack.

The Coalition Model: Stronger Together

The City of Pflugerville provides municipal reach into Williamson County — libraries, community spaces, and trusted local government channels families already use. The City of Manor extends that reach into eastern Travis County's fastest-growing and most underserved communities. Frost Bank contributes financial literacy infrastructure and direct EITC and Child Tax Credit enrollment — meeting families where their money already flows. Austin Community College, through Professor Laura Franco, opens campus-based access across Travis, Williamson, and Hays counties — reaching students and families who are near-poverty, benefits-eligible, and unaware.

TCAF serves as the backbone organization: we bring the enrollment technology, the trained Community Health Workers, the data infrastructure, and the ecosystem that connects every partner's contribution into a single coordinated system. When a family walks into the Pflugerville Library, a CHW screens them for nine programs. When a student at ACC discloses food insecurity, Professor Franco's team connects them to our screener. When Frost Bank hosts a financial wellness workshop, EITC-eligible families get enrolled on the spot.

How We Do the Work

Our coalition operates in every community simultaneously. Bilingual CHWs are embedded at partner sites — the library, the campus, the bank branch, the community center, the church. We screen families for SNAP, Medicaid, CHIP, WIC, EITC, CTC, TANF, SSI, and ACA Marketplace. We assist with applications on-site and follow every family through enrollment and renewal.

For mixed-status families — where citizen children qualify but parents fear system contact — our CHWs are trusted community members, not government representatives. We screen children's eligibility without requiring parent immigration status. This work runs on trust built over years, not intake forms.

For families without transportation or broadband, we go to them — tablets at kitchen tables, school pickup lines, food pantry distribution days, and laundromats in the 198 highest-barrier census tracts.

Growing the Coalition as We Go

This is not a fixed program. As we demonstrate results in Pflugerville and Manor, we bring in new partners — school districts, faith communities, health clinics, employers — each adding their reach and their trust. Our digital ecosystem at thrivingcommunitiesforall.com gives every partner shared tools: real-time screeners, enrollment tracking, and a public evidence chain verifiable at thrivingcommunitiesforall.com/sdoh-explorer.

Sustainability. TCAF has initiated HHSC Community Partner Program certification, integrating our coalition's enrollment work into the state's permanent benefits infrastructure. The coalition does not end when funding does — it becomes part of how Texas delivers benefits.

We are stronger together. We are asking for the resources to prove it.`;

const READINESS_CHECKLIST = [
  { id: "loi-draft", label: "500-word LOI drafted (final draft)", done: true },
  { id: "evidence-pulled", label: "County enrollment gap data pulled (Benefits Intelligence)", done: true },
  { id: "partners-mapped", label: "Coalition partners identified (Pflugerville, Manor, Frost, ACC)", done: true },
  { id: "hhsc-pathway", label: "HHSC CPP pathway documented", done: true },
  { id: "sustainability", label: "Sustainability narrative complete", done: true },
  { id: "rplice-validated", label: "RPLICE/DeepSeek validation report attached", done: true },
  { id: "metrics-set", label: "3-year enrollment targets + MAP-GAP fidelity defined", done: true },
  { id: "givingdata-account", label: "GivingData portal account created/verified", done: false },
  { id: "loi-uploaded", label: "LOI submitted via GivingData portal", done: false },
  { id: "office-hours", label: "Office hours scheduled with St. David's program staff", done: false },
];

const COALITION_PARTNERS = [
  {
    name: "City of Pflugerville",
    type: "Municipal Partner",
    county: "Williamson",
    role: "Municipal reach — libraries, community spaces, trusted local government channels",
    why: "Existing community trust; TCAF is headquartered here",
  },
  {
    name: "City of Manor",
    type: "Municipal Partner",
    county: "Travis (East)",
    role: "Reach into Travis County's fastest-growing, most underserved communities",
    why: "Underserved population; municipal infrastructure",
  },
  {
    name: "Frost Bank",
    type: "Financial Institution",
    county: "Multi-county",
    role: "Financial literacy + direct EITC/CTC enrollment at workshops",
    why: "Meeting families where their money already flows",
  },
  {
    name: "Austin Community College (Prof. Laura Franco)",
    type: "Higher Ed",
    county: "Travis, Williamson, Hays",
    role: "Campus-based access for near-poverty students and their families",
    why: "Direct line to benefits-eligible students unaware of eligibility",
  },
  {
    name: "Pflugerville Community Food Pantry / Round Rock Area Serving Center",
    type: "Food Security",
    county: "Williamson",
    role: "On-site SNAP + multi-benefit screening during food distribution",
    why: "Families already at trusted location for food security",
  },
  {
    name: "Lone Star Circle of Care (LSCC)",
    type: "FQHC",
    county: "Williamson",
    role: "Cross-screen patients for SNAP/EITC/childcare during Medicaid intake",
    why: "Largest community health center in Williamson County",
  },
  {
    name: "Bluebonnet Trails Community Services",
    type: "Behavioral Health",
    county: "Bastrop, Caldwell",
    role: "Integrate Medicaid/CHIP enrollment into mental health intake",
    why: "Mental health = health (per St. David's); rural reach",
  },
  {
    name: "Pflugerville ISD / Hutto ISD / Bastrop ISD / Lockhart ISD",
    type: "School Districts",
    county: "Multi-county",
    role: "Free/reduced lunch data identifies eligible families",
    why: "Universal touchpoint for families with children; Dr. Flood serves PfISD SHAC",
  },
];

const ENROLLMENT_TARGETS = [
  { benefit: "SNAP", y1: 200, y2: 400, y3: 500 },
  { benefit: "Medicaid / CHIP", y1: 150, y2: 300, y3: 400 },
  { benefit: "EITC / CTC", y1: 100, y2: 200, y3: 300 },
  { benefit: "WIC", y1: 50, y2: 100, y3: 150 },
  { benefit: "Other (SSI, SSDI, childcare, housing)", y1: 50, y2: 100, y3: 150 },
];

const FIDELITY_METRICS = [
  { label: "Renewal rate", target: "85%+", method: "Automated renewal tracking" },
  { label: "Multi-benefit enrollment", target: "2.3+ benefits/household", method: "Platform screening data" },
  { label: "Time to enrollment", target: "< 30 days", method: "Workflow tracking" },
  { label: "Outreach effectiveness", target: "60%+ conversion", method: "Conversion tracking" },
  { label: "Partner utilization", target: "80%+ active screening", method: "Partner activity dashboard" },
  { label: "Economic impact / household", target: "$3K – $8K annually", method: "Benefit amount calculations" },
  { label: "Client satisfaction", target: "90%+", method: "Post-enrollment surveys" },
  { label: "Navigator fidelity (RPLICE)", target: "85%+", method: "RPLICE fidelity monitoring" },
];

const HHSC_CPP_PATHWAY = [
  { month: "Month 1–2", action: "Submit CPP Level 1 application + complete required HHSC training modules", status: "planned" },
  { month: "Month 2–3", action: "Achieve Level 1 certification", status: "target" },
  { month: "Month 3–6", action: "Apply for Level 2 upgrade after demonstrating enrollment volume", status: "target" },
  { month: "Month 6–12", action: "Apply for Level 3 (Full Access) — direct application submission for clients", status: "target" },
  { month: "Ongoing", action: "Integrate CPP access into TCAF platform — auto tracking, status updates, renewal alerts", status: "planned" },
];

const TRUST_PRINCIPLES = [
  { p: "Meet people where they already go", note: "Food pantries, churches, schools, clinics, community events — no new intake points" },
  { p: "Culturally responsive navigators", note: "Hire CHWs FROM the communities; bilingual; immigration-sensitive training" },
  { p: "Accurate, unbiased information", note: "Citizen children eligible for SNAP/Medicaid/CHIP without affecting parents' status; WIC available regardless of status" },
  { p: "No wrong door", note: "Every touchpoint screens for all 9 benefits; family chooses what to pursue, no pressure" },
  { p: "Safety and privacy", note: "TCAF does not collect or store immigration status; partner orgs maintain own privacy standards" },
];

function daysUntil(target: Date, from: Date): number {
  const ms = target.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-start gap-2 py-1.5" data-testid={`checklist-${label.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`}>
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      )}
      <span className={done ? "text-sm line-through text-muted-foreground" : "text-sm font-medium"}>{label}</span>
    </div>
  );
}

export default function StDavidsWAB2WorkspacePage() {
  const [tab, setTab] = useState("overview");
  const daysLeft = useMemo(() => daysUntil(DEADLINE, TODAY), []);
  const completed = READINESS_CHECKLIST.filter((c) => c.done).length;
  const total = READINESS_CHECKLIST.length;
  const completionPct = Math.round((completed / total) * 100);

  const wordCount = LOI_DRAFT.trim().split(/\s+/).length;
  const wordsRemaining = 500 - wordCount;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6" data-testid="page-st-davids-wab2-workspace">
      <header className="space-y-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight" data-testid="text-page-title">
              St. David's We All Benefit 2.0 — LOI Workspace
            </h1>
            <p className="text-muted-foreground mt-1">
              The Collaborative Advocate Foundation (TCAF) · EIN 41-3618003 · Building Economic Stability
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={daysLeft <= 14 ? "destructive" : "default"} className="text-sm" data-testid="badge-days-left">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {daysLeft} days until deadline
            </Badge>
            <Button variant="outline" size="sm" asChild data-testid="link-givingdata">
              <a href="https://stdavidsfoundation.org/funding-opportunities" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Funder Portal
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card data-testid="card-deadline">
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Deadline</div>
              <div className="text-lg font-semibold mt-1">Apr 27, 2026</div>
              <div className="text-xs text-muted-foreground">5:00 PM CT · GivingData</div>
            </CardContent>
          </Card>
          <Card data-testid="card-word-count">
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Word Count</div>
              <div className="text-lg font-semibold mt-1">{wordCount} / 500</div>
              <div className={`text-xs ${wordsRemaining < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {wordsRemaining >= 0 ? `${wordsRemaining} words remaining` : `${Math.abs(wordsRemaining)} words OVER`}
              </div>
            </CardContent>
          </Card>
          <Card data-testid="card-readiness">
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Readiness</div>
              <div className="text-lg font-semibold mt-1">{completed} / {total}</div>
              <Progress value={completionPct} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
          <Card data-testid="card-coalition-size">
            <CardContent className="pt-4 pb-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Coalition Partners</div>
              <div className="text-lg font-semibold mt-1">{COALITION_PARTNERS.length}</div>
              <div className="text-xs text-muted-foreground">across 5 counties</div>
            </CardContent>
          </Card>
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6" data-testid="tabs-workspace">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="loi" data-testid="tab-loi">LOI Draft</TabsTrigger>
          <TabsTrigger value="coalition" data-testid="tab-coalition">Coalition</TabsTrigger>
          <TabsTrigger value="hhsc" data-testid="tab-hhsc">HHSC CPP</TabsTrigger>
          <TabsTrigger value="trust" data-testid="tab-trust">Trust Model</TabsTrigger>
          <TabsTrigger value="metrics" data-testid="tab-metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card data-testid="card-strategic-positioning">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4" />
                  Strategic Positioning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  TCAF is the <strong>technology backbone</strong> connecting partner nonprofits, CHWs, and trusted
                  community organizations to eligible-but-unenrolled people across the 5-county region.
                </p>
                <p>
                  The platform does the heavy lifting virtually — eligibility screening, benefits matching, data
                  coordination — then routes people to trusted in-person support.
                </p>
                <div className="pt-2 border-t mt-2">
                  <div className="text-xs font-semibold mb-1">Why we win:</div>
                  <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                    <li>Capacity-BUILDING in Williamson (St. David's named priority)</li>
                    <li>Holistic — one screening covers SNAP, Medicaid, CHIP, WIC, EITC, CTC, SSI, ACA, childcare</li>
                    <li>Client-driven — meets families through trusted partners, not government channels</li>
                    <li>Effective — Census-tract targeting, RPLICE fidelity, MAP-GAP 30-day cycles</li>
                    <li>Sustainable — tech infrastructure persists beyond grant term</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-readiness-checklist">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ClipboardCheck className="h-4 w-4" />
                  Submission Readiness
                </CardTitle>
                <CardDescription>{completed} of {total} items complete</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {READINESS_CHECKLIST.map((item) => (
                    <ChecklistItem key={item.id} done={item.done} label={item.label} />
                  ))}
                </div>
                {completed < total && (
                  <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-amber-600 dark:text-amber-500" />
                    {total - completed} items remaining before April 27 submission.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-county-targets">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                County Strategy
              </CardTitle>
              <CardDescription>Where TCAF builds capacity vs. where it partners</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="p-3 border rounded-md bg-card" data-testid="county-williamson">
                  <div className="font-semibold text-sm">Williamson County</div>
                  <Badge variant="default" className="mt-1 text-xs">Individual Application</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    TCAF HQ. ~680K population. ~45% SNAP gap. High-need ZIPs: 78660, 78634, 76574, 78681.
                    Build the digital infrastructure that doesn't exist yet.
                  </p>
                </div>
                <div className="p-3 border rounded-md bg-card" data-testid="county-bastrop">
                  <div className="font-semibold text-sm">Bastrop County</div>
                  <Badge variant="secondary" className="mt-1 text-xs">Collaborative</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    ~110K population. Rural, very limited enrollment infrastructure. Higher poverty than Travis or
                    Williamson. Significant Hispanic/Latino population.
                  </p>
                </div>
                <div className="p-3 border rounded-md bg-card" data-testid="county-caldwell">
                  <div className="font-semibold text-sm">Caldwell County</div>
                  <Badge variant="secondary" className="mt-1 text-xs">Collaborative</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    ~46K population. Most rural. Highest poverty in 5-county region. Nearly no CHW network — would
                    build from ground up.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-quick-links">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Source Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-2">
                {[
                  { name: "WAB2 LOI — Final Draft", path: "/docs/grants/St-Davids-WAB2-LOI-FINAL-DRAFT.md" },
                  { name: "WAB2 LOI — Complete Strategy Package", path: "/docs/grants/St-Davids-WAB2-LOI-Package.md" },
                  { name: "St. David's Strategic Alignment Brief", path: "/docs/grants/St-Davids-Strategic-Alignment.md" },
                  { name: "Community-Led Change LOI Package", path: "/docs/grants/St-Davids-Community-Led-Change-LOI-Package.md" },
                ].map((doc) => (
                  <Button
                    key={doc.path}
                    variant="outline"
                    size="sm"
                    asChild
                    className="justify-start"
                    data-testid={`link-doc-${doc.path.split("/").pop()}`}
                  >
                    <a href={doc.path} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-3.5 w-3.5 mr-2 shrink-0" />
                      <span className="truncate text-xs">{doc.name}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loi" className="space-y-4">
          <Card data-testid="card-loi-draft">
            <CardHeader>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">500-Word LOI — Final Draft</CardTitle>
                  <CardDescription>Submitted via GivingData portal · Due Apr 27, 2026 5:00 PM CT</CardDescription>
                </div>
                <Badge variant={wordCount <= 500 ? "default" : "destructive"} data-testid="badge-word-count">
                  {wordCount} / 500 words
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-muted/30 p-4 rounded-md border" data-testid="text-loi-content">
                  {LOI_DRAFT}
                </pre>
              </div>
              <Separator className="my-4" />
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="font-semibold mb-1">Organization</div>
                  <div className="text-muted-foreground">The Collaborative Advocate Foundation (TCAF)</div>
                  <div className="text-muted-foreground">EIN: 41-3618003</div>
                  <div className="text-muted-foreground">17912 Stefano Drive, Pflugerville, TX 78660</div>
                </div>
                <div>
                  <div className="font-semibold mb-1">Contact</div>
                  <div className="text-muted-foreground">Dr. Terry Flood, DHA — Founder & CEO</div>
                  <div className="text-muted-foreground">mr.terryflood@gmail.com · 254-319-8460</div>
                  <div className="text-muted-foreground">thrivingcommunitiesforall.com</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coalition" className="space-y-4">
          <Card data-testid="card-coalition-logic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Coalition Logic — Not a List, a Connected Team
              </CardTitle>
              <CardDescription>
                St. David's was explicit: every partner needs a specific, complementary role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {COALITION_PARTNERS.map((p) => (
                  <div key={p.name} className="p-3 border rounded-md bg-card" data-testid={`partner-${p.name.replace(/\s+/g, "-").toLowerCase().slice(0, 30)}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm">{p.name}</div>
                      <Badge variant="outline" className="text-xs shrink-0">{p.county}</Badge>
                    </div>
                    <Badge variant="secondary" className="text-xs mb-2">{p.type}</Badge>
                    <div className="text-xs text-muted-foreground mb-1">
                      <strong className="text-foreground">Role:</strong> {p.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong className="text-foreground">Why:</strong> {p.why}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hhsc" className="space-y-4">
          <Card data-testid="card-hhsc-pathway">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                HHSC Community Partner Program Pathway
              </CardTitle>
              <CardDescription>
                Per Kori at St. David's: not every collaborative member needs CPP — but TCAF being on the path shows commitment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {HHSC_CPP_PATHWAY.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 border rounded-md bg-card" data-testid={`hhsc-step-${i}`}>
                    <div className="text-xs font-semibold text-muted-foreground shrink-0 w-20">{step.month}</div>
                    <div className="flex-1 text-sm">{step.action}</div>
                    <Badge variant={step.status === "planned" ? "outline" : "secondary"} className="text-xs shrink-0">
                      {step.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-3 mt-4">
                <div className="p-3 border rounded-md">
                  <Badge variant="outline" className="mb-2">Level 1</Badge>
                  <div className="text-xs text-muted-foreground">Help clients complete applications on Your Texas Benefits. Limited support.</div>
                </div>
                <div className="p-3 border rounded-md">
                  <Badge variant="secondary" className="mb-2">Level 2</Badge>
                  <div className="text-xs text-muted-foreground">Access to check application status. More detailed support through the process.</div>
                </div>
                <div className="p-3 border rounded-md border-primary">
                  <Badge variant="default" className="mb-2">Level 3 (Goal)</Badge>
                  <div className="text-xs text-muted-foreground">Submit applications on behalf of clients. Track status. Follow up to completion.</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust" className="space-y-4">
          <Card data-testid="card-trust-model">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Heart className="h-4 w-4" />
                Trust-Based Outreach Model
              </CardTitle>
              <CardDescription>
                Reaching mixed-status families and system-distrustful populations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {TRUST_PRINCIPLES.map((tp, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 border rounded-md bg-card" data-testid={`trust-principle-${i}`}>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{tp.p}</div>
                      <div className="text-xs text-muted-foreground mt-1">{tp.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card data-testid="card-enrollment-targets">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4" />
                3-Year Enrollment Targets
              </CardTitle>
              <CardDescription>3,150 new enrollments + 1,200 renewals = 4,350 total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Benefit</th>
                      <th className="text-right py-2 font-medium">Year 1</th>
                      <th className="text-right py-2 font-medium">Year 2</th>
                      <th className="text-right py-2 font-medium">Year 3</th>
                      <th className="text-right py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ENROLLMENT_TARGETS.map((row) => (
                      <tr key={row.benefit} className="border-b" data-testid={`target-${row.benefit.replace(/\s+/g, "-").toLowerCase()}`}>
                        <td className="py-2">{row.benefit}</td>
                        <td className="text-right py-2 tabular-nums">{row.y1}</td>
                        <td className="text-right py-2 tabular-nums">{row.y2}</td>
                        <td className="text-right py-2 tabular-nums">{row.y3}</td>
                        <td className="text-right py-2 tabular-nums font-semibold">{row.y1 + row.y2 + row.y3}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold bg-muted/30">
                      <td className="py-2">New Enrollments Total</td>
                      <td className="text-right py-2 tabular-nums">{ENROLLMENT_TARGETS.reduce((s, r) => s + r.y1, 0)}</td>
                      <td className="text-right py-2 tabular-nums">{ENROLLMENT_TARGETS.reduce((s, r) => s + r.y2, 0)}</td>
                      <td className="text-right py-2 tabular-nums">{ENROLLMENT_TARGETS.reduce((s, r) => s + r.y3, 0)}</td>
                      <td className="text-right py-2 tabular-nums">{ENROLLMENT_TARGETS.reduce((s, r) => s + r.y1 + r.y2 + r.y3, 0)}</td>
                    </tr>
                    <tr className="text-muted-foreground">
                      <td className="py-2">Renewals Supported</td>
                      <td className="text-right py-2 tabular-nums">0</td>
                      <td className="text-right py-2 tabular-nums">400</td>
                      <td className="text-right py-2 tabular-nums">800</td>
                      <td className="text-right py-2 tabular-nums">1,200</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-fidelity-metrics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Repeat className="h-4 w-4" />
                Fidelity & Quality Metrics — Tracked via MAP-GAP 30-Day Cycles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-2">
                {FIDELITY_METRICS.map((m, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-2.5 border rounded-md bg-card" data-testid={`metric-${m.label.replace(/\s+/g, "-").toLowerCase()}`}>
                    <div>
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.method}</div>
                    </div>
                    <Badge variant="outline" className="shrink-0">{m.target}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
