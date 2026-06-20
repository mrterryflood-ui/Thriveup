import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "wouter";
import SectionTutorial from "@/components/section-tutorial";
import { SECTION_TUTORIALS } from "@/lib/tutorial-content";
import {
  GraduationCap, Building2, Globe, Heart, Users, Target, Sparkles,
  ArrowRight, DollarSign, Shield, BarChart3, Briefcase, TrendingUp,
  BookOpen, Award, Zap, CheckCircle2, ExternalLink, Layers,
  Rocket, MapPin, Brain, Scale, Microscope, HandshakeIcon, Network, Star,
} from "lucide-react";
import React, { useState } from "react";
import { MISSION_STATEMENT, VISION_STATEMENT, VALUES } from "@/lib/mvv-content";
import terryPhoto from "@assets/Terry2_1773768611245.jpg";
import terryMilitaryPhoto from "@assets/pic1_1773768611248.jpg";

const ecosystemPlatforms = [
  {
    name: "ThriveUp Academy",
    role: "Develops the People",
    layer: "Education & Workforce",
    entity: "501(c)(3) Nonprofit",
    url: "https://thrivingcommunitiesforall.com",
    gradient: "from-violet-600 to-indigo-700",
    icon: GraduationCap,
    capabilities: [
      "AI curriculum (Grades 3-12 + Adult)",
      "50+ career pipelines across 4+ industries",
      "Grant Discovery Engine with AI scoring",
      "Coalition management & prevention",
      "Case management & reentry support",
      "Community intelligence mapping (GIS)",
      "Facilitator hub & curriculum delivery",
      "Post-award program management",
      "Bilingual (EN/ES) with crisis support",
    ],
    revenue: "Grant-funded (DOL, DOE, SBA, DOJ, SAMHSA, HRSA)",
  },
  {
    name: "Minority Center of Excellence",
    role: "Develops the Businesses",
    layer: "Business Ecosystem",
    entity: "For-Profit SaaS",
    url: "",
    gradient: "from-emerald-600 to-teal-700",
    icon: Building2,
    capabilities: [
      "656,794 curated business records",
      "14 AI tools across 4 providers",
      "6-stage business journey (Form → Grow)",
      "Dual-AI proposal review system",
      "SAM.gov live contract integration",
      "Certification wizard for 9 federal programs",
      "B2B networking & teaming hub",
      "Business Health Score analytics",
      "50-state + DC coverage",
    ],
    revenue: "SaaS tiers: Free / $49 / $149 / $349+ /mo",
  },
  {
    name: "The Collaborative Advocate",
    role: "Connects It All + AI Consulting",
    layer: "Umbrella / Advocacy / Consulting",
    entity: "VOSB Organization",
    url: "",
    gradient: "from-amber-600 to-orange-700",
    icon: Globe,
    capabilities: [
      "AI Consulting Services (Strategy → Implementation → CoE)",
      "Multi-provider AI architecture design & deployment",
      "RAG knowledge base & governance framework buildout",
      "MAP-GAP continuous improvement consulting",
      "26-platform ecosystem narrative & advocacy",
      "Grant alignment, compliance automation & evidence by architecture",
      "Implementation science services (CFIR, RE-AIM)",
      "Federal contract execution & VOSB partnerships",
    ],
    revenue: "AI Consulting ($2.5K–$150K engagements), federal contracts, implementation science",
  },
];

const fundingStreams = [
  { source: "DOL Workforce Innovation (WIOA)", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["ThriveUp Academy"] },
  { source: "DOE Education Grants", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["ThriveUp Academy"] },
  { source: "SBA SBIR/STTR", amount: "Up to $2M", status: "Eligible", deadline: "Rolling", platforms: ["ThriveUp Academy", "MCE"] },
  { source: "DOC MBDA Grants", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["MCE"] },
  { source: "SBA Community Advantage", amount: "Varies", status: "Eligible", deadline: "Ongoing", platforms: ["ThriveUp Academy", "MCE"] },
  { source: "DOJ/OJJDP Prevention", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["ThriveUp Academy"] },
  { source: "MCE SaaS Subscriptions", amount: "$49-$349+/mo per user", status: "Revenue Stream", deadline: "Ongoing", platforms: ["MCE"] },
  { source: "APEX Accelerator Partnerships", amount: "Contract-based", status: "Pipeline", deadline: "Ongoing", platforms: ["MCE"] },
];

