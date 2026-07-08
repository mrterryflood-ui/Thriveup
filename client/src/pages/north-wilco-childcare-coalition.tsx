import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Users,
  MapPin,
  Heart,
  TrendingUp,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Target,
  Lightbulb,
  School,
  Baby,
  HandHeart,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Briefcase,
  Compass,
  BookOpen,
  Car,
  Home,
  Utensils,
  CalendarCheck,
} from "lucide-react";

const COALITION_PARTNERS = [
  {
    name: "United Way of Greater Austin",
    role: "Lead funder & backbone coalition anchor — Success by Six (SX6)",
    contribution: "Grant infrastructure, collective impact framework, community trust network",
    status: "active",
    focus: "Early childhood, family economic stability",
  },
  {
    name: "Williamson County",
    role: "Municipal reach — libraries, parks, community centers",
    contribution: "Physical access points, trusted government channels, zoning & licensing pathways",
    status: "active",
    focus: "County-wide childcare infrastructure",
  },
  {
    name: "City of Taylor",
    role: "Samsung Taylor & Applied Materials workforce gateway",
    contribution: "Connects new semiconductor workforce families to childcare navigation",
    status: "active",
    focus: "Workforce-adjacent childcare demand",
  },
  {
    name: "Georgetown ISD",
    role: "Pre-K and early learning pipeline",
    contribution: "Campus-based screening, family navigator referrals, bilingual CHW embedding",
    status: "active",
    focus: "Early literacy, school readiness",
  },
  {
    name: "Round Rock ISD",
    role: "Largest district in Williamson County",
    contribution: "Family engagement infrastructure, parent navigator network",
    status: "active",
    focus: "K–3 family stability & benefits access",
  },
  {
    name: "TCAF — The Collaborative Advocate Foundation",
    role: "Technology & evaluation backbone",
    contribution: "Platform, CHW deployment, benefits screener, CFIR/RE-AIM evaluation, data infrastructure",
    status: "active",
    focus: "Backbone systems + shadow worker credentialing",
  },
];

const CHILDCARE_GAP_DATA = {
  county: "Williamson",
  population: 617396,
  eligible: 334925,
  enrolled: 191048,
  enrollmentGap: 58.6,
  barrierIndex: 17.6,
  childcareDesert: true,
  semiconductorJobs: "26,000+",
  informalCaregivers: "est. 4,200+",
};

const FUNDING_OPPORTUNITIES = [
  {
    funder: "United Way of Greater Austin — SX6",
    program: "Success by Six Coalition Grant",
    amount: "$150,000–$400,000",
    focus: "Early childhood coalition backbone",
    status: "prospect",
    deadline: "Rolling",
    fit: 96,
  },
  {
    funder: "Texas DECD",
    program: "Childcare Infrastructure Development",
    amount: "$200,000–$750,000",
    focus: "Childcare desert mitigation, workforce-adjacent supply",
    status: "prospect",
    deadline: "Q4 2026",
    fit: 91,
  },
  {
    funder: "W.K. Kellogg Foundation",
    program: "Community Engagement & Civic Infrastructure",
    amount: "$300,000–$1,000,000",
    focus: "Collective impact, community voice, family economic stability",
    status: "prospect",
    deadline: "Invitation only",
    fit: 88,
  },
  {
    funder: "Robert Wood Johnson Foundation",
    program: "Healthy Communities",
    amount: "$500,000–$2,000,000",
    focus: "Social determinants, childcare as health infrastructure",
    status: "prospect",
    deadline: "2026",
    fit: 84,
  },
  {
    funder: "CCDF — Child Care Development Fund",
    program: "Quality Childcare Infrastructure Grants (federal)",
    amount: "Variable — state-administered",
    focus: "Childcare supply expansion, workforce",
    status: "prospect",
    deadline: "Annual",
    fit: 89,
  },
];

