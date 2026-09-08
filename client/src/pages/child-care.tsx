import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EvidenceSummary } from "@/components/evidence-label";
import {
  Baby, AlertTriangle, TrendingUp, MapPin, Users, BarChart3, Globe2,
  ArrowRight, Building2, GraduationCap, Briefcase, ChevronRight,
  FileText, Target, DollarSign, Clock
} from "lucide-react";

const KEY_STATS = [
  {
    label: "Children on Statewide Waitlist",
    value: "36,000+",
    context: "Texas, 2024",
    color: "bg-red-50 border-red-200 text-red-900",
    badge: "critical",
  },
  {
    label: "Eligible Children Served — WilCo",
    value: "~8%",
    context: "Williamson County",
    color: "bg-amber-50 border-amber-200 text-amber-900",
    badge: "local gap",
  },
  {
    label: "Eligible Children Served — Bexar",
    value: "~29%",
    context: "San Antonio / TRS providers",
    color: "bg-amber-50 border-amber-200 text-amber-900",
    badge: "local gap",
  },
  {
    label: "Children Served Daily — N. Texas",
    value: "1,032",
    context: "WSNT region · 62 TRS providers",
    color: "bg-blue-50 border-blue-200 text-blue-900",
    badge: "current",
  },
];

const STRUCTURAL_FAILURES = [
  {
    number: "01",
    title: "Supply Floor, Not a Pipeline",
    description:
      "Texas funds child care slots reactively — only serving families already attached to the workforce system. Families on waitlists cannot access child care to *enter* the workforce. The system excludes the people it is designed to help.",
    icon: Building2,
  },
  {
    number: "02",
    title: "Quality Incentive Without Infrastructure",
    description:
      "Texas Rising Star (TRS) requires significant provider investment in staff credentials, curriculum, and environment improvements. Reimbursement rate enhancements ($0.10–$0.15/hr) are insufficient to offset real upgrade costs — particularly in rural and underserved counties.",
    icon: GraduationCap,
  },
  {
    number: "03",
    title: "Workforce System Siloed from Child Care System",
    description:
      "Child care subsidy administration lives at the Workforce Board level, but connection to the job-search success metric is weak. Families navigating both systems face fragmented eligibility rules, recertification cliffs, and staff who aren't cross-trained.",
    icon: Briefcase,
  },
];

const SECTION_LINKS = [
  {
    href: "/child-care/national",
    title: "National Supply & Economic Context",
    description: "Compare live Census childcare establishment data with child-population estimates and an attributed ALICE benchmark.",
    icon: Globe2,
    badge: "national",
  },
  {
    href: "/child-care-wilco",
    title: "Williamson County Initiative",
    description: "Local data, partnership strategy, and the case for a WilCo-specific quality improvement effort.",
    icon: MapPin,
    badge: "active",
  },
  {
    href: "/child-care-north-texas",
    title: "North Texas Region",
    description: "WSNT region: 11 counties, 62 TRS providers, 1,032 children/day. Regional waitlist and workforce impact.",
    icon: BarChart3,
    badge: "proposal",
  },
  {
    href: "/child-care-workforce",
    title: "Workforce Connection",
    description: "The economic case: how child care availability directly drives job search success rates and labor force participation.",
    icon: TrendingUp,
    badge: "policy",
  },
];

