import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight, CheckCircle2, Heart, Rocket, Target, Compass,
  Building2, GraduationCap, Stethoscope, Radio,
  Users, Handshake, BarChart3, ShieldCheck, Globe, DollarSign,
  Network, Sparkles, LogIn,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const AFFILIATE_TYPES = [
  {
    icon: Heart,
    label: "Service Org",
    desc: "Nonprofit, faith-based org, mutual aid network, CHW organization",
    examples: "Churches · Promotora networks · Community health workers · Food pantries · Housing orgs",
    color: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400",
    iconColor: "text-emerald-600",
    pillar: "Serve",
  },
  {
    icon: Rocket,
    label: "Education & Workforce",
    desc: "School district, CBO, workforce board, college, apprenticeship program",
    examples: "ISD partners · WDB grantees · CTE programs · Job training orgs · Employer partners",
    color: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-600",
    pillar: "Grow",
  },
  {
    icon: Target,
    label: "Funder / Grant Partner",
    desc: "Foundation, government agency, intermediary, co-applicant on RFPs",
    examples: "Family foundations · EDA grantees · United Way · AmeriCorps programs · Federal intermediaries",
    color: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-600",
    pillar: "Fund",
  },
  {
    icon: Compass,
    label: "Civic & Media",
    desc: "Media org, civic tech, advocacy network, journalism, broadcast partner",
    examples: "Community radio · Podcast networks · Advocacy orgs · Civic tech groups · Reentry media",
    color: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400",
    iconColor: "text-teal-600",
    pillar: "Connect",
  },
];

const WHAT_YOU_GET = [
  { icon: Globe,        label: "Platform Access",          desc: "Shared intake, referral routing, and participant management tools — built for under-resourced orgs." },
  { icon: Handshake,   label: "Shared Referral Pathways", desc: "Cross-org warm handoffs. When you can't help, the network can. Tracked, closed-loop, auditable." },
  { icon: BarChart3,   label: "Outcome Measurement",      desc: "Auto-generated impact reports for your funders — no extra data entry. Pulls from shared platform activity." },
  { icon: DollarSign,  label: "Grant Support",             desc: "Priority teaming on EDA, AmeriCorps, DOL, and state RFPs. Your profile pre-populates every joint proposal." },
  { icon: ShieldCheck, label: "Co-branded Intake",         desc: "Run your own intake surface inside the platform — your name, your mission, TCAF infrastructure behind it." },
  { icon: Users,       label: "Shadow Worker Pathways",    desc: "Informal caregivers, peer mentors, promotoras, and driveway journeymen get real stipend & credentialing tracks." },
  { icon: Sparkles,    label: "AI Tools",                  desc: "Navigator, RFP-Match Storyteller, SDOH Explorer, and Ecosystem AI — available to all network affiliates." },
  { icon: Network,     label: "Your Identity Stays Yours", desc: "Affiliation is not acquisition. You keep your name, mission, and board. We provide infrastructure, not control." },
];

const STEPS = [
  { icon: LogIn,       label: "Sign in",                     desc: "One-click with Replit Auth. No new password." },
  { icon: Building2,   label: "Create org profile",           desc: "Legal name, EIN, mission, focus areas, counties served. ~5 minutes." },
  { icon: GraduationCap, label: "Select affiliate type",     desc: "Service Org, Workforce, Funder, or Civic & Media. Unlocks the right tools." },
  { icon: CheckCircle2,  label: "You're in the network",     desc: "Referral routing, RFP matching, and outcome reports go live immediately." },
];