const IMPACT_MEASURES = [
  {
    label: "Children ages 0–5 in Williamson County",
    value: "38,400",
    context: "Below federal poverty threshold; majority in childcare deserts",
    icon: Baby,
    color: "text-pink-600",
  },
  {
    label: "Benefits enrollment gap — Williamson County",
    value: "58.6%",
    context: "Of 334,925 eligible residents, fewer than half are enrolled in benefits they qualify for",
    icon: AlertTriangle,
    color: "text-orange-500",
  },
  {
    label: "Informal caregivers in North Wilco",
    value: "4,200+",
    context: "Grandmothers, aunties, neighbors, family home daycares — unlicensed but essential",
    icon: Heart,
    color: "text-rose-500",
  },
  {
    label: "New semiconductor jobs — Taylor & Hutto",
    value: "26,000+",
    context: "Samsung Taylor + Applied Materials Hutto expansion — families arriving with no childcare support",
    icon: Briefcase,
    color: "text-blue-600",
  },
];

const THEORY_OF_CHANGE = [
  {
    step: 1,
    title: "Map & Surface",
    description: "Census + CDC PLACES data identifies every census tract with childcare deserts, benefits gaps, and workforce arrivals. Primary-source, verifiable, updated annually.",
    done: true,
  },
  {
    step: 2,
    title: "Engage Shadow Workers",
    description: "Grandmothers, aunties, faith leaders, driveway journeymen — the informal workforce that holds North Wilco families together. Integration Invitation gives them a voice, a stipend pathway, and credentials. No license check. They decide what we share.",
    done: true,
  },
  {
    step: 3,
    title: "Navigate Families In",
    description: "Bilingual CHWs embedded at partner sites (libraries, churches, Samsung plant gates, school pickup). 9-benefit screener. SNAP, Medicaid, CHIP, WIC, EITC, CCAP all in one conversation.",
    done: true,
  },
  {
    step: 4,
    title: "Build Childcare Supply",
    description: "License-readiness pathways for informal caregivers who want to formalize. Coalition-coordinated facility development. Zoning + licensing navigation with the county.",
    done: false,
  },
  {
    step: 5,
    title: "Measure & Report",
    description: "CFIR/RE-AIM evaluation frame. Every enrollment tracked. Every family followed through renewal. Coalition dashboard shared with all funders in real time.",
    done: false,
  },
];

const CIM_PILLARS = [
  {
    pillar: "Co-Create Solutions",
    desc: "Solutions built with families, providers, and employers — not handed down.",
    platformSupport: "Community Voice project + shadow-worker Integration Invitation surface real caregiver input directly into the coalition's planning data.",
    grantLink: "United Way SX6 Coalition Grant — backbone convening funds this collaborative design work.",
  },
  {
    pillar: "Build Partnerships",
    desc: "Formal commitments across government, schools, employers, and community organizations.",
    platformSupport: "Coalition Partners dashboard (this page) tracks every partner's role, contribution, and status in one shared view — updated live, not a static slide.",
    grantLink: "W.K. Kellogg Community Engagement & Civic Infrastructure — funds collective-impact backbone capacity.",
  },
  {
    pillar: "Strengthen Financial Health",
    desc: "Family economic stability alongside childcare access — benefits, wages, and cost burden together.",
    platformSupport: "9-Benefit Screener (SNAP, Medicaid, CHIP, WIC, EITC, CTC, TANF, SSI, ACA) — closes the 58.6% enrollment gap that drains family budgets before childcare costs even enter the picture.",
    grantLink: "Robert Wood Johnson Healthy Communities — frames childcare + benefits as joint social-determinants infrastructure.",
  },
  {
    pillar: "Provider Support & Workforce Stability",
    desc: "Recognize and formalize the informal caregiver workforce; stabilize licensed provider capacity.",
    platformSupport: "Shadow-worker stipend + credentialing pathways (Integration Invitation) give informal caregivers a path toward licensure without a credential check gate.",
    grantLink: "Texas DECD Childcare Infrastructure Development + CCDF — direct funding lines for provider capacity and workforce stabilization.",
  },
];