type FunderLensKey = "foundation" | "dol" | "samhsa" | "va" | "contract";

const FUNDER_LENSES: Record<FunderLensKey, {
  label: string;
  icon: React.ElementType;
  headline: string;
  points: { label: string; value: string }[];
  cta: string;
  ctaHref: string;
}> = {
  foundation: {
    label: "Private Foundation",
    icon: Building2,
    headline: "Decades of theory. One platform built to prove it.",
    points: [
      { label: "Legal identity", value: "501(c)(3) determined Jan 14, 2026 · EIN 41-3618003 · UEI KDDVD1FGLW35 · SAM.gov active" },
      { label: "Theory of change", value: "5 CFIR 2.0 domains, 39 constructs operationalized in /research-hub — not named in a deck, instantiated in production code" },
      { label: "Evidence architecture", value: "86 RAG chunks grounded in primary-source commitments · NRRC fidelity benchmarks in scoring rubrics · RE-AIM evaluation lens in outcome reporting" },
      { label: "Community reach", value: "107 languages (89 spoken + 18 signed) · dialect-preserving AI (AAVE, Spanglish) · ITI doctrine: 8 layered consents all default OFF, shadow worker stipend + credentialing pathways real" },
      { label: "Grant readiness", value: "Live funding intelligence engine, AI fit-scored against community partner profiles · $1.187B CDMRP addressable · 7-tab post-award management module already built and running" },
      { label: "On track record", value: "Infrastructure is the track record: 271 DB tables, 211 pages, 5 physics-grade trade simulations with 43 passing automated tests — all in production before any grant award" },
    ],
    cta: "Schedule a walkthrough",
    ctaHref: "/contact",
  },
  dol: {
    label: "DOL / WIOA",
    icon: Briefcase,
    headline: "Built to WIOA. Not adapted to it.",
    points: [
      { label: "CTE alignment", value: "All 20 TEKS §127.15 standards covered · 15-week AI-personalized workforce readiness curriculum · self-paced, no prerequisites" },
      { label: "Trade pathways", value: "5 trades × 15 lessons = 75 lessons · physics-grade simulations (MNA electrical, Hardy-Cross plumbing, AWS D1.1 welding, HVAC) · credential routing at 80% completion" },
      { label: "WIOA-eligible populations", value: "Out-of-school youth 16-24 · returning citizens · veterans · adults with significant barriers · all target populations in production user flows" },
      { label: "Outcome tracking", value: "Employment at 30/90/180/365 days · credential attainment · wage gain · housing stability — all exportable for ETA-9169 performance reporting" },
      { label: "Compliance architecture", value: "Self-governing directive system · MAP-GAP CQI · grant-ready evidence dashboard · partner MOU tracking · referral workflow verification" },
      { label: "Local infrastructure", value: "Pflugerville ISD, Manor ISD, Austin ISD CTE partnerships · Travis County reentry population access · coalition management dashboard" },
    ],
    cta: "Explore Workforce Tools",
    ctaHref: "/academy/careers",
  },
  samhsa: {
    label: "SAMHSA / DFC",
    icon: Shield,
    headline: "The whole DFC package. Already assembled.",
    points: [
      { label: "12-sector coalition", value: "Dashboard maps all 12 ONDCP-required DFC sectors · gap analysis · recruitment targets · capacity assessments aligned to evidence-based frameworks" },
      { label: "Prevention curriculum", value: "24-module youth substance prevention · 8 substance topics · 3 age tiers (10-14, 15-18, 19-24) · 13 parent education modules · fidelity scoring per session" },
      { label: "Evidence base", value: "SAMHSA/NIDA evidence registry · CFIR 2.0 fidelity benchmarks · RE-AIM evaluation · RPLICE implementation science at implementationineducatio.com" },
      { label: "Community engagement", value: "Sankofa Health Network for behavioral health baseline data · LifeBridge virtual 211 · 107-language reach · promotora/CHW integration via ITI doctrine" },
      { label: "Logic model auto-population", value: "Grant Narrative Builder pulls live platform data · DFC Readiness checklist tracks every requirement with status · budget builder with in-kind match calculator" },
      { label: "Applicant status", value: "First-time applicant — infrastructure is the differentiator. Coalition dashboard, prevention delivery, and outcome tracking are live, not proposed." },
    ],
    cta: "View DFC Command Center",
    ctaHref: "/ecosystem",
  },
  va: {
    label: "VA / DoD",
    icon: Star,
    headline: "Veteran-built. Veteran-tested. Veteran-operated.",
    points: [
      { label: "Founder credentials", value: "Dr. Flood = CW2 (Ret.), 20 years active service, Bronze Star (×2), medically retired, service-connected disability · active U.S. government Secret clearance" },
      { label: "SDVOSB / VOSB", value: "VOSB certified · SDVOSB application in progress · VA Veterans First statute: SDVOSB set-asides take precedence, sole-source authority up to $5M once certified" },
      { label: "M2C Transition platform", value: "Military-to-civilian: skills mapping, benefits navigation, peer mentorship, employer connections — live at vetmissiontransition.com" },
      { label: "SSG Fox FY27", value: "Veteran Suicide Prevention Grant · due June 12, 2026 · C-SSRS screening, safety plans, 988 integration already built into platform" },
      { label: "Reentry stack", value: "11 DB tables: RNR assessments, CBI programs, recidivism baselines, family visitation tracking — gold-standard veteran reintegration frameworks in production" },
      { label: "Federal acquisition", value: "TCAF CAGE 209N1 · ISS LLC CAGE 9VKK3 · both SAM.gov active · FAR-compliant contracting · ISS LLC for SBIR/STTR/DoD contract vehicles" },
    ],
    cta: "Contact Dr. Flood",
    ctaHref: "/contact",
  },
  contract: {
    label: "Federal Contract",
    icon: Target,
    headline: "Infrastructure first. Proof second.",
    points: [
      { label: "Entity registrations", value: "TCAF 501(c)(3): UEI KDDVD1FGLW35, CAGE 209N1 · ISS LLC for-profit: UEI C7YDV3P8EHL7, CAGE 9VKK3 · both SAM.gov active, independently renewable" },
      { label: "SDVOSB / VOSB status", value: "VOSB certified · SDVOSB filing in progress · Dr. Flood: medically retired, service-connected · VA Veterans First statutory preference on every DoD/VA bid" },
      { label: "Technical depth", value: "271 DB tables · 4-engine AI (Claude, GPT-4o-mini, Gemini, DeepSeek R1) · FHIR/CDS-Hooks interoperable · 0-PHI egress architecture · WCAG 2.1 AA · COPPA compliant" },
      { label: "Teaming roster", value: "HIS / Eric Hargrave (compliance + federal) · Love Clinic DNP / Dr. Chela Love (bilingual clinical) · Vanntastic Solutions / Dr. J. Michelle Vann (youth/family)" },
      { label: "NAICS codes", value: "541512 Computer Systems Design · 541611 Management Consulting · 541712 Research & Development · 624190 Social Assistance · 611430 Professional Training" },
      { label: "Compliance posture", value: "Self-governing directive system · fidelity grading with evidence-URL verification · MAP-GAP CQI (1,705 lines) · Lean Six Sigma Green Belt methodology" },
    ],
    cta: "View Capabilities",
    ctaHref: "/contact",
  },
};

