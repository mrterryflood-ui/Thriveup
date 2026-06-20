import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Users, Heart, Lightbulb, TrendingUp, MapPin, HandHeart,
  Building2, ArrowRight, CheckCircle2, Layers, Repeat,
  GitMerge, Mic, BarChart3, BookOpen, Sparkles, Globe, Target,
  Baby, Compass, GraduationCap, Shield, Briefcase,
  RefreshCw, ChevronDown, Activity,
} from "lucide-react";

const FIVE_W = [
  {
    w: "WHO",
    color: "violet" as const,
    icon: Users,
    headline: "The backbone your mission needs",
    body: "We are The Collaborative Advocate Foundation — a 501(c)(3) public charity. We are the nonprofit for nonprofits, residents, and communities to thrive. We bring the tools, data, and funding knowledge. You bring community, trust, and mission. We are not a competitor — we are infrastructure that amplifies what you already do. We are stronger together.",
  },
  {
    w: "WHAT",
    color: "blue" as const,
    icon: RefreshCw,
    headline: "The full cycle — not just the assessment",
    body: "Research → Planning → Preparation → Execution → Continuous Assessment → Implementation. Then Scale Up (more depth — reaching more people where you are) and Scale Out (more breadth — replicating what works to new communities). Most organizations stop at the needs assessment. We don't stop there.",
  },
  {
    w: "WHERE",
    color: "emerald" as const,
    icon: MapPin,
    headline: "Local first. Built for everywhere.",
    body: "All issues are local — that's why IGN matters. Every tool we build works at the neighborhood level — any U.S. county, any community context. Our live pilot is Central Texas: Travis, Williamson, Hays, Bastrop, and Caldwell counties. The Hub Adoption Kit makes it replicable anywhere in the country.",
  },
  {
    w: "WHEN",
    color: "amber" as const,
    icon: Activity,
    headline: "Right now. Actively running.",
    body: "15 platforms live. 107 languages supported. A funding intelligence engine aligning opportunities to the community partners we serve. Programs running in Central Texas today. This is not a roadmap or a vision — it is a running system built through intentional collaboration with the communities it serves.",
  },
  {
    w: "WHY",
    color: "rose" as const,
    icon: Heart,
    headline: "Plans made for people — without them — don't work",
    body: "Coordination, communication, understanding, integration, empathy, and perspectives are not soft values — they are the infrastructure of lasting change. We deliver and prove impact so advocacy and passion turn into sustainable, meaningful solutions. We plan with people, not for them.",
  },
  {
    w: "HOW",
    color: "slate" as const,
    icon: Compass,
    headline: "IGN — Initial Guidance and Navigation",
    body: "IGN is a psychology framework: we meet each person and organization at their level of readiness and comfort, guide at their pace, and use data and evidence-based tools to stay on course — redirecting when needed. We give you the tools and teach you how to use them. We can assist or be assisted depending on what the situation calls for.",
  },
];

const STAKEHOLDERS = [
  {
    title: "Residents & Families",
    icon: Heart,
    color: "rose" as const,
    why: "You get tools, benefits navigation, and someone who meets you where you are — in your language, at your pace, at your level of readiness. We help you find what you qualify for, understand what it means, and access it without having to fight every system alone.",
    tools: ["Benefits Screener (9+ programs)", "AI Navigator", "LifeBridge Resource Hub", "Talk Your Talk (107 languages)", "Community Voice"],
  },
  {
    title: "Nonprofits & Community Orgs",
    icon: Building2,
    color: "violet" as const,
    why: "We are not here to compete with you or replace you. We are the backbone that makes your mission more possible — bringing infrastructure, capacity, data, and funding knowledge. You bring the community relationships and the mission. We amplify what you already do. All issues are local and your relationships are the asset — we give you the tools to prove it.",
    tools: ["Coalition Dashboard", "Grant Command Center", "Logic Model Builder", "Program Designer", "Outcome Tracking", "RPLICE Evaluation Engine"],
  },
  {
    title: "Funders & Grant Reviewers",
    icon: BarChart3,
    color: "blue" as const,
    why: "We turn data into evidence, evidence into impact, and impact into verifiable, transparent outcomes you can report with confidence. We go far beyond needs assessments to show implementation fidelity, measurable outcomes, and sustainability — not just intent. Every number is verifiable. Every claim cites a primary source.",
    tools: ["SDOH Explorer", "Impact Dashboard", "Compliance Matrix", "Research Hub (RE-AIM/CFIR)", "Open Science Evidence Vault", "Proposal Compliance Checker"],
  },
  {
    title: "Policymakers & Stakeholders",
    icon: Globe,
    color: "emerald" as const,
    why: "We bring you community-level data and authentic community voice. Not assumptions — evidence. Not advocacy without data — advocacy backed by implementation science, real outcomes, and community-validated research. Because all issues are local, we help you make decisions that actually work at the neighborhood level, not just on paper.",
    tools: ["Corridor Intelligence", "Benefits Intelligence System (5-county)", "Regional Briefings", "Ecosystem Story", "Coalition Impact Reports"],
  },
];