const WRAPAROUND_MAP = [
  {
    need: "Transportation",
    barrierData: "Barrier Index includes a dedicated transportation weight (20%) — no-vehicle-access tracts are already flagged county-wide.",
    platformCapability: "County Intelligence dashboard surfaces no-vehicle-access census tracts alongside childcare deserts, so transportation gaps and childcare gaps can be mapped together instead of discussed separately.",
    status: "data-ready",
  },
  {
    need: "Mental Health & Family Well-Being",
    barrierData: "Referral routing engine has a live mental-health domain with urgency tiers (immediate / within-week / routine).",
    platformCapability: "Any CHW or navigator using the platform can generate an immediate mental-health referral in the same conversation as a childcare or benefits intake — no separate system needed.",
    status: "built",
  },
  {
    need: "Family Coaching & Navigation",
    barrierData: "This is the CHW/navigator model itself — bilingual Community Health Workers embedded at partner sites.",
    platformCapability: "Case Manager View + My Journey give every family a single navigator relationship instead of bouncing between agencies.",
    status: "built",
  },
  {
    need: "Housing Stability",
    barrierData: "Referral routing engine has a live housing domain (emergency/transitional housing navigation, affordable housing).",
    platformCapability: "Housing referrals route automatically alongside childcare and benefits — a family flagged for housing instability doesn't need a fourth intake form.",
    status: "built",
  },
  {
    need: "Food & Basic Needs",
    barrierData: "9-Benefit Screener includes SNAP + WIC directly; food insecurity is scored as part of the same intake as childcare need.",
    platformCapability: "A childcare-desert referral and a SNAP/WIC enrollment can happen in the same conversation — providers become trusted referral points without new infrastructure.",
    status: "built",
  },
];

const ACTION_PLAN = {
  "30-day": [
    "Finalize North Wilco Landscape Analysis priorities using ATX/San Antonio comparison",
    "Confirm childcare provider survey questions (3 max) — pull from referral routing intake pattern",
    "Map awarded Community Investment grants to the 4 CIM pillars (draft above, ready for partner review)",
  ],
  "60-day": [
    "Launch bilingual CHW provider outreach at Taylor/Hutto employer sites",
    "Draft CIM Toolkit outline — employer engagement, provider business support, funding directory sections",
    "Pilot wraparound referral routing (housing + mental health domains already live) with 1–2 coalition partners",
  ],
  "90-day": [
    "Publish CIM Toolkit v1 for partner and employer distribution",
    "Report first-quarter enrollment + referral data on coalition dashboard",
    "Formalize partner MOUs for shared services and provider stipend pathway",
  ],
};

const TOOLKIT_SECTIONS = [
  { title: "Employer Engagement Materials", audience: "Employers", desc: "One-pagers for Samsung/Applied Materials HR — childcare landscape data, referral pathway, wraparound resource map." },
  { title: "Childcare Workforce Resources", audience: "Providers", desc: "Licensure pathway guide, stipend and credentialing options for informal caregivers, shared-services opportunities." },
  { title: "Provider Business Support Tools", audience: "Providers", desc: "Facility development guidance, zoning/licensing navigation with the county, funding directory access." },
  { title: "Funding & Grant Opportunities", audience: "Community organizations", desc: "Live-pulled list from this dashboard's Funding Alignment tab — always current, not a static PDF." },
  { title: "Community Partnership Templates", audience: "Municipal & economic development partners", desc: "MOU templates, coalition onboarding checklist, shared dashboard access request." },
  { title: "Local Childcare Data & Advocacy Resources", audience: "Families & community organizations", desc: "Gap Data tab exportable as a standalone brief — Census + CDC PLACES, always sourced and dated." },
];