const keyNumbers = [
  { label: "Service Platforms", value: "15", detail: "TCAF-operated" },
  { label: "Funding Intelligence", value: "Live", detail: "AI fit-scored to partner profiles" },
  { label: "MCE Business Records", value: "656,794", detail: "Curated, AI-searchable" },
  { label: "DB Tables", value: "271", detail: "Production data model" },
  { label: "Languages", value: "107", detail: "89 spoken + 18 signed" },
  { label: "CFIR Constructs", value: "39", detail: "Operationalized in code" },
  { label: "Trade Sim Lessons", value: "75", detail: "5 trades × 15 lessons" },
  { label: "States Deployable", value: "50", detail: "+ DC coverage" },
];

const competitiveAdvantages = [
  { title: "Cradle-to-Contract Pipeline", desc: "No competitor has the integrated path from education through career readiness through business formation through government contracting. ThriveUp trains the person; MCE empowers the business they build.", icon: Rocket },
  { title: "Physics-Grade Trade Simulations", desc: "Five industry-standard simulation engines — MNA (electrical/automotive), Hardy-Cross Newton-Raphson (plumbing), AWS D1.1 heat-input evaluator (welding), thermal-airflow (HVAC). Not gamified exercises. Actual engineering solvers with 43 passing automated tests.", icon: Zap },
  { title: "Implementation Science in Code", desc: "39 CFIR 2.0 constructs and 5 domains operationalized in the Research Hub — not named in a slide, instantiated in production. NRRC and CFIR 2.0 fidelity benchmarks built into scoring rubrics.", icon: Microscope },
  { title: "Funding Intelligence Engine — AI Fit-Scored", desc: "Live grant intelligence across Grants.gov, USASpending, SAM.gov, and curated sources. Every opportunity tier-weighted and AI-scored against organizational capacity and community partner profiles — not a generic list.", icon: Target },
  { title: "107-Language Reach", desc: "89 spoken languages + 18 signed — dialect-preserving, not just machine-translated. Honors AAVE, Spanglish, and regional variants. RTL layout support. Built for the communities that need it most.", icon: Globe },
  { title: "Dual-Entity Strategy", desc: "TCAF 501(c)(3) (federal award-eligible, UEI KDDVD1FGLW35) + ISS LLC for-profit (UEI C7YDV3P8EHL7, CAGE 9VKK3). Flexible contracting, diversified revenue — grant, SaaS, and federal contract streams independent of each other.", icon: Shield },
  { title: "We Orchestrate AI — Not Just Use It", desc: "4-engine collaborative synthesis: Claude, GPT-4o-mini, Gemini, DeepSeek R1 — with automatic failover, mode-switching tutors (Socratic-hint vs ensemble-debrief), and 86 RAG chunks grounded in our own commitments, not the generic web.", icon: Brain },
  { title: "Justice & Reentry — Gold Standard", desc: "11 database tables: RNR (Risk-Need-Responsivity) assessments, CBI programs, recidivism baselines, family visitation tracking. The frameworks federal reviewers require — already running, not roadmapped.", icon: Scale },
];

