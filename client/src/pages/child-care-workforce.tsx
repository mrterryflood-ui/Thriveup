import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp, Baby, Briefcase, ArrowLeft, DollarSign,
  Building2, Users, CheckCircle2, AlertTriangle, Target, BarChart3, ChevronRight, Scale
} from "lucide-react";

const ECONOMIC_DATA = [
  { label: "Annual TX productivity loss (child care gaps)", value: "$9.3B", note: "US Chamber Foundation, 2022", color: "text-red-700" },
  { label: "Annual US employer cost (child care disruption)", value: "$12.7B", note: "Council for a Strong America, 2023", color: "text-amber-700" },
  { label: "Median TX infant center care cost/year", value: "$11–14K", note: "Per child; vs. avg TX rent", color: "text-orange-700" },
  { label: "WSNT job search success target", value: "62.2%", note: "TWC contracted measure FY2026", color: "text-green-700" },
];

const CONNECTION_POINTS = [
  {
    title: "Child Care IS the Work Enabler",
    body: "The TWC Child Care Initial Job Search Success Rate is measured as: percentage of CCS participants who obtain employment within 90 days of beginning job search while receiving child care assistance. This metric is definitionally a workforce outcome — it cannot be achieved without reliable child care access. Every slot filled is a parent freed to enter the labor market.",
    icon: Briefcase,
  },
  {
    title: "Recertification Cliffs Kill Employment",
    body: "CCS subsidies require periodic recertification — typically every 6–12 months. A parent who obtains employment may earn modestly more than the eligibility threshold mid-year, causing immediate loss of the subsidy. Without a graduated phase-out, employment becomes a financial penalty. This cliff effect is documented to increase job quits and turnover in low-wage sectors.",
    icon: AlertTriangle,
  },
  {
    title: "Provider Quality Predicts Workforce Stability",
    body: "Higher TRS-rated providers produce more consistent hours, fewer unplanned closures, and lower child-related absenteeism for working parents. A parent with a child enrolled at a 3★ or 4★ TRS center has measurably lower work disruption than one relying on informal, uncertified care. Quality is not just a child development issue — it is a labor market reliability issue.",
    icon: Building2,
  },
  {
    title: "The Waitlist Problem Has a Supply Solution",
    body: "Statewide, 36,000+ children sit on CCS waitlists — not because funding is absent, but because qualified providers are scarce, particularly in rural regions. The WSNT growth target (+236 children/day) can only be met by expanding provider capacity. This is a supply-side workforce infrastructure problem, not a demand problem.",
    icon: Users,
  },
];

const POLICY_ASKS = [
  {
    number: "01",
    title: "Pre-Employment Child Care Access",
    current: "Current state: Subsidies require documented employment or active job search enrollment. Families not yet in the workforce system have no pathway to access subsidized care — the system excludes the people it is meant to activate.",
    ask: "Authorize 90-day pre-employment child care access for families demonstrating intent to enter the workforce system. Texas could pilot within an existing Board's discretionary flex funds before seeking legislative change.",
    impact: "Removes the paradox: you need a job to get child care, you need child care to get a job.",
    tag: "Legislative / TWC rule change",
  },
  {
    number: "02",
    title: "TRS Rate Adequacy Reform",
    current: "Current state: TRS reimbursement rate enhancements are $0.10–$0.15/hour above market rate — insufficient to offset the real costs of staff credentials, curriculum adoption, and environment upgrades needed to achieve or maintain TRS certification.",
    ask: "Commission a cost-of-quality study specific to rural Texas counties. Use findings to restructure TRS rate enhancements to cover at least 75% of documented upgrade costs. Pair with a capital improvement fund for rural providers seeking initial 2★ certification.",
    impact: "Stabilizes TRS provider base; prevents decertification attrition; enables rural supply expansion.",
    tag: "TWC budget / legislative appropriation",
  },
  {
    number: "03",
    title: "Cross-System Integration: CCS + Workforce",
    current: "Current state: CCS eligibility determination, TRS program administration, and workforce case management operate in separate data systems (TX3C, WIT, TIERS) with limited automated co-enrollment. Families seeking both child care and workforce services face duplicative intake processes.",
    ask: "Fund a joint TWC/HHSC data interoperability project to enable co-enrollment across CCS, SNAP E&T, and Choices. Require all Boards to designate a cross-trained CCS/Workforce navigator role in each full-service center.",
    impact: "Reduces family burden; increases job search success rates; creates career pathways instead of subsidy silos.",
    tag: "TWC / HHSC systems investment",
  },
];

