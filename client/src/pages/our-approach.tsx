import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import {
  Users,
  Heart,
  Lightbulb,
  TrendingUp,
  MapPin,
  HandHeart,
  School,
  Building2,
  ArrowRight,
  CheckCircle2,
  Layers,
  Repeat,
  GitMerge,
  Mic,
  BarChart3,
  BookOpen,
  Sparkles,
  Globe,
  Target,
  Baby,
} from "lucide-react";

const COLLABORATION_STEPS = [
  {
    step: "01",
    title: "Listen before you build",
    framework: "Human-Centered Codesign",
    color: "sky",
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
    color: "rose",
    description:
      "Liberatory design asks: who benefits from this system, and who holds power within it? The platform is designed so that the communities most impacted by systems failure are not passive recipients of services — they are advocates, co-designers, stipend earners, credential holders, and named contributors. The system does not summarize their story without their permission.",
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
    color: "violet",
    description:
      "The Collaborative Advocate Foundation is named for this: advocacy done together is the only advocacy that lasts. Collective impact requires a backbone organization, a common agenda, shared measurement, mutually reinforcing activities, and continuous communication. TCAF is the backbone. The platform is the shared infrastructure every coalition partner uses — not a separate tool for each org, but one system that makes everyone's contribution visible.",
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
    color: "amber",
    description:
      "Knowledge is not transferred — it is constructed. A community health worker who navigates a family through SNAP enrollment doesn't just deliver a service; they build knowledge with that family about how the system works, what it owes them, and how to use it again. Trade simulations, peer mentorship, and navigator training are all designed on the same principle: you learn by doing, with someone beside you.",
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

const colorMap: Record<string, { bg: string; border: string; badge: string; heading: string; dot: string }> = {
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800",
    badge: "bg-sky-700 text-white",
    heading: "text-sky-800 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800",
    badge: "bg-rose-700 text-white",
    heading: "text-rose-800 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
    badge: "bg-violet-700 text-white",
    heading: "text-violet-800 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    badge: "bg-amber-700 text-white",
    heading: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

export default function OurApproachPage() {
  const [expanded, setExpanded] = useState<string | null>("Human-Centered Codesign");

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-10" data-testid="page-our-approach">

      {/* Hero */}
      <header className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className="bg-slate-800 text-white text-[10px] uppercase tracking-wider">
            The Collaborative Advocate Foundation
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Design Philosophy
          </Badge>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight" data-testid="text-page-title">
          Collaboration is not a feature.<br />
          <span className="text-muted-foreground font-normal">It is the architecture.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          The Collaborative Advocate Foundation was named deliberately. Advocacy done together — across community members,
          practitioners, funders, and systems — is the only advocacy that lasts. Every framework we use, every surface
          we build, every coalition we convene is an expression of that principle.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button size="sm" asChild data-testid="link-coalition-dashboard">
            <Link href="/north-wilco-childcare-coalition">
              <Baby className="h-3.5 w-3.5 mr-1" /> Coalition Dashboard
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild data-testid="link-corridor">
            <Link href="/corridor-intelligence">
              <MapPin className="h-3.5 w-3.5 mr-1" /> County Intelligence
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild data-testid="link-benefits">
            <Link href="/benefits">
              <HandHeart className="h-3.5 w-3.5 mr-1" /> Benefits Navigator
            </Link>
          </Button>
        </div>
      </header>

      <Separator />

      {/* Community voice as source */}
      <section data-testid="section-community-voice-source">
        <div className="rounded-xl border-2 border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Mic className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-rose-800 dark:text-rose-300">
                Community voice is the source — not the input.
              </h2>
              <p className="text-sm text-rose-800 dark:text-rose-300 max-w-3xl leading-relaxed">
                Before any census data is pulled, before any grant is written, before any CHW is deployed —
                the people living closest to the gap have already described it. They have names for it.
                They have solutions for it. They are often already running those solutions without a title or a budget.
                The platform listens to them first, and builds outward from what they say.
              </p>
              <p className="text-sm text-rose-800 dark:text-rose-300 max-w-3xl leading-relaxed">
                This is not consultation. It is not community engagement as a checkbox.
                It is <strong>co-authorship</strong> — where the grandmother watching four children
                on the night shift at Samsung is as much the designer of the North Wilco coalition response
                as any funder or practitioner at the table.
              </p>
              <div className="flex gap-3 flex-wrap pt-1">
                <Button size="sm" className="bg-rose-700 hover:bg-rose-800 text-white" asChild data-testid="button-voice-source">
                  <Link href="/voice">
                    <Mic className="h-3.5 w-3.5 mr-1" /> Community Voice projects
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="border-rose-400 text-rose-800 dark:text-rose-300" asChild data-testid="button-voice-north-wilco">
                  <Link href="/voice/north-wilco-childcare-gaps">
                    <Heart className="h-3.5 w-3.5 mr-1" /> N. Wilco Childcare Gaps
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Collaboration spine */}
      <section data-testid="section-collaboration-spine">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-600" />
            Collaboration at every step
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            The platform facilitates collaboration across all six phases — community and coalition together, not separately.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {COLLABORATION_SPINE.map((phase, i) => {
            const Icon = phase.icon;
            return (
              <div
                key={phase.phase}
                className="rounded-xl border p-4 space-y-2"
                data-testid={`card-phase-${phase.phase.toLowerCase()}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground">0{i + 1}</span>
                  <Icon className="h-4 w-4 text-violet-600" />
                  <span className="font-semibold text-sm">{phase.phase}</span>
                </div>
                <div className="text-xs text-muted-foreground font-medium">{phase.who}</div>
                <div className="text-xs border-l-2 border-violet-300 pl-2 text-violet-800 dark:text-violet-300">
                  {phase.tool}
                </div>
              </div>
            );
          })}
        </div>
        {/* Connecting arrow */}
        <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
          <Repeat className="h-3.5 w-3.5" />
          <span>Each phase feeds back into the next — the loop never closes, it deepens.</span>
        </div>
      </section>

      <Separator />

      {/* Four frameworks as one */}
      <section data-testid="section-four-frameworks">
        <div className="mb-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-slate-600" />
            Four frameworks. One philosophy.
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Human-centered codesign, liberatory design, collective impact, and constructivism are not a menu to choose from.
            Held together, they describe what it means to build with — not for — the communities that need these systems most.
          </p>
        </div>

        <div className="space-y-3">
          {COLLABORATION_STEPS.map((item) => {
            const c = colorMap[item.color];
            const Icon = item.icon;
            const isOpen = expanded === item.framework;
            return (
              <div
                key={item.framework}
                className={`rounded-xl border-2 ${c.border} ${isOpen ? c.bg : "bg-background"} overflow-hidden transition-all`}
                data-testid={`card-framework-${item.framework.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <button
                  className="w-full text-left p-4 flex items-center justify-between gap-3"
                  onClick={() => setExpanded(isOpen ? null : item.framework)}
                  data-testid={`toggle-framework-${item.step}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground shrink-0">{item.step}</span>
                    <Icon className={`h-5 w-5 ${c.heading} shrink-0`} />
                    <div>
                      <div className={`font-bold text-sm leading-snug ${c.heading}`}>{item.title}</div>
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
                            <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${c.heading}`} />
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
      </section>

      <Separator />

      {/* What holds it all together */}
      <section data-testid="section-holds-together">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              What holds it all together: the five-lens practitioner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              These frameworks only work holistically when the people building the platform hold all five lenses
              simultaneously — none sacrificed for another:
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              {[
                { lens: "Implementation Scientist", desc: "CFIR · RE-AIM · EPIS · fidelity · scalability · clearinghouse-grade evaluation", icon: Target },
                { lens: "Psychologist / Neuroscientist", desc: "Trauma-informed design · regulation skills front-loaded · no shame architecture · developmental science", icon: Heart },
                { lens: "Data Engineer", desc: "Primary-source verifiable · FHIR/CDS-Hooks interoperable · 0-PHI-egress · witness-logged · auditable", icon: BarChart3 },
                { lens: "Community Health Worker", desc: "Trusted-messenger model · dialect-honoring · stipended shadow workers real not aspirational · peer-mentor + promotora + neighbor + faith leader pathways", icon: HandHeart },
                { lens: "UX / User-Centered Designer", desc: "Parent · Circle member · clinician · evaluator · funder each have a coherent surface · consent default OFF · friction calibrated · no surprises", icon: Lightbulb },
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
      </section>

      {/* Honest acknowledgment */}
      <section data-testid="section-honest-gap">
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <div className="font-semibold text-sm text-amber-800 dark:text-amber-300">Honest about where we are</div>
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  The platform has the <em>architecture</em> of liberatory codesign — the voice infrastructure, the consent
                  layers, the shadow-worker recognition, the collaboration surfaces. The formal co-design <em>process</em> —
                  structured sessions where community members are designers, not just informants, doing power mapping and
                  "how might we" prototyping together — is active in the field but not yet fully documented in this platform.
                  That work is happening. This page will reflect it as it does.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* Footer links */}
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