const COLLABORATION_STEPS = [
  {
    step: "01",
    title: "Listen before you build",
    framework: "Human-Centered Codesign",
    color: "sky" as const,
    description:
      "Every surface starts with the community. Not research subjects — designers. Grandmothers who are the childcare system. Formerly incarcerated workers who know what re-entry actually costs. Promotoras who have been navigating benefits for a decade without a title. They tell us what matters. We build what they describe.",
    platformFeatures: [
      "Community Voice projects — anyone can contribute, nothing required",
      "Integration Invitation — informal caregivers named first, not discovered last",
      "N. Wilco Childcare Voice — semiconductor corridor families shape the design",
      "8 layered consents, all default OFF — community controls what we do with what they share",
    ],
    icon: Mic,
  },
  {
    step: "02",
    title: "Share power, not just data",
    framework: "Liberatory Design",
    color: "rose" as const,
    description:
      "Liberatory design asks: who benefits from this system, and who holds power within it? The platform is designed so that the communities most impacted by systems failure are not passive recipients of services — they are advocates, co-designers, stipend earners, credential holders, and named contributors.",
    platformFeatures: [
      "Shadow worker credentialing — informal caregivers can formalize on their own terms",
      "Stipend pathways are real, not aspirational — connected to HHSC CPP infrastructure",
      "Witness loop — every contribution is logged and attributable to the contributor",
      "No PII echo — AI never repeats personal information back without explicit consent",
      "No funder citation without shareWithFunder=true — communities control grant attribution",
    ],
    icon: Heart,
  },
  {
    step: "03",
    title: "No single organization can close a gap alone",
    framework: "Collective Impact",
    color: "violet" as const,
    description:
      "The Collaborative Advocate Foundation is named for this: advocacy done together is the only advocacy that lasts. TCAF is the backbone. The platform is the shared infrastructure every coalition partner uses — not a separate tool for each org, but one system that makes everyone's contribution visible.",
    platformFeatures: [
      "Coalition dashboards — every partner sees the same evidence in real time",
      "WAB2-model collective impact framework for childcare, benefits, reentry, and workforce",
      "United Way of Greater Austin × TCAF × Williamson County — active coalition",
      "Shared CHW deployment — one backbone, many access points (libraries, campuses, banks, churches)",
      "Benefits Intelligence System — 5-county shared data, no org silos",
    ],
    icon: GitMerge,
  },
  {
    step: "04",
    title: "People learn by building together",
    framework: "Constructivist Philosophy",
    color: "amber" as const,
    description:
      "Knowledge is not transferred — it is constructed. A CHW who navigates a family through SNAP enrollment doesn't just deliver a service; they build knowledge with that family about how the system works, what it owes them, and how to use it again. Trade simulations, peer mentorship, and navigator training are all built on the same principle: you learn by doing, with someone beside you.",
    platformFeatures: [
      "Trade Sims — learn skilled trades through simulation, not just instruction",
      "Mentorship Directory — peer-to-peer construction of career knowledge",
      "CHW as trusted messenger — knowledge built through relationship, not transaction",
      "Logic Model builder — coalitions construct their theory of change together",
      "Platform as shared evidence chain — knowledge built collectively and verifiably",
    ],
    icon: BookOpen,
  },
];