export default function ChildCareWorkforcePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-10">

      {/* Back nav */}
      <Link href="/child-care">
        <Button variant="ghost" size="sm" className="text-muted-foreground -ml-1" data-testid="button-back-child-care">
          <ArrowLeft className="h-4 w-4 mr-1" /> Child Care & Workforce
        </Button>
      </Link>

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <Badge variant="outline" className="text-green-700 border-green-300">Policy Analysis</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Workforce Connection</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Child care is not a family benefit — it is workforce infrastructure. The economic data are unambiguous. The policy mechanisms are known. What remains is the political will to treat child care access as a labor market investment and fund it accordingly.
        </p>
      </div>

      {/* Economic stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ECONOMIC_DATA.map((s) => (
          <div key={s.label} className="p-4 rounded-lg border bg-card" data-testid={`stat-econ-${s.label.slice(0, 15).replace(/\s/g, "-").toLowerCase()}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium mt-1 leading-tight">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Four connections */}
      <div>
        <h2 className="text-xl font-semibold mb-4">How Child Care and Workforce Connect</h2>
        <div className="space-y-4">
          {CONNECTION_POINTS.map((cp) => {
            const Icon = cp.icon;
            return (
              <div key={cp.title} className="flex gap-4 p-4 rounded-lg border bg-card" data-testid={`connection-${cp.title.slice(0, 15).replace(/\s/g, "-").toLowerCase()}`}>
                <div className="shrink-0 w-10 h-10 rounded-md bg-green-50 border border-green-200 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{cp.title}</h3>
                  <p className="text-sm text-muted-foreground">{cp.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Three policy asks */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Scale className="h-5 w-5 text-sky-600" />
          <h2 className="text-xl font-semibold">Three Policy Changes That Would Move the Needle</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          These are specific, actionable asks — not aspirational goals. Each has a clear mechanism, known precedent in other states, and a direct line to measurable outcome improvement.
        </p>
        <div className="space-y-5">
          {POLICY_ASKS.map((pa) => (
            <Card key={pa.number} data-testid={`policy-card-${pa.number}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">Policy {pa.number}</span>
                  <CardTitle className="text-base">{pa.title}</CardTitle>
                </div>
                <Badge variant="outline" className="w-fit text-sky-700 border-sky-300 text-xs mt-1">{pa.tag}</Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="p-3 rounded bg-muted/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Current State</p>
                  <p className="text-muted-foreground">{pa.current}</p>
                </div>
                <div className="p-3 rounded bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900">
                  <p className="text-xs font-semibold text-sky-700 uppercase tracking-wide mb-1">The Ask</p>
                  <p className="text-sky-900 dark:text-sky-200">{pa.ask}</p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-green-700 dark:text-green-400 font-medium">{pa.impact}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* TCAF positioning */}
      <Card className="border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-800">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-sky-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sky-900 dark:text-sky-100">TCAF's Position</p>
              <p className="text-sm text-sky-800 dark:text-sky-300 mt-1">
                TCAF approaches child care as an implementation scientist, not a program administrator. We understand that the 62.2% job search success rate target in North Texas is not achieved by paperwork — it is achieved by removing barriers, connecting systems, and supporting families through the fragmented bureaucracy that separates a waitlisted single parent from a stable job. Our work in Williamson County, our policy analysis capacity, and our FHIR-interoperable data infrastructure are designed for exactly this kind of multi-system coordination challenge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nav */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link href="/child-care-wilco" className="flex-1">
          <Button variant="outline" className="w-full justify-between" data-testid="button-nav-wilco">
            WilCo Initiative <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/child-care-north-texas" className="flex-1">
          <Button variant="outline" className="w-full justify-between" data-testid="button-nav-north-texas">
            North Texas Region <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
