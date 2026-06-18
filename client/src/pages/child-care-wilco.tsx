import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin, Baby, TrendingUp, AlertTriangle, Users, Building2,
  ArrowLeft, ChevronRight, DollarSign, School, Star, CheckCircle2
} from "lucide-react";

const WILCO_STATS = [
  { label: "Eligible children served by TRS providers", value: "~8%", note: "Williamson County, 2024 est.", color: "text-red-600" },
  { label: "Statewide comparison — Bexar County", value: "~29%", note: "San Antonio metro", color: "text-amber-600" },
  { label: "Children below 85% SMI in WilCo", value: "~22,000", note: "2023 ACS 5-year estimate", color: "text-blue-600" },
  { label: "WilCo population growth (2010–2023)", value: "+78%", note: "Fastest growing large TX county", color: "text-purple-600" },
];

const GAP_ANALYSIS = [
  {
    title: "Provider Supply Has Not Kept Pace with Growth",
    detail:
      "Williamson County's population nearly doubled between 2010 and 2023, but licensed child care capacity — particularly at the 2★+ TRS level — has not scaled proportionally. New employers entering the Round Rock, Cedar Park, and Georgetown corridors face a workforce constrained by child care access.",
    icon: Building2,
    severity: "high",
  },
  {
    title: "TRS Certification Gap",
    detail:
      "Many WilCo providers operate at the basic (non-TRS) level. The capital investment needed to achieve 2★ certification — staff training, environment improvements, curriculum adoption — is a barrier smaller centers cannot self-finance. Unlike urban counties, WilCo has fewer anchor-institution funding partners to cross-subsidize upgrades.",
    icon: Star,
    severity: "high",
  },
  {
    title: "Limited Workforce Board Subsidy Reach",
    detail:
      "Capital Area Workforce Board (Workforce Solutions Capital Area) administers CCS for Travis and Williamson counties. Subsidy slots are allocated system-wide; WilCo families in high-growth suburban zip codes often face longer waits as the slot pool does not proportionally account for county-level population shifts.",
    icon: Users,
    severity: "medium",
  },
];

const OPPORTUNITIES = [
  "Quality improvement technical assistance for aspiring TRS providers (2★ → 3★ pathway)",
  "Co-enrollment support: connect families simultaneously to CCS subsidies + SNAP E&T + workforce services",
  "Employer partnerships in the tech/semiconductor corridor (Round Rock, Georgetown) to support on-site or near-site care",
  "Shadow workforce integration: home-based providers and family day care homes not yet in the TRS pipeline",
  "Parent educator co-location at child care centers (dual-generation model)",
  "Data-sharing MOU with WSCA to track WilCo-specific slot utilization and waitlist trends",
];

export default function ChildCareWilcoPage() {
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
          <MapPin className="h-6 w-6 text-sky-600" />
          <Badge variant="outline" className="text-sky-700 border-sky-300">Williamson County</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Williamson County Child Care Initiative</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          One of Texas's fastest-growing counties serves fewer than 1 in 10 eligible children through its subsidized quality child care network. WilCo's growth story is also a child care access crisis — and an opportunity for TCAF.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {WILCO_STATS.map((s) => (
          <div key={s.label} className="p-4 rounded-lg border bg-card" data-testid={`stat-wilco-${s.label.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-medium mt-1 leading-tight">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Context paragraph */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Understanding the 8% Figure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            The 8% estimate reflects the share of income-eligible children (families at or below 85% State Median Income) in Williamson County who are actively enrolled in child care with a Texas Rising Star-certified provider under a TWC subsidy. It is derived from Capital Area Workforce Board participation data and 2023 ACS income estimates.
          </p>
          <p>
            This figure is not a floor — it is a ceiling under current provider supply. WilCo has a high proportion of families just above or near the 85% SMI threshold, meaning many more households face near-unaffordable market-rate costs without qualifying for subsidies. The county's high median income masks concentrated pockets of working-poor families in the Georgetown, Leander, and Hutto corridors.
          </p>
          <p>
            For comparison, Bexar County (San Antonio) — with a longer history of organized ECE infrastructure, United Way investment, and anchor-institution presence — reaches approximately 29% of eligible children. That gap represents what intentional system-building can accomplish over time.
          </p>
        </CardContent>
      </Card>

      {/* Gap analysis */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-semibold">Where the System Breaks Down in WilCo</h2>
        </div>
        <div className="space-y-4">
          {GAP_ANALYSIS.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.title} className="flex gap-4 p-4 rounded-lg border bg-card" data-testid={`gap-card-${g.title.slice(0, 15).replace(/\s/g, "-").toLowerCase()}`}>
                <div className={`shrink-0 w-10 h-10 rounded-md flex items-center justify-center ${g.severity === "high" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
                  <Icon className={`h-5 w-5 ${g.severity === "high" ? "text-red-600" : "text-amber-600"}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{g.title}</h3>
                    <Badge variant="outline" className={`text-xs ${g.severity === "high" ? "border-red-300 text-red-700" : "border-amber-300 text-amber-700"}`}>
                      {g.severity} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{g.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Opportunities */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">TCAF Opportunities in WilCo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {OPPORTUNITIES.map((opp, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-card" data-testid={`opportunity-${i}`}>
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-sm">{opp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dual-gen callout */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <School className="h-5 w-5 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-purple-900 dark:text-purple-100">Dual-Generation Strategy</p>
              <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                TCAF's approach places child development and parent workforce development in the same frame. A child enrolled in a TRS-certified center is simultaneously a child receiving quality early learning <em>and</em> a parent freed to participate in job search, training, or stable employment. The 62.2% job search success rate in North Texas is not a child care metric — it is a workforce metric that depends entirely on child care access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nav to other sections */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link href="/child-care-north-texas" className="flex-1">
          <Button variant="outline" className="w-full justify-between" data-testid="button-nav-north-texas">
            North Texas Region <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link href="/child-care-workforce" className="flex-1">
          <Button variant="outline" className="w-full justify-between" data-testid="button-nav-workforce">
            Workforce Connection <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

    </div>
  );
}