function FunderLensSection() {
  const [active, setActive] = useState<FunderLensKey>("foundation");
  const lens = FUNDER_LENSES[active];
  const Icon = lens.icon;
  return (
    <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-bp-funder-lenses">
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Users className="mr-1 h-3 w-3" /> Who's Reading This?
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-funder-lens-heading">
            What You Need to Know — By Audience
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Select your role. We'll surface what's most relevant to your evaluation criteria — not the same pitch for everyone.
          </p>
        </div>
        <Tabs value={active} onValueChange={(v) => setActive(v as FunderLensKey)}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-muted/60 p-1 rounded-lg" data-testid="tabs-funder-lenses">
            {(Object.keys(FUNDER_LENSES) as FunderLensKey[]).map((key) => {
              const L = FUNDER_LENSES[key];
              const LIcon = L.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1.5 text-xs" data-testid={`tab-funder-${key}`}>
                  <LIcon className="h-3 w-3" />{L.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {(Object.keys(FUNDER_LENSES) as FunderLensKey[]).map((key) => {
            const l = FUNDER_LENSES[key];
            const LIcon = l.icon;
            return (
              <TabsContent key={key} value={key} data-testid={`panel-funder-${key}`}>
                <Card className="p-6 border-2 border-primary/15">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="rounded-md bg-primary/10 p-2.5 shrink-0">
                      <LIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{l.label} Lens</p>
                      <h3 className="font-bold text-lg leading-tight">{l.headline}</h3>
                    </div>
                  </div>
                  <div className="space-y-3 mb-5">
                    {l.points.map((pt) => (
                      <div key={pt.label} className="flex gap-3 py-2.5 border-b border-border/50 last:border-0">
                        <span className="text-xs font-semibold text-primary shrink-0 w-36 pt-0.5">{pt.label}</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">{pt.value}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={l.ctaHref}>
                    <Button size="sm" className="gap-2" data-testid={`button-funder-cta-${key}`}>
                      {l.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </section>
  );
}

export default function BusinessPlanPage() {
  return (
    <div className="min-h-screen">
      <div className="px-4 sm:px-6 pt-4">
        <SectionTutorial {...SECTION_TUTORIALS["business-plan"]} />
      </div>
      <section className="relative overflow-hidden py-14 px-4 sm:py-24 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950" />
        <div className="relative mx-auto max-w-5xl text-center">
          <Badge variant="secondary" className="mb-4 bg-white/15 text-white border-white/20 text-sm">
            The Collaborative Advocate Ecosystem
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight leading-tight" data-testid="text-bp-title">
            Business Plan
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto mb-2" data-testid="text-bp-subtitle">
            An integrated ecosystem that takes individuals from education through career readiness through business formation through government contracting.
          </p>
          <p className="text-sm text-white/50 max-w-xl mx-auto mb-8">
            The Collaborative Advocate Foundation 501(c)(3) &middot; VOSB
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="https://thrivingcommunitiesforall.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-violet-700 font-semibold min-h-[44px]" data-testid="button-bp-thriveup">
                <GraduationCap className="mr-2 h-5 w-5" /> ThriveUp Academy
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-white border-white/40 bg-white/10 min-h-[44px]" data-testid="button-bp-about">
                <Users className="mr-2 h-5 w-5" /> Leadership
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 min-h-[44px]" data-testid="button-bp-contact">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 px-4 sm:py-14 sm:px-6 bg-card" data-testid="section-bp-numbers">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
            {keyNumbers.map((n) => (
              <div key={n.label} className="py-2">
                <p className="text-2xl sm:text-3xl font-bold text-primary" data-testid={`text-bp-stat-${n.label.toLowerCase().replace(/\s+/g, '-')}`}>{n.value}</p>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-bp-mvv">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-mvv-heading">Mission & Vision</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <Target className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Mission</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{MISSION_STATEMENT}</p>
            </Card>
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Vision</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{VISION_STATEMENT}</p>
            </Card>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {VALUES.map((v) => {
              const iconMap: Record<string, typeof Heart> = { Heart, Microscope, Users, Globe, Shield, BarChart3, BookOpen };
              const Icon = iconMap[v.iconName] || Heart;
              return (
                <div key={v.title} className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{v.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-bp-ecosystem">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Layers className="mr-1 h-3 w-3" /> Three-Layer Ecosystem
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-ecosystem-heading">
              The Cradle-to-Contract Pipeline
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Three platforms forming an integrated vertical — from education through business formation through government contracting. No competitor has this.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {ecosystemPlatforms.map((p) => (
              <Card key={p.name} className="p-6 flex flex-col" data-testid={`card-bp-platform-${p.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`rounded-md p-2 bg-gradient-to-br ${p.gradient}`}>
                    <p.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{p.name}</p>
                    <Badge variant="secondary" className="text-xs">{p.entity}</Badge>
                  </div>
                </div>
                <p className="text-xs font-medium text-primary mb-1">{p.layer}</p>
                <p className="text-sm font-semibold mb-3">{p.role}</p>
                <ul className="space-y-1.5 flex-1">
                  {p.capabilities.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground"><span className="font-medium">Revenue:</span> {p.revenue}</p>
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="mt-2">
                    <Button variant="outline" size="sm" className="w-full text-xs" data-testid={`button-bp-visit-${p.name.toLowerCase().replace(/\s+/g, '-')}`}>
                      Visit Platform <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </a>
                )}
              </Card>
            ))}
          </div>

          <Card className="p-5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border-primary/20">
            <div className="flex items-center gap-3 mb-3">
              <Rocket className="h-5 w-5 text-primary" />
              <p className="font-bold text-sm">How It Works Together</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              {["Education", "Career Readiness", "Workforce Training", "Business Formation", "Certification", "Government Contracting", "Teaming", "Growth"].map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <Badge variant={i < 3 ? "default" : i < 6 ? "secondary" : "outline"} className="text-xs">{step}</Badge>
                  {i < 7 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              A veteran in ThriveUp's AI training pipeline graduates into MCE's business formation toolkit. A returning citizen in workforce development flows into certification and contracting.
            </p>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-bp-advantages">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Award className="mr-1 h-3 w-3" /> Why We Win
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-advantages-heading">
              Competitive Advantages
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitiveAdvantages.map((a) => (
              <Card key={a.title} className="p-5" data-testid={`card-bp-advantage-${a.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex items-start gap-3">
                  <div className="rounded-md bg-primary/10 p-2 shrink-0">
                    <a.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{a.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FunderLensSection />

      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-bp-funding">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <DollarSign className="mr-1 h-3 w-3" /> Revenue & Funding
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-funding-heading">
              Funding Strategy
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Diversified funding: grant money fuels community development while SaaS subscriptions drive the business platform. Multiple funding paths simultaneously.
            </p>
          </div>
          <div className="space-y-3">
            {fundingStreams.map((f, i) => (
              <Card key={i} className="p-4" data-testid={`card-bp-funding-${i}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{f.source}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {f.platforms.map((p) => (
                        <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-medium text-primary">{f.amount}</p>
                    <Badge variant={f.status === "Primary Target" ? "default" : f.status === "Revenue Stream" ? "secondary" : "outline"} className="text-xs">
                      {f.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-bp-thriveup-tools">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" /> ThriveUp Academy — The Tools That Do The Work
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-tools-heading">
              Platform Capabilities
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Every tool interconnected. Wizards guide you through. Data flows between every section.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: "Grant Discovery Engine", desc: "AI-powered SAM.gov integration with alignment scoring, narrative builder, and logic model generator", link: "/grants", icon: Target },
              { title: "Healthcare Grant Research", desc: "AI-powered healthcare equity grant discovery — SAMHSA, HRSA, CDC, NIH and foundation funding streams with alignment scoring", link: "/healthcare-grants", icon: Heart },
              { title: "Coalition Management", desc: "Community coalition tracking with meeting management, action items, and cross-platform navigation", link: "/coalition", icon: Users },
              { title: "Prevention & Curriculum", desc: "Evidence-based prevention programs with SAMHSA/NIDA registry, fidelity tracking, environmental strategies, and parent education", link: "/prevention", icon: Shield },
              { title: "Facilitator Hub", desc: "AI-assisted session planning, delivery logging with fidelity scoring, dosage tracking, and certification management", link: "/facilitator-hub", icon: BookOpen },
              { title: "Community Intelligence", desc: "GIS-powered maps layering CDC, Census, SAMHSA, FBI, USDA data — community profiles for any zip code in the nation", link: "/community-map", icon: MapPin },
              { title: "Case Management", desc: "Intake wizard (11 steps), reentry plans, milestone tracking, service delivery, and DOJ-aligned outcome reporting", link: "/reentry", icon: Scale },
              { title: "AI Creation Studio", desc: "10 professional-grade AI tools for presentations, resumes, business plans, and portfolios with streaming generation", link: "/ai-tools", icon: Brain },
              { title: "Post-Award Management", desc: "7-tab suite: staffing, facilities, scheduling, compliance calendar, in-kind match tracking, sustainability planning", link: "/program-management", icon: Briefcase },
              { title: "Workforce Pipeline", desc: "Career assessment through training, credential attainment, job placement, and retention tracking at 30/90/180/365 days", link: "/academy/careers", icon: TrendingUp },
              { title: "Partner Ecosystem", desc: "Community partner directory, MOU tracking, referral workflows, and justice system integration API", link: "/partners", icon: HandshakeIcon },
            ].map((tool) => (
              <Link key={tool.title} href={tool.link}>
                <Card className="p-5 hover-elevate cursor-pointer h-full" data-testid={`card-bp-tool-${tool.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2 shrink-0">
                      <tool.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-1">{tool.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6 bg-card" data-testid="section-bp-leadership">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" data-testid="text-bp-leadership-heading">Leadership</h2>
          </div>
          <Card className="p-6 mb-4">
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="grid grid-cols-2 gap-3 shrink-0">
                <div className="overflow-hidden rounded-lg shadow-md">
                  <img src={terryMilitaryPhoto} alt="Dr. Terry Flood in U.S. Army dress uniform" className="w-28 h-36 object-cover object-top" />
                </div>
                <div className="overflow-hidden rounded-lg shadow-md">
                  <img src={terryPhoto} alt="Dr. Terry Flood" className="w-28 h-36 object-cover object-top" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">Dr. Terry Flood, DHA</p>
                <p className="text-sm text-muted-foreground mb-1">President, TCAF · Implementation Scientist · Veteran · Platform Architect</p>
                <Badge variant="outline" className="text-xs mb-3">terryflood@thrivingcommunitiesforall.com</Badge>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["DHA", "DBA", "MS Implementation Science (Dartmouth)", "MBA", "MS I-O Psychology", "MS Criminal Justice", "MS HRM"].map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> U.S. Army CW2 (Ret.) &middot; 20 years active service</span>
                  <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Bronze Star Medal (×2)</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> VA · DoD · Federal Service · Active Secret Clearance</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Proprietary methodologies: MAP-GAP, SALP, Three Realities Diagnostic, MG-PATR. Lean Six Sigma Green Belt. DAU grants and acquisitions trained. Five simultaneous lenses: implementation scientist + psychologist + data engineer + CHW + UX designer. Research focus: healthcare workforce development, SDOH, public health interventions, competency-based education.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/about">
                    <Button variant="outline" size="sm" data-testid="button-bp-full-credentials">Full Credentials</Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="sm" data-testid="button-bp-contact-leader">Contact</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          {/* Organizational Continuity — addresses key-person risk proactively */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="section-bp-continuity">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <HandshakeIcon className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Teaming Roster</p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Per-proposal team selection by lane fit. No standing assumptions.</p>
              <div className="space-y-3">
                {[
                  { name: "Eric Hargrave", org: "Hargrave Innovative Solutions (HIS)", role: "Federal compliance, SBIR, acquisitions", email: "ericd@hisolution.org" },
                  { name: "Dr. Chela Love, DNP", org: "Love Clinic MedSpa", role: "Bilingual clinical capacity, health equity delivery", email: "Wichita, KS" },
                  { name: "Dr. J. Michelle Vann", org: "Vanntastic Solutions", role: "Youth & family services, attendance tracking (Iasis/Sistahs)", email: "jmichellevann.com" },
                ].map((p) => (
                  <div key={p.name} className="flex items-start gap-2 pb-2 border-b border-border/40 last:border-0">
                    <Users className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">{p.name} <span className="font-normal text-muted-foreground">— {p.org}</span></p>
                      <p className="text-[11px] text-muted-foreground">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Network className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Organizational Resilience</p>
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Dual-entity structure", value: "TCAF 501(c)(3) and ISS LLC operate independently — grant stream, SaaS stream, and federal contract stream are not co-dependent." },
                  { label: "26-platform parallel design", value: "Each platform is self-sufficient. If the hub goes offline, every platform keeps serving its users. No single point of failure in service delivery." },
                  { label: "Self-governing compliance", value: "Directive system, fidelity grading, and MAP-GAP CQI operate without Dr. Flood's direct involvement — governance is embedded in architecture, not vested in a person." },
                  { label: "Documented methodologies", value: "MAP-GAP, SALP, Three Realities Diagnostic, MG-PATR are documented and transferable — not tacit knowledge held by one person." },
                ].map((r) => (
                  <div key={r.label} className="text-xs pb-2 border-b border-border/40 last:border-0">
                    <p className="font-semibold text-foreground mb-0.5">{r.label}</p>
                    <p className="text-muted-foreground leading-relaxed">{r.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:py-20 sm:px-6" data-testid="section-bp-cta">
        <div className="mx-auto max-w-5xl text-center">
          <Card className="p-8 sm:p-12 bg-gradient-to-br from-violet-600 to-indigo-700 border-none text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3" data-testid="text-bp-cta-heading">Ready to Partner?</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-6 text-sm sm:text-base">
              Whether you're a funder, community organization, employer, school, or government agency — we're ready to demonstrate how this ecosystem creates measurable impact in your community.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-violet-700 font-semibold min-h-[44px]" data-testid="button-bp-cta-contact">
                  Schedule a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="https://thrivingcommunitiesforall.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-white border-white/40 bg-white/10 min-h-[44px]" data-testid="button-bp-cta-explore">
                  Explore ThriveUp Academy
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Link href="/ecosystem-story">
                <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 min-h-[44px]" data-testid="button-bp-cta-story">
                  See the Ecosystem in Action
                </Button>
              </Link>
            </div>
          </Card>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-muted-foreground">
            <span>president@thecollaborativeadvocate.org</span>
            <span>&middot;</span>
            <span>The Collaborative Advocate Foundation 501(c)(3)</span>
            <span>&middot;</span>
            <span>Veteran-Owned Small Business (VOSB)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