const COLLABORATION_SPINE = [
  { phase: "Discover", who: "Community members + CHWs + shadow workers", tool: "Voice projects · Integration Invitation", icon: Mic },
  { phase: "Understand", who: "TCAF data team + coalition partners", tool: "Benefits Intelligence · Corridor Intelligence · Census + CDC PLACES", icon: BarChart3 },
  { phase: "Design", who: "Community members + TCAF + funders", tool: "Program Designer · Logic Model · Co-design sessions", icon: Lightbulb },
  { phase: "Build", who: "TCAF backbone + every coalition partner", tool: "CHW deployment · Partner workspace · Screener", icon: Building2 },
  { phase: "Measure", who: "All stakeholders — including community", tool: "CFIR/RE-AIM evaluation · Outcome Dashboard · Coalition reports", icon: TrendingUp },
  { phase: "Advocate", who: "Community + TCAF + partners → funders", tool: "Grant Command Center · Evidence vault · Coalition dashboards", icon: Globe },
];

type ColorKey = "violet" | "blue" | "emerald" | "amber" | "rose" | "slate" | "sky";

const colorMap: Record<ColorKey, { bg: string; border: string; badge: string; text: string; dot: string }> = {
  violet: { bg: "bg-violet-50 dark:bg-violet-950/20", border: "border-violet-300 dark:border-violet-700", badge: "bg-violet-700 text-white", text: "text-violet-800 dark:text-violet-300", dot: "bg-violet-500" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-950/20",     border: "border-blue-300 dark:border-blue-700",     badge: "bg-blue-700 text-white",   text: "text-blue-800 dark:text-blue-300",   dot: "bg-blue-500" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-950/20", border: "border-emerald-300 dark:border-emerald-700", badge: "bg-emerald-700 text-white", text: "text-emerald-800 dark:text-emerald-300", dot: "bg-emerald-500" },
  amber:  { bg: "bg-amber-50 dark:bg-amber-950/20",   border: "border-amber-300 dark:border-amber-700",   badge: "bg-amber-700 text-white",  text: "text-amber-800 dark:text-amber-300",  dot: "bg-amber-500" },
  rose:   { bg: "bg-rose-50 dark:bg-rose-950/20",     border: "border-rose-300 dark:border-rose-700",     badge: "bg-rose-700 text-white",   text: "text-rose-800 dark:text-rose-300",   dot: "bg-rose-500" },
  slate:  { bg: "bg-slate-50 dark:bg-slate-950/20",   border: "border-slate-300 dark:border-slate-700",   badge: "bg-slate-700 text-white",  text: "text-slate-800 dark:text-slate-300",  dot: "bg-slate-500" },
  sky:    { bg: "bg-sky-50 dark:bg-sky-950/20",       border: "border-sky-200 dark:border-sky-800",       badge: "bg-sky-700 text-white",    text: "text-sky-800 dark:text-sky-300",     dot: "bg-sky-500" },
};

