import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  GraduationCap, Building2, Globe, Heart, Users, Target, Sparkles,
  ArrowRight, DollarSign, Shield, BarChart3, Briefcase, TrendingUp,
  BookOpen, Award, Zap, CheckCircle2, ExternalLink, Layers,
  Rocket, MapPin, Brain, Scale, Microscope, HandshakeIcon,
} from "lucide-react";
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
      "DFC coalition management & prevention",
      "Case management & reentry support",
      "Community intelligence mapping (GIS)",
      "Facilitator hub & curriculum delivery",
      "Post-award program management",
      "Bilingual (EN/ES) with crisis support",
    ],
    revenue: "Grant-funded (DFC, DOL, DOE, SBA, DOJ)",
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
    role: "Connects It All",
    layer: "Umbrella / Advocacy",
    entity: "VOSB Organization",
    url: "",
    gradient: "from-amber-600 to-orange-700",
    icon: Globe,
    capabilities: [
      "Organizational web presence",
      "Advocacy & community voice",
      "Strategic coordination hub",
      "14-platform ecosystem narrative",
      "Partnership development",
      "Grant alignment & compliance story",
    ],
    revenue: "Consulting, federal contracts, implementation science services",
  },
];

const fundingStreams = [
  { source: "CDC/ONDCP Drug-Free Communities", amount: "$625K over 5 years", status: "Primary Target", deadline: "April 14, 2026", platforms: ["ThriveUp Academy"] },
  { source: "DOL Workforce Innovation (WIOA)", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["ThriveUp Academy"] },
  { source: "DOE Education Grants", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["ThriveUp Academy"] },
  { source: "SBA SBIR/STTR", amount: "Up to $2M", status: "Eligible", deadline: "Rolling", platforms: ["ThriveUp Academy", "MCE"] },
  { source: "DOC MBDA Grants", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["MCE"] },
  { source: "SBA Community Advantage", amount: "Varies", status: "Eligible", deadline: "Ongoing", platforms: ["ThriveUp Academy", "MCE"] },
  { source: "DOJ/OJJDP Prevention", amount: "Varies", status: "Aligned", deadline: "Ongoing", platforms: ["ThriveUp Academy"] },
  { source: "MCE SaaS Subscriptions", amount: "$49-$349+/mo per user", status: "Revenue Stream", deadline: "Ongoing", platforms: ["MCE"] },
  { source: "APEX Accelerator Partnerships", amount: "Contract-based", status: "Pipeline", deadline: "Ongoing", platforms: ["MCE"] },
];

const keyNumbers = [
  { label: "Platforms", value: "14", detail: "Integrated ecosystem" },
  { label: "MCE Records", value: "656,794", detail: "Curated business data" },
  { label: "AI Tools", value: "24+", detail: "Across all platforms" },
  { label: "Career Pathways", value: "50+", detail: "4+ industries" },
  { label: "DFC Grant Target", value: "$625K", detail: "5-year award" },
  { label: "MCE Valuation", value: "$3.5-5M", detail: "SaaS platform" },
  { label: "States Deployable", value: "50", detail: "+ DC coverage" },
  { label: "Languages", value: "2", detail: "English & Spanish" },
];

const competitiveAdvantages = [
  { title: "Cradle-to-Contract Pipeline", desc: "No competitor has the integrated path from education through career readiness through business formation through government contracting. ThriveUp trains the person; MCE empowers the business they build.", icon: Rocket },
  { title: "Dual Revenue Model", desc: "ThriveUp is grant-funded (nonprofit) while MCE is subscription-funded (SaaS). Diversified revenue — neither depends entirely on the other.", icon: DollarSign },
  { title: "Shared Data Moat", desc: "ThriveUp's community data (employment gaps, health indicators, service availability) combined with MCE's 656,794 business records creates a uniquely powerful dataset for grant applications and impact reporting.", icon: Layers },
  { title: "VOSB Status", desc: "Veteran-Owned Small Business certification provides competitive advantage for federal contracting and grant applications across both platforms.", icon: Shield },
  { title: "Implementation Science", desc: "Founded by an Implementation Scientist with DHA + DBA + Dartmouth MS. Proprietary methodologies (MAP-GAP, SALP, Three Realities, MG-PATR) differentiate from competitors.", icon: Microscope },
  { title: "Grant-Ready Infrastructure", desc: "ThriveUp is explicitly built to meet federal grant criteria — WIOA, DOJ, DOL, OJJDP, HHS — with transparent reporting, outcome tracking, and compliance tools already in place.", icon: Target },
];

export default function BusinessPlanPage() {
  return (
    <div className="min-h-screen">
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
              { title: "DFC Command Center", desc: "Unified dashboard aggregating coalition, prevention, community engagement, and grant readiness across 20+ data sources", link: "/dfc-command-center", icon: BarChart3 },
              { title: "DFC Guided Wizards", desc: "4 step-by-step wizards: Coalition Setup (7 steps), Prevention Launch (8), Grant Application (10), Community Assessment (6)", link: "/dfc-wizards", icon: Sparkles },
              { title: "Coalition Management", desc: "12-sector ONDCP-aligned coalition tracking with meeting management, action items, and DFCCrossNav linking all DFC tools", link: "/coalition", icon: Users },
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
          <Card className="p-6">
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
                <p className="text-sm text-muted-foreground mb-3">Implementation Scientist | Veteran | Platform Architect</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["DHA", "DBA", "MS Implementation Science (Dartmouth)", "MBA", "MS I-O Psychology", "MS Criminal Justice", "MS HRM"].map((d) => (
                    <Badge key={d} variant="secondary" className="text-xs">{d}</Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> U.S. Army CW2 (Ret.) &middot; 20 years</span>
                  <span className="flex items-center gap-1"><Award className="h-3 w-3" /> Bronze Star Medal (x2)</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> VA &middot; DoD &middot; Federal Service</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Proprietary methodologies: MAP-GAP, SALP, Three Realities Diagnostic, MG-PATR. Lean Six Sigma Green Belt. DAU grants and acquisitions trained. Research focus: healthcare workforce development, SDOH, public health interventions, competency-based education.
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
            <span>mr.terryflood@gmail.com</span>
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