export default function ChildCarePage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Baby className="h-7 w-7 text-sky-600" />
          <h1 className="text-3xl font-bold tracking-tight">Child Care & Workforce</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">
          Child care is workforce infrastructure — not a family benefit. When families cannot access affordable, quality child care, they cannot participate in the labor market. This section documents the system, identifies the gaps, and positions TCAF's work in WilCo, North Texas, and statewide.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className="text-sky-700 border-sky-300">TWC / CCS System</Badge>
          <Badge variant="outline" className="text-green-700 border-green-300">Texas Rising Star</Badge>
          <Badge variant="outline" className="text-amber-700 border-amber-300">Waitlist Crisis</Badge>
          <Badge variant="outline" className="text-purple-700 border-purple-300">Workforce Connection</Badge>
        </div>
      </div>

      {/* Key Stats */}
      <div>
        <h2 className="text-xl font-semibold mb-4">By the Numbers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KEY_STATS.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg border p-4 ${stat.color}`}
              data-testid={`stat-card-${stat.label.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm font-medium mt-1">{stat.label}</p>
              <p className="text-xs opacity-70 mt-1">{stat.context}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Sources: TWC CCS participation data (2024); WSNT RFP2026-004 (Apr 2026); PN3 statewide analysis; City of San Antonio Early Learning Landscape Study (2024).
        </p>
        <EvidenceSummary
          claims={[{
            value: "36,000+",
            unit: "children on the statewide waitlist",
            source: "HHSC CCL (TX) + Census CBP 2022 NAICS 6244",
            sourceId: "hhsc-ccl-childcare",
            asOfDate: "2022",
            geographyKey: "Texas",
            confidence: "verified",
            decisionCaption: "Use these childcare supply signals to identify regions requiring further capacity review.",
          }]}
        />
      </div>

      {/* Statewide Context */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-sky-600" />
              How the Texas CCS System Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Texas delivers child care subsidies through 28 Local Workforce Development Boards. Families at or below 85% of the State Median Income (SMI) may qualify — but eligibility alone doesn't guarantee a slot. Most boards operate waitlists.
            </p>
            <p>
              Quality providers are designated through the <strong className="text-foreground">Texas Rising Star (TRS)</strong> system — a tiered certification (2★ through 4★) tied to staff credentials, curriculum, and environment. As of April 2026, all 62 contracted providers in the WSNT region carry TRS designation.
            </p>
            <p>
              The statewide performance measure that matters most to funders: <strong className="text-foreground">Child Care Initial Job Search Success Rate</strong> — currently targeted at 62.2%.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              The Economic Stakes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Research consistently shows that child care unavailability costs states far more than subsidy provision. A 2022 U.S. Chamber of Commerce Foundation analysis estimated child care-related workforce losses cost Texas <strong className="text-foreground">$9.3 billion annually</strong> in lost productivity, wages, and tax revenue.
            </p>
            <p>
              For individual families, the median cost of center-based infant care in Texas ($11,000–$14,000/year) exceeds average rent. Without a subsidy, low-income families face a direct labor-force participation barrier.
            </p>
            <p>
              For employers: absenteeism, turnover, and reduced hours tied to child care disruption costs U.S. employers an estimated <strong className="text-foreground">$12.7 billion/year</strong> (Council for a Strong America, 2023).
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3 Structural Failures */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <h2 className="text-xl font-semibold">Three Structural Failures</h2>
        </div>
        <div className="space-y-4">
          {STRUCTURAL_FAILURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.number} className="flex gap-4 p-4 rounded-lg border bg-card" data-testid={`failure-card-${f.number}`}>
                <div className="shrink-0 w-10 h-10 rounded-md bg-red-50 border border-red-200 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{f.number}</span>
                    <h3 className="font-semibold">{f.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{f.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section navigator */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Explore by Region & Topic</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SECTION_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <div
                  className="group p-5 rounded-lg border bg-card hover:border-sky-400 hover:shadow-sm transition-all cursor-pointer"
                  data-testid={`nav-card-${link.href.slice(1)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-md bg-sky-50 border border-sky-200 flex items-center justify-center">
                      <Icon className="h-4.5 w-4.5 text-sky-600" />
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{link.badge}</Badge>
                  </div>
                  <h3 className="font-semibold group-hover:text-sky-700 transition-colors mb-1">{link.title}</h3>
                  <p className="text-sm text-muted-foreground">{link.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-xs text-sky-600 font-medium">
                    Explore <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Policy ask teaser */}
      <Card className="border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-800">
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="font-semibold text-sky-900 dark:text-sky-100">Three Policy Changes That Would Move the Needle</p>
              <p className="text-sm text-sky-800 dark:text-sky-300 mt-1">
                Meaningful state-level changes are possible — supply expansion funding, TRS rate reform, and real workforce-childcare integration. See the full analysis.
              </p>
            </div>
            <Link href="/child-care-workforce">
              <Button variant="outline" className="border-sky-400 text-sky-700 hover:bg-sky-100 shrink-0" data-testid="button-policy-analysis">
                Policy Analysis <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