export default function OurApproachPage() {
  const [stakeholderOpen, setStakeholderOpen] = useState<string | null>(null);
  const [philosophyOpen, setPhilosophyOpen] = useState(false);
  const [frameworkOpen, setFrameworkOpen] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-12" data-testid="page-our-approach">

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <header className="space-y-5 text-center py-4" data-testid="section-hero">
        <div className="flex items-center gap-2 justify-center flex-wrap">
          <Badge className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
            The Collaborative Advocate Foundation
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Our Approach
          </Badge>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight" data-testid="text-page-title">
          We are stronger together.
        </h1>

        <p className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto italic">
          "No one cares how much you know until they know how much you care."
        </p>

        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We deliver and prove impact so advocacy and passion turn into sustainable, meaningful solutions —
          for residents, nonprofits, funders, and the policymakers who shape the systems they all depend on.
        </p>

        <div className="flex gap-3 flex-wrap justify-center pt-1">
          <Button size="sm" asChild data-testid="link-i-need-help">
            <Link href="/benefits-screener">
              <Heart className="h-3.5 w-3.5 mr-1" /> I need help
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild data-testid="link-partner">
            <Link href="/coalition">
              <Building2 className="h-3.5 w-3.5 mr-1" /> My organization wants to partner
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild data-testid="link-funder">
            <Link href="/grants">
              <BarChart3 className="h-3.5 w-3.5 mr-1" /> I'm a funder or reviewer
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild data-testid="link-policymaker">
            <Link href="/corridor-intelligence">
              <Globe className="h-3.5 w-3.5 mr-1" /> I'm a policymaker
            </Link>
          </Button>
        </div>
      </header>

      <Separator />

      {/* ── 5W GRID ────────────────────────────────────────────────────────── */}
      <section data-testid="section-five-w">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Who, What, Where, When, Why — and How</h2>
          <p className="text-sm text-muted-foreground mt-1">Each answered directly. Then collectively.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIVE_W.map((item) => {
            const c = colorMap[item.color];
            const Icon = item.icon;
            return (
              <div
                key={item.w}
                className={`rounded-xl border-2 ${c.border} ${c.bg} p-5 space-y-2`}
                data-testid={`card-w-${item.w.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <Badge className={`text-[10px] font-bold tracking-wider ${c.badge}`}>{item.w}</Badge>
                  <Icon className={`h-4 w-4 ${c.text}`} />
                </div>
                <h3 className={`font-bold text-sm leading-snug ${c.text}`}>{item.headline}</h3>
                <p className="text-sm text-foreground leading-relaxed">{item.body}</p>
              </div>
            );
          })}
        </div>

        {/* Collective summary */}
        <div className="mt-5 rounded-xl border-2 border-primary/30 bg-primary/5 p-5" data-testid="card-w-collective">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm mb-1.5">All together — what TCAF is</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We are the infrastructure communities need to thrive. We bring tools, data, and funding knowledge —
                and guide every person and organization to use them at their own pace and level of readiness.
                We connect residents to resources. We equip nonprofits with capacity they couldn't build alone.
                We give funders verifiable, transparent impact. We give policymakers community-grounded evidence.
                All issues are local. All solutions are collaborative. We are stronger together.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── STAKEHOLDER SECTION ─────────────────────────────────────────────── */}
      <section data-testid="section-stakeholders">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">What this means for you</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Four stakeholders. Four answers. One connected mission.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {STAKEHOLDERS.map((s) => {
            const c = colorMap[s.color];
            const Icon = s.icon;
            const isOpen = stakeholderOpen === s.title;
            return (
              <div
                key={s.title}
                className={`rounded-xl border-2 ${c.border} overflow-hidden transition-all ${isOpen ? c.bg : "bg-background"}`}
                data-testid={`card-stakeholder-${s.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <button
                  className="w-full text-left p-4 flex items-center justify-between gap-3"
                  onClick={() => setStakeholderOpen(isOpen ? null : s.title)}
                  data-testid={`toggle-stakeholder-${s.title.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-md p-2 border ${c.border} ${isOpen ? "bg-white dark:bg-black/20" : "bg-muted"}`}>
                      <Icon className={`h-4 w-4 ${c.text}`} />
                    </div>
                    <span className={`font-bold text-sm ${isOpen ? c.text : ""}`}>{s.title}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 space-y-3 border-t border-inherit pt-3 animate-in fade-in duration-200">
                    <p className="text-sm leading-relaxed">{s.why}</p>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tools available to you</div>
                      <div className="flex flex-wrap gap-1.5">
                        {s.tools.map(t => (
                          <Badge key={t} variant="outline" className={`text-xs ${c.text} border-current`}>{t}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* ── IGN — HOW WE WORK ───────────────────────────────────────────────── */}
      <section className="space-y-5" data-testid="section-ign">
        <div className="flex items-start gap-3">
          <Compass className="h-5 w-5 text-primary shrink-0 mt-1" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold">How we work: IGN</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>IGN — Initial Guidance and Navigation</strong> — is a psychology framework that describes how we engage every person and organization. We meet you at your level of readiness and comfort. We guide at your pace. We use data and evidence-based interventions to help you stay on course and redirect when you drift. All issues are local, so every pathway is tailored to your specific community and context.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: "01", label: "Meet you where you are", desc: "Your pace. Your language. Your readiness. No prerequisites." },
            { step: "02", label: "Guide with data", desc: "Evidence-based interventions, primary sources — not assumptions or opinions." },
            { step: "03", label: "Build with you", desc: "Plan with people, not for them. You execute — we equip and sustain." },
            { step: "04", label: "Measure and redirect", desc: "Continuous assessment. Metrics catch drift early and prove impact over time." },
          ].map(item => (
            <div key={item.step} className="rounded-lg border p-3 space-y-1" data-testid={`card-ign-step-${item.step}`}>
              <div className="text-xs font-bold text-muted-foreground">{item.step}</div>
              <div className="font-semibold text-xs leading-snug">{item.label}</div>
              <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3" data-testid="card-rplice">
          <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-amber-800 dark:text-amber-300 mb-1">
              RPLICE + platform APIs make IGN real
            </div>
            <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
              RPLICE is our implementation science engine — it draws on behavioral science, social work, CHW engagement, HR and policy knowledge, data engineering, and community development expertise simultaneously so every person and organization is addressed uniquely, not generically. Data becomes information. Information meets people where they are. That is how communities thrive.
            </p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── PHILOSOPHY — collapsible ────────────────────────────────────────── */}
      <section data-testid="section-philosophy">
        <button
          className="w-full text-left flex items-center justify-between gap-3 py-2 group"
          onClick={() => setPhilosophyOpen(!philosophyOpen)}
          data-testid="toggle-philosophy"
        >
          <div className="flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-slate-600" />
            <div>
              <h2 className="text-xl font-bold group-hover:text-primary transition-colors">The philosophy behind the approach</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Human-Centered Codesign · Liberatory Design · Collective Impact · Constructivism</p>
            </div>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${philosophyOpen ? "rotate-180" : ""}`} />
        </button>

        {philosophyOpen && (
          <div className="space-y-8 mt-6 animate-in fade-in slide-in-from-top-2 duration-300">

            {/* Community voice callout */}
            <div className="rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-6 space-y-3">
              <div className="flex items-start gap-3">
                <Mic className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-rose-800 dark:text-rose-300">
                    Community voice is the source — not the input.
                  </h3>
                  <p className="text-sm text-rose-800 dark:text-rose-300 max-w-3xl leading-relaxed">
                    Before any census data is pulled, before any grant is written, before any CHW is deployed —
                    the people living closest to the gap have already described it. They have names for it.
                    They have solutions for it. They are often already running those solutions without a title or a budget.
                    The platform listens to them first, and builds outward from what they say.
                  </p>
                  <p className="text-sm text-rose-800 dark:text-rose-300 max-w-3xl leading-relaxed">
                    This is not consultation. It is not community engagement as a checkbox. It is <strong>co-authorship</strong>.
                  </p>
                  <div className="flex gap-3 flex-wrap pt-1">
                    <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white" asChild data-testid="button-voice-source">
                      <Link href="/voice"><Mic className="h-3.5 w-3.5 mr-1" /> Community Voice projects</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="border-rose-400 text-rose-800 dark:text-rose-300" asChild data-testid="button-voice-north-wilco">
                      <Link href="/voice/north-wilco-childcare-gaps"><Heart className="h-3.5 w-3.5 mr-1" /> N. Wilco Childcare Gaps</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Collaboration spine */}
            <div data-testid="section-collaboration-spine">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-600" />
                  Collaboration at every step
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  The platform facilitates collaboration across all six phases — community and coalition together, not separately.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {COLLABORATION_SPINE.map((phase, i) => {
                  const Icon = phase.icon;
                  return (
                    <div key={phase.phase} className="rounded-xl border p-4 space-y-2" data-testid={`card-phase-${phase.phase.toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">0{i + 1}</span>
                        <Icon className="h-4 w-4 text-violet-600" />
                        <span className="font-semibold text-sm">{phase.phase}</span>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">{phase.who}</div>
                      <div className="text-xs border-l-2 border-violet-300 pl-2 text-violet-800 dark:text-violet-300">{phase.tool}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                <Repeat className="h-3.5 w-3.5" />
                <span>Each phase feeds back into the next — the loop never closes, it deepens.</span>
              </div>
            </div>

            {/* Four frameworks */}
            <div data-testid="section-four-frameworks">
              <div className="mb-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <GitMerge className="h-5 w-5 text-slate-600" />
                  Four frameworks. One philosophy.
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Human-centered codesign, liberatory design, collective impact, and constructivism are not a menu to choose from.
                  Held together, they describe what it means to build with — not for — the communities that need these systems most.
                </p>
              </div>
              <div className="space-y-3">
                {COLLABORATION_STEPS.map((item) => {
                  const c = colorMap[item.color];
                  const Icon = item.icon;
                  const isOpen = frameworkOpen === item.framework;
                  return (
                    <div
                      key={item.framework}
                      className={`rounded-xl border-2 ${c.border} ${isOpen ? c.bg : "bg-background"} overflow-hidden transition-all`}
                      data-testid={`card-framework-${item.framework.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <button
                        className="w-full text-left p-4 flex items-center justify-between gap-3"
                        onClick={() => setFrameworkOpen(isOpen ? null : item.framework)}
                        data-testid={`toggle-framework-${item.step}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground shrink-0">{item.step}</span>
                          <Icon className={`h-5 w-5 ${c.text} shrink-0`} />
                          <div>
                            <div className={`font-bold text-sm leading-snug ${c.text}`}>{item.title}</div>
                            <Badge className={`mt-0.5 text-[10px] ${c.badge}`}>{item.framework}</Badge>
                          </div>
                        </div>
                        <ArrowRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-5 space-y-4 border-t border-inherit pt-4">
                          <p className="text-sm text-foreground leading-relaxed">{item.description}</p>
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                              How this lives in the platform
                            </div>
                            <ul className="space-y-1.5">
                              {item.platformFeatures.map((f) => (
                                <li key={f} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${c.text}`} />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Five-lens practitioner */}
            <Card className="border-slate-200 dark:border-slate-700" data-testid="card-five-lens">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  What holds it all together: the multi-disciplinary practitioner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  These frameworks only work when the people building the platform hold all lenses simultaneously — none sacrificed for another:
                </p>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {[
                    { lens: "Implementation Scientist", desc: "CFIR · RE-AIM · EPIS · fidelity · scalability · clearinghouse-grade evaluation", icon: Target },
                    { lens: "Psychologist / Neuroscientist", desc: "Trauma-informed design · regulation skills front-loaded · no shame architecture · developmental science", icon: Heart },
                    { lens: "Data Engineer", desc: "Primary-source verifiable · FHIR/CDS-Hooks interoperable · 0-PHI-egress · witness-logged · auditable", icon: BarChart3 },
                    { lens: "Community Health Worker", desc: "Trusted-messenger model · dialect-honoring · stipended shadow workers · peer-mentor + promotora + neighbor + faith leader pathways", icon: HandHeart },
                    { lens: "UX / User-Centered Designer", desc: "Parent · clinician · evaluator · funder each have a coherent surface · consent default OFF · friction calibrated", icon: Lightbulb },
                    { lens: "Collaborative Advocate", desc: "The sixth lens — not listed separately because it IS the foundation. Every other lens is expressed through collaboration or it doesn't count.", icon: Users },
                  ].map(({ lens, desc, icon: Icon }) => (
                    <div key={lens} className="rounded-lg border p-3 flex items-start gap-2">
                      <Icon className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-semibold text-xs">{lens}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Honest acknowledgment */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20" data-testid="card-honest-gap">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="font-semibold text-sm text-amber-800 dark:text-amber-300">Honest about where we are</div>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      The platform has the <em>architecture</em> of liberatory codesign — the voice infrastructure, the consent layers,
                      the shadow-worker recognition, the collaboration surfaces. The formal co-design <em>process</em> is active in the field
                      but not yet fully documented here. That work is happening. This page will reflect it as it does.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      <Separator />

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-muted-foreground">
        <div>
          The Collaborative Advocate Foundation (TCAF) · EIN 41-3618003 ·{" "}
          <a href="mailto:terryflood@thrivingcommunitiesforall.com" className="underline text-foreground">
            terryflood@thrivingcommunitiesforall.com
          </a>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/north-wilco-childcare-coalition" className="underline">Coalition Dashboard</Link>
          <Link href="/corridor-intelligence" className="underline">County Intelligence</Link>
          <Link href="/impact" className="underline">Impact Dashboard</Link>
          <Link href="/transparency" className="underline">Transparency</Link>
        </div>
      </div>
    </div>
  );
}
