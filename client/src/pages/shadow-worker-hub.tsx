import { useState } from "react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Heart, Users, DollarSign, Award, ArrowRight, CheckCircle2,
  Sparkles, Star, Shield, BookOpen, Briefcase, Calendar,
  MessageCircle, HandHeart, Mic, GraduationCap, Clock,
  ChevronRight, AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { IntegrationInvitation } from "@/components/integration-invitation";

const SHADOW_ROLES = [
  { label: "Informal Caregiver",       desc: "You care for a neighbor, family member, or community elder without being paid or officially recognized." },
  { label: "Peer Mentor",              desc: "You've been through reentry, foster care, addiction, or crisis — and you guide others through it from lived experience." },
  { label: "Promotora / Community Health Worker", desc: "You do health outreach, navigation, and trust-building in your community, with or without a formal credential." },
  { label: "Driveway Journeyman",      desc: "You do skilled trades work — electrical, plumbing, welding, HVAC, auto — without a license or formal apprenticeship yet." },
  { label: "Faith-Based Navigator",    desc: "You connect people to resources through your church, mosque, temple, or congregation without a social work credential." },
  { label: "Neighborhood Connector",   desc: "You're the person your block turns to — for referrals, advice, rides, or just knowing who to call." },
];

const STIPEND_TIERS = [
  { tier: "Recognition",  hours: "1–40 hrs logged",   amount: "$0",        note: "Platform recognition, digital badge, and network listing." },
  { tier: "Community",    hours: "41–100 hrs logged",  amount: "$150/mo",   note: "Monthly stipend eligibility when grant funding is active. Apply to activate." },
  { tier: "Navigator",    hours: "101–250 hrs logged", amount: "$300/mo",   note: "Elevated stipend + CHW training pathway access." },
  { tier: "Lead",         hours: "251+ hrs logged",    amount: "$500/mo",   note: "Lead stipend + credentialing fee coverage + job referral pipeline." },
];

const CREDENTIAL_PATHWAYS = [
  { name: "CHW Core Competency Certificate", provider: "TCAF / Partner AHEC", weeks: 8,  prereq: "100+ hrs logged", cost: "Free to shadow workers" },
  { name: "Peer Support Specialist (PSS)",   provider: "State board pathway",  weeks: 40, prereq: "Lived experience + 40 hrs", cost: "Covered at Navigator tier" },
  { name: "NCCER Trade Foundation",          provider: "NCCER",                weeks: 12, prereq: "Driveway journeyman pathway", cost: "Covered at Lead tier" },
  { name: "SNAP Outreach Worker",            provider: "USDA / HHSC",          weeks: 2,  prereq: "Community tier",  cost: "Free training + stipend" },
  { name: "Promotora / CHW (Texas DSHS)",   provider: "Texas DSHS",           weeks: 16, prereq: "200+ hrs + sponsor org", cost: "Covered at Lead tier" },
];

