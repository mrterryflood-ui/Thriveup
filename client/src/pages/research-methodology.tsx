import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Microscope, FlaskConical, BookOpen, FileText, GitBranch,
  Database, Lock, MessageSquare, Award, Users, CheckCircle2,
  ArrowRight, Lightbulb, BarChart3, RefreshCw, Target, Shield,
  AlertTriangle,
} from "lucide-react";
import { PartnershipStatus, PartnershipStatusLegend } from "@/components/partnership-status";

export default function ResearchMethodologyPage() {
  useEffect(() => {
    document.title = "Research & How We Work | TCAF";
  }, []);

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-10">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <Badge variant="outline" className="gap-1.5 border-indigo-500 text-indigo-700 dark:text-indigo-300">
          <Microscope className="h-3.5 w-3.5" aria-hidden="true" /> Evidence-Based · Open Methodology
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
          Yes, we do research — here's how
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          We study what actually works for real communities. Then we wire those methods directly into the platform — so every tool, program, and resource we offer is grounded in evidence, not guesswork. This page explains what we study, how we do it honestly, and what it means for the people we serve.
        </p>
      </div>

      {/* ── Three-step plain-language explainer ─────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <HowCard
          icon={Lightbulb}
          step="1"
          title="We ask what the research says"
          desc="Before building anything, we review published studies, systematic reviews, and proven programs. We only build on evidence that has been tested — not on trends or assumptions."
          color="bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
        />
        <HowCard
          icon={Users}
          step="2"
          title="We test it with real communities"
          desc="We implement programs with the communities we serve, document what adapts and what holds, and track fidelity — how closely practice matches the proven model."
          color="bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400"
        />
        <HowCard
          icon={BarChart3}
          step="3"
          title="We measure what actually changes"
          desc="Outcomes are tracked, verified, and published. We measure reach (who we served), effectiveness (what changed), and sustainability (did it last)."
          color="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
        />
      </div>

      {/* ── What this means for different audiences ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" /> What our research means for you
          </CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
          <AudienceCard
            who="If you're a community member or family"
            what="Every program on this platform — the job training, the benefits navigation, the childcare resources — is built on methods that have been shown to work in communities like yours. You're not a guinea pig."
          />
          <AudienceCard
            who="If you're a partner organization"
            what="We can help you evaluate your own programs using the same frameworks. The Research Hub has free tools you can use right now to score your program's reach, effectiveness, and sustainability."
          />
          <AudienceCard
            who="If you're a funder or grant reviewer"
            what="Our methodologies are documented, versioned, and open. Every claimed outcome is cryptographically provenance-tracked — you can verify it, not just trust it."
          />
          <AudienceCard
            who="If you're a researcher or academic"
            what="We're pursuing co-PI partnerships for peer-reviewed publication (Q3 2026 target). We operate under open methodology — everything we use is documented and available for external review."
          />
        </CardContent>
      </Card>

      {/* ── Plain-language methodology explanations ─────────────────────── */}
      <div>
        <h2 className="text-xl font-bold mb-1">The methods we use — in plain English</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Each methodology below is built on established research frameworks. We've given each one a name so we can track it, version it, and publish it. Click any card to understand what it does and why it matters.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <MethodCard
            acronym="RPLICE"
            plainTitle="Moving research into real action"
            desc="Most organizations cite research. We actually implement it — and document every step. RPLICE is our protocol for taking published evidence (peer-reviewed studies, systematic reviews) and delivering it in a real community program without losing what made the evidence work in the first place."
            basis="Knowledge-to-Action framework (Graham et al., 2006) · CFIR (Damschroder et al., 2009)"
          />
          <MethodCard
            acronym="RE-AIM"
            plainTitle="Measuring programs that last"
            desc="A framework used by CDC, SAMHSA, and public health researchers worldwide. It asks five questions about every program: Did we reach the right people? Did it work? Did organizations adopt it? Was it delivered with fidelity? Did it stick? We score every program we operate on all five dimensions."
            basis="RE-AIM framework (Glasgow et al., 1999) — used by 3,500+ published studies"
          />
          <MethodCard
            acronym="CFIR"
            plainTitle="Why the same program works in one place and not another"
            desc="The Consolidated Framework for Implementation Research. It maps 39 factors that determine whether a program succeeds or fails in a specific community — things like leadership support, staff readiness, community trust, and resource availability. We assess all 39 before launching anything new."
            basis="CFIR (Damschroder et al., 2009) — standard in NIH-funded implementation research"
          />
          <MethodCard
            acronym="MAP-GAP"
            plainTitle="Continuous improvement, done honestly"
            desc="Our internal quality cycle. MAP = structured observation of what's working. GAP = prioritizing what isn't. Then we fix it, check it, and document the lesson — so we don't repeat the same mistakes. It's the Plan-Do-Study-Act cycle adapted for community programs."
            basis="PDSA cycle (Deming) · IHI Model for Improvement"
          />
          <MethodCard
            acronym="MG-PATR"
            plainTitle="Tracking outcomes across generations"
            desc="Many community programs stop measuring after 6 months. We track outcomes across generational cohorts — parents and children in the same household, over years — to understand multi-generational impact, not just short-term metrics."
            basis="Life-course epidemiology · longitudinal cohort design"
          />
          <MethodCard
            acronym="Three Realities Diagnostic"
            plainTitle="Finding the gap between what we say and what we do"
            desc="Organizations often operate differently from how they describe themselves. This diagnostic compares three realities: what the organization says it does, what staff actually do, and what the people being served actually experience. Gaps between these three are where programs quietly fail."
            basis="Argyris & Schön espoused theory vs. theory-in-use (1974)"
          />
        </div>
      </div>

      {/* ── Data infrastructure ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" aria-hidden="true" /> How we protect and verify data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Every outcome we report is traceable back to its source. We don't publish a number unless we can prove where it came from.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <DataCard icon={Lock} name="Cryptographic provenance" desc="Outcome records are SHA-256 hash-chained — any tampering breaks the chain. Donors and auditors can verify every reported number independently." />
            <DataCard icon={Database} name="Live Census data" desc="Our community need maps pull directly from the US Census Bureau's American Community Survey — updated data, not stale snapshots." />
            <DataCard icon={GitBranch} name="Versioned methods" desc="Every methodology change is tracked like software code. You can see exactly what changed, when, and why." />
            <DataCard icon={FileText} name="Public outcomes" desc="Quarterly outcomes are published to our public Transparency dashboard — not locked behind login." />
          </div>
        </CardContent>
      </Card>

      {/* ── Where we are today (honest disclosure — moved here intentionally) */}
      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-sm space-y-2">
              <p className="font-semibold text-amber-900 dark:text-amber-200">Where we are today — honest disclosure</p>
              <p className="text-amber-800 dark:text-amber-300">
                TCAF is an <strong>applied implementation science organization</strong>, not a traditional research university. We operate using established, published frameworks — but we do not yet hold our own peer-reviewed publications. First peer-reviewed submissions are targeted for Q3 2026. We are actively building university co-PI partnerships to support that work (status below). We put this here, not at the top, because we wanted you to understand what we do before you see this caveat — but we won't hide it.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── University partnerships ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" aria-hidden="true" /> University partnerships we're building
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            For peer-reviewed publications and research-grade funding, we need university co-PIs. Here's the honest status of those conversations.
          </p>
          <div className="space-y-2">
            <PartnerRow name="The University of Texas at Austin — Dell Medical School" role="Health-services research and implementation science co-PI" stage="aspirational" />
            <PartnerRow name="Huston-Tillotson University" role="HBCU co-investigator and broader-impacts partner" stage="aspirational" />
            <PartnerRow name="Austin Community College — Center for Public Policy & Political Studies" role="Workforce and community engagement research partner" stage="aspirational" />
            <PartnerRow name="Texas State University — School of Social Work" role="Implementation research and outcome measurement partner" stage="aspirational" />
          </div>
          <PartnershipStatusLegend />
        </CardContent>
      </Card>

      {/* ── Publication pathway ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" aria-hidden="true" /> Where we plan to publish
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">First peer-reviewed submissions are targeted for Q3 2026. Planned outlets:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <PubTarget journal="Implementation Science" topic="RPLICE protocol and CFIR-anchored implementation case studies" />
            <PubTarget journal="Health Affairs" topic="Community-based behavioral health workforce development findings" />
            <PubTarget journal="Journal of Community Health" topic="Multi-generational outcome measurement (MG-PATR)" />
            <PubTarget journal="Social Science & Computer Review" topic="AI-augmented community service delivery (ACOS)" />
          </div>
          <p className="text-xs text-muted-foreground italic pt-2 border-t">
            Pre-prints released via Open Science Framework (OSF) on submission. All supporting datasets released as de-identified open data with documented data dictionaries.
          </p>
        </CardContent>
      </Card>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-4">
          <p className="font-semibold">Ready to go deeper?</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" data-testid="button-research-hub">
              <Link href="/research-hub">
                <FlaskConical className="mr-2 h-4 w-4" /> Use the Research Hub tools
              </Link>
            </Button>
            <Button asChild variant="outline" data-testid="button-research-contact">
              <a href="mailto:research@thecollaborativeadvocate.org">
                <MessageSquare className="mr-2 h-4 w-4" /> Contact us for partnerships
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Research Hub has free tools to evaluate your own programs using RE-AIM and CFIR — no account required.
          </p>
        </CardContent>
      </Card>

    </div>
  );
}

function HowCard({ icon: Icon, step, title, desc, color }: { icon: any; step: string; title: string; desc: string; color: string }) {
  return (
    <Card className="p-5 space-y-3">
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full ${color}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-0.5">Step {step}</p>
        <p className="font-semibold text-sm">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}

function AudienceCard({ who, what }: { who: string; what: string }) {
  return (
    <div className="p-4 rounded-md border bg-background space-y-1.5">
      <p className="text-sm font-semibold">{who}</p>
      <p className="text-sm text-muted-foreground leading-relaxed">{what}</p>
    </div>
  );
}

function MethodCard({ acronym, plainTitle, desc, basis }: { acronym: string; plainTitle: string; desc: string; basis: string }) {
  return (
    <Card className="p-5 bg-background space-y-2" data-testid={`card-method-${acronym.toLowerCase()}`}>
      <div>
        <p className="font-semibold text-sm">{plainTitle}</p>
        <p className="text-[11px] font-mono text-muted-foreground">{acronym}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      <p className="text-[11px] text-muted-foreground/70 italic border-t pt-2">Based on: {basis}</p>
    </Card>
  );
}

function DataCard({ icon: Icon, name, desc }: { icon: any; name: string; desc: string }) {
  return (
    <div className="p-3 rounded-md border bg-background space-y-1">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        <p className="text-sm font-semibold">{name}</p>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function PubTarget({ journal, topic }: { journal: string; topic: string }) {
  return (
    <div className="p-3 rounded-md border bg-background space-y-0.5">
      <p className="text-sm font-semibold">{journal}</p>
      <p className="text-xs text-muted-foreground">{topic}</p>
    </div>
  );
}

function PartnerRow({ name, role, stage }: { name: string; role: string; stage: any }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md border bg-background" data-testid={`partner-research-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40)}`}>
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
      <PartnershipStatus stage={stage} />
    </div>
  );
}