const VOICE_QUOTES = [
  {
    quote: "I watch four kids so their mamas can work the night shift at Samsung. I been doing this for twelve years. Nobody ever asked me what I need.",
    role: "Informal caregiver, Taylor TX",
    anonymized: true,
  },
  {
    quote: "My daughter drives 45 minutes each way to a licensed center in Round Rock because there's nothing here. She's spending $1,800 a month. That's more than rent.",
    role: "Grandmother, Georgetown TX",
    anonymized: true,
  },
  {
    quote: "We moved here for the Samsung job. HR told us childcare was 'available.' We got here and there's a 14-month waitlist.",
    role: "New resident, Taylor TX",
    anonymized: true,
  },
];

function StatusDot({ status }: { status: string }) {
  if (status === "active") return <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />;
  if (status === "prospect") return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />;
  return <span className="inline-block w-2 h-2 rounded-full bg-slate-300 mr-1.5" />;
}

export default function NorthWilcoChildcareCoalitionPage() {
  const [tab, setTab] = useState("overview");

  const gapPct = CHILDCARE_GAP_DATA.enrollmentGap;
  const enrolledPct = 100 - gapPct;

  return (
    <div
      className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6"
      data-testid="page-north-wilco-childcare-coalition"
    >
      {/* Header */}
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-sky-700 text-white text-[10px] uppercase tracking-wider">
                Wilco Success by Six · SX6
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-green-600 text-green-700">
                Coalition Active
              </Badge>
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold tracking-tight"
              data-testid="text-page-title"
            >
              North Wilco Childcare Coalition
            </h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">
              A WAB2-model collective impact initiative — United Way of Greater Austin × TCAF × Williamson County partners.
              Closing the childcare gap for families in the Samsung Taylor–Hutto semiconductor corridor.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" asChild data-testid="link-voice-project">
              <Link href="/voice/north-wilco-childcare-gaps">
                <Heart className="h-3.5 w-3.5 mr-1" />
                Community Voice
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild data-testid="link-benefits">
              <Link href="/benefits">
                <HandHeart className="h-3.5 w-3.5 mr-1" />
                Benefits Navigator
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild data-testid="link-corridor">
              <Link href="/corridor-intelligence">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                County Intelligence
              </Link>
            </Button>
          </div>
        </div>

        {/* Key metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMPACT_MEASURES.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} data-testid={`card-metric-${m.label.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    <Icon className={`h-3.5 w-3.5 ${m.color}`} />
                    <span className="line-clamp-1">{m.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.context}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </header>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} data-testid="tabs-coalition">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="gap-data" data-testid="tab-gap-data">Gap Data</TabsTrigger>
          <TabsTrigger value="coalition" data-testid="tab-coalition">Coalition Partners</TabsTrigger>
          <TabsTrigger value="theory" data-testid="tab-theory">Theory of Change</TabsTrigger>
          <TabsTrigger value="funding" data-testid="tab-funding">Funding Alignment</TabsTrigger>
          <TabsTrigger value="pillars" data-testid="tab-pillars">CIM Pillars</TabsTrigger>
          <TabsTrigger value="wraparound" data-testid="tab-wraparound">Wraparound Map</TabsTrigger>
          <TabsTrigger value="toolkit" data-testid="tab-toolkit">CIM Toolkit</TabsTrigger>
          <TabsTrigger value="action-plan" data-testid="tab-action-plan">30/60/90 Plan</TabsTrigger>
          <TabsTrigger value="voice" data-testid="tab-voice">Community Voice</TabsTrigger>
        </TabsList>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-5 mt-4">
          <div className="grid md:grid-cols-2 gap-5">
            <Card data-testid="card-the-gap">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" /> The Gap
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Williamson County is one of the fastest-growing counties in the United States — and one of the most
                  childcare-starved. Samsung's Taylor fab and Applied Materials' Hutto expansion are bringing
                  <strong> 26,000+ new semiconductor jobs</strong> to families who arrive with no childcare options,
                  no local network, and no navigator.
                </p>
                <p>
                  At the same time, <strong>58.6% of Williamson County residents who qualify for benefits aren't enrolled</strong> — 
                  143,877 people leaving SNAP, Medicaid, CHIP, WIC, and EITC on the table. For young families, that gap 
                  is the difference between keeping a child in daycare and quitting a job.
                </p>
                <p>
                  The informal caregivers — the grandmothers, aunties, and neighbors running unlicensed home daycares in Taylor,
                  Hutto, and Georgetown — are <em>already</em> the childcare system. They have no stipend, no credential, and
                  no recognition.
                </p>
                <div className="pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Currently enrolled in eligible benefits</span>
                    <span className="font-semibold text-green-700">{enrolledPct.toFixed(1)}%</span>
                  </div>
                  <Progress value={enrolledPct} className="h-2" />
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Gap — not enrolled</span>
                    <span className="font-semibold text-orange-500">{gapPct}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-coalition-model">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-600" /> The Coalition Model
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  No single organization closes a gap this large. The North Wilco Childcare Coalition uses the 
                  <strong> WAB2 collective impact framework</strong> — United Way of Greater Austin as the convener,
                  TCAF as the backbone technology and evaluation engine, and Williamson County partners as trusted
                  local access points.
                </p>
                <ul className="space-y-1.5">
                  {["United Way of Greater Austin — SX6 anchor", "Williamson County — libraries, parks, spaces", "City of Taylor — Samsung corridor gateway", "Georgetown ISD + Round Rock ISD — campus navigator embedding", "TCAF — technology, CHW deployment, evaluation"].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setTab("coalition")} data-testid="button-view-all-partners">
                  View all partners <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card data-testid="card-what-platform-does">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-violet-600" /> What This Platform Delivers for the Coalition
              </CardTitle>
              <CardDescription>
                The same infrastructure TCAF uses for the 5-county Benefits Initiative — deployable for any coalition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  { icon: MapPin, title: "Primary-Source Gap Maps", desc: "Census + CDC PLACES — every census tract, every county, verified and linked." },
                  { icon: HandHeart, title: "9-Benefit Screener", desc: "SNAP · Medicaid · CHIP · WIC · EITC · CTC · TANF · SSI · ACA — one conversation, any language." },
                  { icon: Heart, title: "Shadow Worker Recognition", desc: "Integration Invitation — informal caregivers get voice, stipend pathways, and credential options. No license check. Their story, their consent." },
                  { icon: School, title: "Partner Workspace", desc: "Every coalition member gets a shared dashboard — referrals, enrollment tracking, outcome data." },
                  { icon: TrendingUp, title: "CFIR / RE-AIM Evaluation", desc: "39 constructs, funder-ready reports, Title IV-E Clearinghouse-grade rigor." },
                  { icon: Building2, title: "Funder Evidence Package", desc: "Primary-source data + LOI draft + logic model + narrative — generated and linked for any grant." },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-start gap-2 rounded-lg border p-3">
                      <Icon className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GAP DATA */}
        <TabsContent value="gap-data" className="space-y-5 mt-4">
          <Card data-testid="card-wilco-county-data">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-sky-600" /> Williamson County — Primary-Source Snapshot
              </CardTitle>
              <CardDescription>
                Source: U.S. Census ACS · CDC PLACES · BLS · TCAF Benefits Intelligence System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Population", value: "617,396", sub: "One of fastest-growing counties in US" },
                  { label: "Benefits-Eligible Residents", value: "334,925", sub: "Who qualify for ≥1 public benefit" },
                  { label: "Currently Enrolled", value: "191,048", sub: "Leaving 143,877 without benefits they qualify for" },
                  { label: "Enrollment Gap", value: "58.6%", sub: "Of eligible residents NOT enrolled", alert: true },
                  { label: "Barrier Index", value: "17.6", sub: "Language · transportation · broadband · trust" },
                  { label: "Childcare Desert Status", value: "YES", sub: "Fewer than 1 licensed slot per 3 children under 5", alert: true },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-lg border p-4 ${item.alert ? "border-orange-300 bg-orange-50 dark:bg-orange-950/20" : ""}`}
                    data-testid={`stat-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{item.label}</div>
                    <div className={`text-2xl font-bold mt-1 ${item.alert ? "text-orange-600" : ""}`}>{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-semiconductor-demand">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-600" /> Semiconductor Workforce — New Childcare Demand
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 space-y-1">
                  <div className="font-semibold text-blue-700">Samsung Austin Semiconductor — Taylor Fab</div>
                  <div className="text-muted-foreground">$17B expansion · 2,000 direct jobs · 12,000+ indirect · families relocating nationally and internationally</div>
                  <div className="text-xs text-orange-600 font-medium mt-2">⚠ Korean and Taiwanese worker families — childcare gap + language barrier</div>
                </div>
                <div className="rounded-lg border p-4 space-y-1">
                  <div className="font-semibold text-blue-700">Applied Materials — Hutto MTC</div>
                  <div className="text-muted-foreground">Manufacturing Technology Center · 600+ direct jobs · pipeline of supplier firms · families arriving with 12–18 month childcare waitlists</div>
                  <div className="text-xs text-orange-600 font-medium mt-2">⚠ No local childcare infrastructure built alongside workforce recruitment</div>
                </div>
              </div>
              <p className="text-muted-foreground">
                The county recruited the employers. Nobody coordinated the childcare. That is the gap this coalition fills.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild data-testid="link-full-benefits-data">
              <Link href="/benefits">
                View full 5-county Benefits Intelligence <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </TabsContent>

        {/* COALITION PARTNERS */}
        <TabsContent value="coalition" className="space-y-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {COALITION_PARTNERS.map((partner) => (
              <Card key={partner.name} data-testid={`card-partner-${partner.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-semibold text-sm leading-snug">{partner.name}</div>
                    <div className="flex items-center shrink-0">
                      <StatusDot status={partner.status} />
                      <span className="text-xs text-muted-foreground capitalize">{partner.status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mb-1.5">{partner.role}</div>
                  <div className="text-xs border-l-2 border-sky-300 pl-2 text-sky-800 dark:text-sky-300">
                    {partner.contribution}
                  </div>
                  <Badge variant="secondary" className="mt-2 text-[10px]">{partner.focus}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-dashed" data-testid="card-join-coalition">
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="font-medium text-sm">Want to join the coalition?</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Every new partner adds reach, trust, and access. Libraries · faith communities · employers · health clinics · school districts.
                </div>
              </div>
              <Button size="sm" data-testid="button-contact-coalition">
                <Building2 className="h-3.5 w-3.5 mr-1" /> Contact TCAF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THEORY OF CHANGE */}
        <TabsContent value="theory" className="space-y-4 mt-4">
          <div className="space-y-3">
            {THEORY_OF_CHANGE.map((step) => (
              <div
                key={step.step}
                className={`rounded-xl border p-4 flex gap-4 ${step.done ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "border-dashed"}`}
                data-testid={`card-toc-step-${step.step}`}
              >
                <div className="flex flex-col items-center gap-1 shrink-0">
                  {step.done
                    ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                    : <Circle className="h-5 w-5 text-slate-400" />}
                  <span className="text-xs font-bold text-muted-foreground">{step.step}</span>
                </div>
                <div>
                  <div className={`font-semibold text-sm ${step.done ? "text-green-800 dark:text-green-300" : "text-foreground"}`}>
                    {step.title}
                    {step.done && <Badge className="ml-2 text-[10px] bg-green-600 text-white">Platform ready</Badge>}
                    {!step.done && <Badge variant="outline" className="ml-2 text-[10px]">Next phase</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
          <Card className="bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800" data-testid="card-evaluation-frame">
            <CardContent className="pt-4 pb-4">
              <div className="font-semibold text-sm text-violet-800 dark:text-violet-300 mb-1 flex items-center gap-1.5">
                <Target className="h-4 w-4" /> Evaluation Framework
              </div>
              <div className="text-sm text-violet-700 dark:text-violet-300">
                CFIR (39 constructs) · RE-AIM · EPIS · Title IV-E Clearinghouse-grade rigor · FHIR/CDS-Hooks interoperable data ·
                0-PHI-egress architecture · witness-logged & auditable · real-time coalition dashboard for all funders
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FUNDING ALIGNMENT */}
        <TabsContent value="funding" className="space-y-4 mt-4">
          <div className="space-y-3">
            {FUNDING_OPPORTUNITIES.map((opp) => (
              <Card key={opp.funder} data-testid={`card-funding-${opp.funder.toLowerCase().replace(/\s+/g, "-").slice(0, 25)}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-sm">{opp.funder}</span>
                        <Badge variant="outline" className="text-[10px]">{opp.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">{opp.program}</div>
                      <div className="text-xs text-sky-700 dark:text-sky-300">{opp.focus}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-sm">{opp.amount}</div>
                      <div className="text-xs text-muted-foreground">Deadline: {opp.deadline}</div>
                      <div className="mt-1">
                        <div className="text-xs text-muted-foreground mb-0.5">Platform fit</div>
                        <div className="flex items-center gap-1.5">
                          <Progress value={opp.fit} className="h-1.5 w-16" />
                          <span className="text-xs font-bold text-green-700">{opp.fit}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-dashed" data-testid="card-funding-note">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-sm text-muted-foreground">
                  All funding prospects can be developed into full grant packages — compliance matrix, narrative, logic model, budget —
                  directly from this dashboard.{" "}
                  <Link href="/grants" className="underline text-foreground">Open Grant Command Center →</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CIM PILLARS */}
        <TabsContent value="pillars" className="space-y-4 mt-4">
          <Card className="border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/20" data-testid="card-pillars-intro">
            <CardContent className="pt-4 pb-4 text-sm text-sky-900 dark:text-sky-200">
              <strong>July 9 CIM Partner Meeting — Awarded Grants & Alignment.</strong> Mapping how current grant-funded
              work and platform capabilities already advance each of the four Childcare Infrastructure Model pillars.
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-2 gap-4">
            {CIM_PILLARS.map((p, i) => (
              <Card key={p.pillar} data-testid={`card-pillar-${i}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-sky-600" /> {p.pillar}
                  </CardTitle>
                  <CardDescription>{p.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Platform support today</div>
                    <div>{p.platformSupport}</div>
                  </div>
                  <div className="rounded-lg border-l-2 border-green-400 pl-3 text-xs text-green-800 dark:text-green-300">
                    {p.grantLink}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* WRAPAROUND MAP */}
        <TabsContent value="wraparound" className="space-y-4 mt-4">
          <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20" data-testid="card-wraparound-intro">
            <CardContent className="pt-4 pb-4 text-sm text-rose-900 dark:text-rose-200">
              <strong>"If we successfully increase childcare capacity, what other barriers might still prevent families
              from participating?"</strong> Here's what's already built or data-ready on this platform for each need
              named in the CIM wraparound discussion.
            </CardContent>
          </Card>
          <div className="space-y-3">
            {WRAPAROUND_MAP.map((w) => {
              const Icon = w.need.includes("Transportation") ? Car
                : w.need.includes("Mental Health") ? Heart
                : w.need.includes("Family Coaching") ? Compass
                : w.need.includes("Housing") ? Home
                : Utensils;
              return (
                <Card key={w.need} data-testid={`card-wraparound-${w.need.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <Icon className="h-4 w-4 text-rose-500" /> {w.need}
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${w.status === "built" ? "border-green-600 text-green-700" : "border-amber-500 text-amber-600"}`}
                      >
                        {w.status === "built" ? "Built & live" : "Data-ready"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-1.5">{w.barrierData}</div>
                    <div className="text-sm">{w.platformCapability}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* CIM TOOLKIT */}
        <TabsContent value="toolkit" className="space-y-4 mt-4">
          <Card className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20" data-testid="card-toolkit-intro">
            <CardContent className="pt-4 pb-4 text-sm text-violet-900 dark:text-violet-200">
              <strong>CIM Toolkit — draft outline for discussion.</strong> Every section below can be pulled live from
              existing platform data rather than built as a one-off static document.
            </CardContent>
          </Card>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOOLKIT_SECTIONS.map((s) => (
              <Card key={s.title} data-testid={`card-toolkit-${s.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-violet-600 shrink-0" />
                    <div className="font-medium text-sm">{s.title}</div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] mb-1.5">{s.audience}</Badge>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 30/60/90 ACTION PLAN */}
        <TabsContent value="action-plan" className="space-y-4 mt-4">
          <Card className="border-dashed" data-testid="card-action-plan-intro">
            <CardContent className="pt-4 pb-4 text-sm text-muted-foreground">
              Draft starting point for the July 9 "Concrete Steps to Move the Model Forward" session — edit live with the coalition.
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(ACTION_PLAN).map(([period, items]) => (
              <Card key={period} data-testid={`card-plan-${period}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-sky-600" /> {period}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Circle className="h-3 w-3 text-slate-400 mt-1 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* COMMUNITY VOICE */}
        <TabsContent value="voice" className="space-y-4 mt-4">
          <Card data-testid="card-shadow-workers">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-500" /> The Informal Workforce That's Already There
              </CardTitle>
              <CardDescription>
                These community members are North Wilco's de facto childcare system. They deserve recognition, not just documentation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {VOICE_QUOTES.map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg border-l-4 border-rose-300 bg-rose-50 dark:bg-rose-950/20 pl-4 pr-3 py-3"
                  data-testid={`quote-${i}`}
                >
                  <p className="text-sm italic text-foreground">"{q.quote}"</p>
                  <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <span className="font-medium">{q.role}</span>
                    {q.anonymized && <Badge variant="secondary" className="text-[10px]">Anonymized with consent</Badge>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20" data-testid="card-integration-invitation">
            <CardContent className="pt-4 pb-4">
              <div className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-rose-500" /> Integration through Invitation
              </div>
              <div className="text-sm text-muted-foreground space-y-1.5">
                <p>
                  If you're watching kids that aren't yours so their parents can work the night shift at Samsung Taylor or Applied Materials Hutto —
                  if you're the abuela, the auntie, the neighbor, the family home daycare with no license but a full house — <strong>you ARE the childcare system in North Wilco.</strong>
                </p>
                <p>
                  We want to hear you on your terms. No license check. No proof asked. You decide what we do with what you share.
                  Stipend pathways are real. Credential options are yours to take or leave.
                </p>
              </div>
              <Button size="sm" className="mt-3 bg-rose-600 hover:bg-rose-700 text-white" asChild data-testid="button-add-voice">
                <Link href="/voice/north-wilco-childcare-gaps">
                  Add your voice <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Footer nav */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-muted-foreground">
        <div>
          North Wilco Childcare Coalition · TCAF EIN 41-3618003 ·{" "}
          <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="underline text-foreground">
            terryflood@thrivingcommunitiesforall.com
          </a>
        </div>
        <div className="flex gap-3">
          <Link href="/our-approach" className="underline">Our Approach</Link>
          <Link href="/corridor-intelligence" className="underline">County Intelligence</Link>
          <Link href="/benefits" className="underline">Benefits Data</Link>
          <Link href="/impact" className="underline">Impact Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