export default function ShadowWorkerHubPage() {
  const { isAuthenticated } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-10 pb-16 space-y-14" data-testid="page-shadow-worker-hub">

      {/* Hero */}
      <div className="text-center space-y-4">
        <Badge variant="secondary" className="mx-auto bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300">
          Integration Through Invitation (ITI)
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight" data-testid="text-hub-title">
          Shadow Worker Hub
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          You're already doing this work. You've been doing it for years — without a title, without pay, and without recognition. This hub exists to change that: real stipends, real credentials, real pathways forward.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><DollarSign className="h-4 w-4" /> Real stipends</span>
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400"><Award className="h-4 w-4" /> Real credentials</span>
          <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400"><Shield className="h-4 w-4" /> Your consent controls everything</span>
        </div>
      </div>

      {/* ITI invitation */}
      <IntegrationInvitation
        surface="shadow-worker-hub"
        prompt="Are you already supporting your community without formal recognition or pay?"
        description="Name what you do. We'll map it to stipend tiers, credential pathways, and real opportunities — with all 8 consent layers off by default. Nothing is shared without your explicit permission."
        suggestedRoleTags={["Informal Caregiver", "Peer Mentor", "Promotora", "Driveway Journeyman", "Faith-Based Navigator", "Neighborhood Connector"]}
      />

      {/* Who belongs here */}
      <section>
        <h2 className="text-xl font-bold mb-1">Who belongs in this hub</h2>
        <p className="text-sm text-muted-foreground mb-5">If any of these describe you, you belong here.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {SHADOW_ROLES.map((role) => (
            <button
              key={role.label}
              onClick={() => setSelectedRole(role.label === selectedRole ? null : role.label)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${selectedRole === role.label ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20" : "border-border hover:border-violet-300 hover:bg-muted/30"}`}
              data-testid={`card-shadow-role-${role.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-start gap-3">
                <Heart className={`h-4 w-4 mt-0.5 shrink-0 ${selectedRole === role.label ? "text-violet-500" : "text-muted-foreground"}`} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-sm">{role.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{role.desc}</p>
                </div>
                {selectedRole === role.label && <CheckCircle2 className="h-4 w-4 text-violet-500 ml-auto shrink-0 mt-0.5" aria-hidden="true" />}
              </div>
            </button>
          ))}
        </div>
        {selectedRole && (
          <div className="mt-4 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 flex items-center justify-between gap-3">
            <p className="text-sm text-violet-800 dark:text-violet-300">
              <strong>{selectedRole}</strong> — you're in the right place. Sign in to log your hours and start the pathway.
            </p>
            <Link href={isAuthenticated ? "/profile" : "/api/login?returnTo=/shadow-worker-hub"}>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 shrink-0" data-testid="button-shadow-start">
                {isAuthenticated ? "Log Hours" : "Sign In"} <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Stipend tiers */}
      <section>
        <h2 className="text-xl font-bold mb-1">Stipend tiers</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Stipends are paid monthly when grant funding is active. Current funding window: <strong className="text-foreground">July 2026 – June 2027</strong> (AmeriCorps Capacity Building). Apply at the Community tier or above to activate payments.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STIPEND_TIERS.map((tier, i) => (
            <Card key={tier.tier} className={`border-2 ${i === 3 ? "border-violet-400 dark:border-violet-700" : "border-border"}`} data-testid={`card-stipend-${tier.tier.toLowerCase()}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{tier.tier}</CardTitle>
                  {i === 3 && <Badge className="text-[10px] bg-violet-600">Top</Badge>}
                </div>
                <CardDescription className="text-xs">{tier.hours}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{tier.amount}</p>
                <p className="text-xs text-muted-foreground leading-snug">{tier.note}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Stipend availability is tied to active grant funding. Current window: July 2026 – June 2027. TCAF posts funding gaps publicly on the Transparency Dashboard when a window closes.
        </p>
      </section>

      {/* Credentialing pathways */}
      <section>
        <h2 className="text-xl font-bold mb-1">Credential pathways</h2>
        <p className="text-sm text-muted-foreground mb-5">Your hours translate into formal credentials. We cover the cost at Navigator and Lead tiers.</p>
        <div className="space-y-3">
          {CREDENTIAL_PATHWAYS.map((path) => (
            <div key={path.name} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-muted/30 border" data-testid={`card-credential-${path.name.toLowerCase().replace(/\s+/g, '-')}`}>
              <GraduationCap className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{path.name}</p>
                <p className="text-xs text-muted-foreground">{path.provider} · {path.weeks}-week pathway · Prereq: {path.prereq}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0 border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400">{path.cost}</Badge>
            </div>
          ))}
        </div>
      </section>

      {/* Impact tracker preview */}
      <section>
        <h2 className="text-xl font-bold mb-1">Your impact — tracked and recognized</h2>
        <p className="text-sm text-muted-foreground mb-5">Once you're signed in, this dashboard tracks your hours, impact, and progression in real time.</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: Clock,         label: "Hours Logged",         value: "–",   unit: "hrs",    desc: "Sign in to start tracking" },
            { icon: Users,         label: "People Supported",      value: "–",   unit: "people", desc: "Your estimated reach" },
            { icon: DollarSign,    label: "Stipend Earned",        value: "–",   unit: "total",  desc: "Lifetime stipend payments" },
          ].map((stat) => (
            <Card key={stat.label} className="border text-center" data-testid={`card-impact-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardContent className="pt-6 space-y-2">
                <stat.icon className="h-6 w-6 text-primary mx-auto" aria-hidden="true" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.unit}</p>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress to Community tier</span>
            <span className="font-medium">0 / 41 hrs</span>
          </div>
          <Progress value={0} className="h-2" aria-label="Progress to community tier" />
        </div>
      </section>

      {/* Consent reminder */}
      <Card className="border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20">
        <CardContent className="pt-5 flex gap-4 items-start">
          <Shield className="h-6 w-6 text-violet-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold text-sm text-violet-800 dark:text-violet-300 mb-1">All 8 consent layers default OFF.</p>
            <p className="text-xs text-violet-700 dark:text-violet-400 leading-relaxed">
              Your hours, your identity, and your story are yours. We will never share them with a funder, name you publicly, or include you in research without your explicit permission — one toggle at a time, each with a plain-language explanation. You can update any consent at any time.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <div className="text-center space-y-4">
        <a href={isAuthenticated ? "/profile" : "/api/login?returnTo=/shadow-worker-hub"}>
          <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700 min-w-56" data-testid="button-shadow-cta">
            {isAuthenticated ? "Log My Hours & Impact" : "Sign In to Start Your Pathway"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
        <p className="text-xs text-muted-foreground">
          Have questions first? <Link href="/contact" className="underline">Contact us</Link> · <Link href="/data-council" className="underline">See how your data is governed</Link>
        </p>
      </div>

    </div>
  );
}