export default function PartnersJoinPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: orgData, isLoading: orgLoading } = useQuery<{ organization: { id: string } | null }>({
    queryKey: ["/api/me/organization"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!isAuthenticated || isLoading || orgLoading) return;
    if (orgData?.organization) {
      setLocation("/settings/documents");
    } else {
      setLocation("/onboarding/org");
    }
  }, [isAuthenticated, isLoading, orgLoading, orgData, setLocation]);

  if (isAuthenticated && (isLoading || orgLoading)) {
    return (
      <div className="container max-w-3xl mx-auto p-6 py-16 space-y-4 text-center" data-testid="partners-join-routing">
        <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <h2 className="text-xl font-semibold">You're signed in — taking you to the right place…</h2>
        <p className="text-sm text-muted-foreground">Routing to your organization profile or document library.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto p-6 pb-16 space-y-12" data-testid="partners-join-page">

      {/* Hero */}
      <div className="text-center space-y-4 pt-6">
        <Badge variant="secondary" className="mx-auto text-sm px-4 py-1">Collaborative Advocate Foundation Network</Badge>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-page-title">
          You're already doing the work.<br className="hidden sm:block" />
          <span className="text-teal-600">Join the network that supports it.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Affiliation gives your organization platform infrastructure, shared referral pathways,
          auto-generated outcome reports, and priority teaming on federal and state funding — without giving up your name, mission, or board.
        </p>
        <a href="/api/login?returnTo=/onboarding/org">
          <Button size="lg" className="gap-2 bg-teal-600 hover:bg-teal-700" data-testid="button-join-hero">
            Become an Affiliate Partner <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">
          Already affiliated? <Link href="/settings/documents" className="underline">Go to your document library</Link>.
        </p>
      </div>

      {/* Who we're built for */}
      <section>
        <h2 className="text-xl font-bold mb-1">Who this is for</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Four lanes, one network. Your organization fits at least one.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {AFFILIATE_TYPES.map((type) => (
            <div key={type.label} className={`rounded-xl border p-5 space-y-2 ${type.color}`} data-testid={`card-affiliate-type-${type.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="flex items-center gap-2.5">
                <type.icon className={`h-5 w-5 shrink-0 ${type.iconColor}`} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-sm leading-tight">{type.label}</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">{type.pillar} pillar</Badge>
                </div>
              </div>
              <p className="text-sm">{type.desc}</p>
              <p className="text-xs opacity-75 leading-snug">{type.examples}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section>
        <h2 className="text-xl font-bold mb-1">What affiliation gives you</h2>
        <p className="text-sm text-muted-foreground mb-5">Eight things that are live on day one.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WHAT_YOU_GET.map((item) => (
            <Card key={item.label} className="border" data-testid={`card-benefit-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="pt-5 space-y-2">
                <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-xl font-bold mb-1">How it works</h2>
        <p className="text-sm text-muted-foreground mb-5">Four steps. Under ten minutes total.</p>
        <div className="grid sm:grid-cols-4 gap-4">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex flex-col items-start gap-2 p-4 rounded-xl bg-muted/40 border" data-testid={`card-step-${i + 1}`}>
              <div className="flex items-center gap-2 w-full">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                <step.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="font-semibold text-sm">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust + consent note */}
      <Card className="border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/20">
        <CardContent className="pt-5 flex flex-col sm:flex-row gap-4 items-start">
          <ShieldCheck className="h-6 w-6 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-sm text-teal-800 dark:text-teal-300 mb-1">Your data, your control — all 8 consent layers default OFF.</p>
            <p className="text-xs text-teal-700 dark:text-teal-400 leading-relaxed">
              Affiliation does not grant TCAF permission to share your data with funders, publish your name publicly, or aggregate
              your participants' stories. Every sharing decision — funder citation, public naming, story aggregation — has its own
              consent toggle, all off by default. You turn them on only if and when it serves your community.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4 pt-2 pb-4">
        <a href="/api/login?returnTo=/onboarding/org">
          <Button size="lg" className="gap-2 bg-teal-600 hover:bg-teal-700 min-w-64" data-testid="button-join-cta">
            Become an Affiliate Partner <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
        <div className="text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-center gap-3">
          <span>Questions first?</span>
          <Link href="/contact" className="underline">Contact us</Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/about" className="underline">About the Foundation</Link>
          <span className="hidden sm:inline">·</span>
          <Link href="/coalition" className="underline">See current network</Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Looking to team on a specific proposal instead? <Link href="/settings/documents" className="underline">Go to grant teaming →</Link>
        </p>
      </div>

    </div>
  );
}
