import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Briefcase, Heart, BookOpen, Shield, Users, Sparkles, ArrowRight, AlertTriangle, CheckCircle2, Plane, FileText, Activity, ChevronRight, Calendar, Target, Lightbulb, TrendingUp, TrendingDown, Star, ClipboardList } from "lucide-react";
import { Link } from "wouter";

const DOMAIN_META: Record<string, { label: string; icon: any; color: string }> = {
  reentry: { label: "Reentry", icon: Shield, color: "bg-amber-500" },
  workforce: { label: "Workforce", icon: Briefcase, color: "bg-blue-500" },
  ai_training: { label: "AI Training", icon: Sparkles, color: "bg-purple-500" },
  benefits: { label: "Benefits", icon: Heart, color: "bg-green-500" },
  community: { label: "Community", icon: Users, color: "bg-pink-500" },
  geography: { label: "Location Change", icon: Plane, color: "bg-cyan-500" },
};

const US_STATES = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" }, { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" },
];

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

function ProfileHeader({ profile }: { profile: any }) {
  const daysSinceRelease = daysSince(profile.releaseDate);
  return (
    <Card data-testid="card-profile-header">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-resident-name">{profile.firstName} {profile.lastName}</h1>
              <p className="text-sm text-muted-foreground">Age {profile.age} · {profile.primaryLanguage}</p>
            </div>
          </div>
          <Separator orientation="vertical" className="hidden md:block h-16" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
            <div>
              <p className="text-xs text-muted-foreground">Currently in</p>
              <p className="font-semibold flex items-center gap-1" data-testid="text-current-location">
                <MapPin className="h-3 w-3" /> {profile.city}, {profile.state}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Days since release</p>
              <p className="font-semibold" data-testid="text-days-since-release">{daysSinceRelease} days</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Supervision</p>
              <p className="font-semibold text-sm" data-testid="text-supervision">{profile.supervisionStatus || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Housing</p>
              <p className="font-semibold text-sm" data-testid="text-housing">{profile.housingStatus || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Education</p>
              <p className="font-semibold text-sm" data-testid="text-education">{profile.educationLevel || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Employment</p>
              <p className="font-semibold text-sm" data-testid="text-employment">{profile.employmentStatus || "—"}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AutomationPanel({ eventsByDomain, eligibility, profile }: { eventsByDomain: Record<string, number>; eligibility: any; profile: any }) {
  const totalEvents = Object.values(eventsByDomain).reduce((a, b) => a + b, 0);
  const activeDomains = Object.values(eventsByDomain).filter(v => v > 0).length;
  const eligibleCount = (eligibility?.eligible || []).length;
  const federalCount = (eligibility?.eligible || []).filter((e: any) => e.scope === "federal" || (e.reason || "").toLowerCase().includes("federal")).length;
  const stateName = eligibility?.stateName || profile?.state || "";

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card" data-testid="card-automation">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> What the Platform Did Automatically</CardTitle>
        <CardDescription>Borders aren't real, but laws and policies are. The system handles the policy layer so people don't have to.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-3" data-testid="auto-stat-identity">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">One identity</p>
            <p className="text-2xl font-bold">{totalEvents}</p>
            <p className="text-xs text-muted-foreground">touchpoints carried forward — no re-typing</p>
          </div>
          <div className="rounded-lg border bg-card p-3" data-testid="auto-stat-domains">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Connected</p>
            <p className="text-2xl font-bold">{activeDomains} <span className="text-sm font-normal text-muted-foreground">/ 6</span></p>
            <p className="text-xs text-muted-foreground">domains sharing the same profile</p>
          </div>
          <div className="rounded-lg border bg-card p-3" data-testid="auto-stat-benefits">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Benefits matched</p>
            <p className="text-2xl font-bold">{eligibleCount}</p>
            <p className="text-xs text-muted-foreground">programs computed for {stateName}</p>
          </div>
          <div className="rounded-lg border bg-card p-3" data-testid="auto-stat-portable">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Portable on relocation</p>
            <p className="text-2xl font-bold">{federalCount}<span className="text-sm font-normal text-muted-foreground">+</span></p>
            <p className="text-xs text-muted-foreground">federal services follow the person across state lines</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          <strong className="text-foreground">Nothing happens in a vacuum.</strong> Every benefits screening, intake, training session, and case note on this platform reads from
          and writes back to this single profile. When the resident moves, federal benefits continue, state benefits route to local equivalents, and the case manager sees the same evidence the resident does.
        </p>
      </CardContent>
    </Card>
  );
}

function ActiveServicesPanel({ eventsByDomain }: { eventsByDomain: Record<string, number> }) {
  return (
    <Card data-testid="card-active-services">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5" /> Active Services</CardTitle>
        <CardDescription>One identity, every domain — no re-typing, no silos.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(DOMAIN_META).map(([key, meta]) => {
            const count = eventsByDomain[key] || 0;
            const Icon = meta.icon;
            return (
              <div key={key} className="rounded-lg border p-3 hover-elevate" data-testid={`tile-domain-${key}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`rounded-md p-2 ${meta.color} bg-opacity-15`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm font-medium">{meta.label}</p>
                <p className="text-xs text-muted-foreground">{count === 0 ? "Not yet active" : `${count} event${count > 1 ? "s" : ""}`}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function TimelinePanel({ events }: { events: any[] }) {
  return (
    <Card data-testid="card-timeline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Journey Timeline</CardTitle>
        <CardDescription>Every service touchpoint, in order. Updated automatically by every page.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No events yet — interact with any page to see them appear here.</p>
        ) : (
          <ol className="space-y-3">
            {events.map((e: any) => {
              const meta = DOMAIN_META[e.eventDomain] || DOMAIN_META.community;
              const Icon = meta.icon;
              return (
                <li key={e.id} className="flex gap-3" data-testid={`event-${e.id}`}>
                  <div className={`rounded-full p-2 ${meta.color} bg-opacity-15 shrink-0 h-fit`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <p className="font-medium text-sm">{e.eventTitle}</p>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.occurredAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{meta.label}</Badge>
                      {e.stateAtEvent && <Badge variant="outline" className="text-xs">{e.stateAtEvent}</Badge>}
                      {e.sourcePage && <span className="text-xs text-muted-foreground">via {e.sourcePage}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function EligibilityPanel({ eligibility }: { eligibility: any }) {
  return (
    <Card data-testid="card-eligibility">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5" /> Benefits Eligibility — {eligibility.stateName}</CardTitle>
        <CardDescription>Recomputed automatically from the resident's current state. Move them and these update.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className={`rounded-md p-3 mb-4 text-sm ${eligibility.medicaidExpansion ? "bg-green-500/10 text-green-900 dark:text-green-200" : "bg-amber-500/10 text-amber-900 dark:text-amber-200"}`}>
          <p className="font-semibold mb-1 flex items-center gap-2">
            {eligibility.medicaidExpansion ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            Medicaid: {eligibility.medicaidExpansion ? "Expansion adopted" : "Non-expansion (coverage gap)"}
          </p>
          <p className="text-xs opacity-90">{eligibility.medicaidNotes}</p>
        </div>
        <ul className="space-y-2">
          {eligibility.eligible.map((e: any, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm" data-testid={`eligibility-program-${i}`}>
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium">{e.program}</p>
                <p className="text-xs text-muted-foreground">{e.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function RiskProtectivePanel({ risk }: { risk: any }) {
  if (!risk) return null;
  return (
    <Card data-testid="card-risk-protective">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> Risk + Protective Factors (ChainWeb)</CardTitle>
        <CardDescription>Every factor traces to a primary source. Same data the case manager sees.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold mb-2 text-amber-600 dark:text-amber-400">Risk Factors</p>
            <ul className="space-y-2">
              {(risk.riskFactors || []).map((rf: any, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2" data-testid={`risk-factor-${i}`}>
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{rf.factor} <Badge variant="outline" className="text-xs ml-1">{rf.severity}</Badge></span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400">Protective Factors</p>
            <ul className="space-y-2">
              {(risk.protectiveFactors || []).map((pf: any, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2" data-testid={`protective-factor-${i}`}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span>{pf.factor} <Badge variant="outline" className="text-xs ml-1">{pf.strength}</Badge></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <Separator className="my-4" />
        <p className="text-sm font-semibold mb-2">ChainWeb Citation Sources</p>
        <div className="flex flex-wrap gap-2">
          {(risk.chainwebCitations || []).map((c: any, i: number) => (
            <Badge key={i} variant="secondary" className="text-xs" data-testid={`citation-${i}`} title={c.relevance}>
              {c.source.split(" — ")[0].split(" (")[0]}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChainWebPlanPanel({ risk, profileId, isPersonal }: { risk: any; profileId: string; isPersonal: boolean }) {
  const { toast } = useToast();
  const [plan, setPlan] = useState<any>(null);

  const planMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/resident/${profileId}/chainweb-plan`);
      return res.json();
    },
    onSuccess: (data) => setPlan(data.plan),
    onError: () => toast({ title: "Plan generation failed", description: "Please try again.", variant: "destructive" }),
  });

  if (!risk) return (
    <Card data-testid="card-chainweb-no-risk">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">No risk snapshot found for this profile.</p>
      </CardContent>
    </Card>
  );

  const score = risk.overallRiskScore ?? 0;
  const riskLevel = score >= 60 ? "critical" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";
  const scoreColor = score >= 60 ? "text-red-600 dark:text-red-400" : score >= 40 ? "text-amber-600 dark:text-amber-400" : score >= 20 ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400";
  const progressColor = score >= 60 ? "bg-red-500" : score >= 40 ? "bg-amber-500" : score >= 20 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="space-y-4" data-testid="panel-chainweb-plan">
      {/* Risk Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> ChainWeb Individual Risk Profile</CardTitle>
          <CardDescription>Every factor traces to a primary source. Same framework used at the community level — applied to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Risk Score</span>
              <span className={`text-2xl font-bold ${scoreColor}`}>{score}<span className="text-sm font-normal text-muted-foreground">/100</span></span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className={`h-3 rounded-full transition-all ${progressColor}`} style={{ width: `${score}%` }} data-testid="progress-risk-score" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
            </div>
            <Badge variant="outline" className={`mt-2 ${scoreColor}`} data-testid="badge-risk-level">{riskLevel.toUpperCase()} RISK</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm font-semibold mb-2 text-amber-600 dark:text-amber-400 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> Risk Factors</p>
              <ul className="space-y-2">
                {(risk.riskFactors || []).map((rf: any, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" data-testid={`plan-risk-factor-${i}`}>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{rf.factor} <Badge variant="outline" className="text-xs ml-1">{rf.severity}</Badge></span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400 flex items-center gap-1"><TrendingDown className="h-3.5 w-3.5" /> Protective Factors (Your Assets)</p>
              <ul className="space-y-2">
                {(risk.protectiveFactors || []).map((pf: any, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2" data-testid={`plan-protective-factor-${i}`}>
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>{pf.factor} <Badge variant="outline" className="text-xs ml-1">{pf.strength}</Badge></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommended Interventions */}
          {(risk.recommendedInterventions || []).length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-sm font-semibold mb-3 flex items-center gap-1"><Star className="h-4 w-4 text-primary" /> Recommended Interventions (evidence-ordered)</p>
              <div className="space-y-3">
                {(risk.recommendedInterventions || []).map((item: any, i: number) => (
                  <div key={i} className="rounded-md border p-3 bg-muted/30" data-testid={`intervention-${i}`}>
                    <div className="flex items-start gap-2">
                      <Badge variant={item.priority === "highest" ? "default" : item.priority === "high" ? "secondary" : "outline"} className="text-xs shrink-0 mt-0.5">
                        {item.priority}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">{item.intervention}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.rationale}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ChainWeb Citations */}
          {(risk.chainwebCitations || []).length > 0 && (
            <>
              <Separator className="my-4" />
              <p className="text-sm font-semibold mb-2 flex items-center gap-1"><BookOpen className="h-4 w-4" /> Primary Source Citations</p>
              <div className="flex flex-wrap gap-2">
                {(risk.chainwebCitations || []).map((c: any, i: number) => (
                  <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" title={c.relevance}
                    className="inline-block" data-testid={`plan-citation-${i}`}>
                    <Badge variant="secondary" className="text-xs hover:bg-primary/10 cursor-pointer transition-colors">
                      {c.source.split(" — ")[0].split(" (")[0]}
                    </Badge>
                  </a>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Narrative Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> {isPersonal ? "Your" : "This Person's"} ChainWeb Narrative Plan</CardTitle>
          <CardDescription>AI applies the RNR/CFIR framework to {isPersonal ? "your specific circumstances" : "this person's profile"} and generates an individualized, evidence-based action plan.</CardDescription>
        </CardHeader>
        <CardContent>
          {!plan && !planMutation.isPending && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted-foreground">
                Click below to generate a personalized ChainWeb narrative — 30/60/90-day action plan, what to lead with, what systems to navigate, and the single intervention most likely to change everything.
              </p>
              <Button onClick={() => planMutation.mutate()} className="gap-2" data-testid="button-generate-plan">
                <Sparkles className="h-4 w-4" /> Generate {isPersonal ? "My" : "This"} Plan
              </Button>
            </div>
          )}
          {planMutation.isPending && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground" data-testid="plan-loading">
              <Sparkles className="h-4 w-4 animate-spin text-primary" />
              Generating personalized ChainWeb plan from {(risk.chainwebCitations || []).length} primary sources…
            </div>
          )}
          {plan && (
            <div className="space-y-5" data-testid="plan-content">
              {plan.headline && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <p className="font-semibold text-base" data-testid="plan-headline">{plan.headline}</p>
                </div>
              )}
              {plan.narrative && (
                <div>
                  <p className="text-sm font-semibold mb-2">Your Story, Through the Data</p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap" data-testid="plan-narrative">{plan.narrative}</p>
                </div>
              )}
              {plan.oneThingThatChangesEverything && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1"><Star className="h-4 w-4" /> The One Thing That Changes Everything</p>
                  <p className="text-sm" data-testid="plan-one-thing">{plan.oneThingThatChangesEverything}</p>
                </div>
              )}
              {(plan.thirtyDayPlan || []).length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3 flex items-center gap-1"><Calendar className="h-4 w-4" /> 30-Day Action Plan</p>
                  <div className="space-y-2">
                    {plan.thirtyDayPlan.map((step: any, i: number) => (
                      <div key={i} className="rounded-md border p-3" data-testid={`thirtyDay-${i}`}>
                        <p className="text-xs font-semibold text-primary mb-1">{step.day}</p>
                        <p className="text-sm font-medium">{step.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">{step.why}</p>
                        {step.resource && <p className="text-xs text-primary mt-1 font-medium">Resource: {step.resource}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(plan.sixtyDayTargets || []).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">60-Day Targets</p>
                    <ul className="space-y-1">
                      {plan.sixtyDayTargets.map((t: string, i: number) => (
                        <li key={i} className="text-xs flex gap-1.5 items-start" data-testid={`sixty-day-${i}`}><CheckCircle2 className="h-3 w-3 text-primary shrink-0 mt-0.5" />{t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(plan.ninetyDayGoals || []).length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">90-Day Goals</p>
                    <ul className="space-y-1">
                      {plan.ninetyDayGoals.map((g: string, i: number) => (
                        <li key={i} className="text-xs flex gap-1.5 items-start" data-testid={`ninety-day-${i}`}><Target className="h-3 w-3 text-primary shrink-0 mt-0.5" />{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {(plan.strengthsToLead || []).length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Lead With Your Strengths</p>
                  <ul className="space-y-1">
                    {plan.strengthsToLead.map((s: string, i: number) => (
                      <li key={i} className="text-xs flex gap-1.5 items-start text-green-700 dark:text-green-400" data-testid={`strength-${i}`}><TrendingDown className="h-3 w-3 shrink-0 mt-0.5" />{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => { setPlan(null); planMutation.mutate(); }} className="gap-2" data-testid="button-regenerate-plan">
                <Sparkles className="h-3.5 w-3.5" /> Regenerate Plan
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RelocationWizard({ residentId, currentState, onComplete }: { residentId: string; currentState: string; onComplete: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [toState, setToState] = useState("");
  const [toCity, setToCity] = useState("");
  const [reason, setReason] = useState("");

  const previewQuery = useQuery<any>({
    queryKey: ["/api/resident", residentId, "eligibility-preview", toState],
    queryFn: async () => {
      if (!toState) return null;
      const res = await apiRequest("GET", `/api/resident/${residentId}/eligibility-preview?toState=${toState}`);
      return res.json();
    },
    enabled: step === 2 && !!toState,
  });

  const relocateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/resident/${residentId}/relocate`, { toState, toCity, reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Relocation complete", description: `${toCity || toState} location updated. Eligibility, services, and the journey timeline have all been refreshed.` });
      queryClient.invalidateQueries({ queryKey: ["/api/resident", residentId, "journey"] });
      setOpen(false);
      setStep(1); setToState(""); setToCity(""); setReason("");
      onComplete();
    },
    onError: () => toast({ title: "Relocation failed", description: "Please try again.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-plan-move"><Plane className="h-4 w-4" /> Plan a Move</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Plan a Relocation</DialogTitle>
          <DialogDescription>
            Currently in {currentState}. We'll preview which benefits and services change, then update everything in one step.
          </DialogDescription>
        </DialogHeader>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="to-state">Destination state</Label>
              <Select value={toState} onValueChange={setToState}>
                <SelectTrigger data-testid="select-to-state"><SelectValue placeholder="Choose a state..." /></SelectTrigger>
                <SelectContent>
                  {US_STATES.filter(s => s.code !== currentState).map(s => (
                    <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to-city">Destination city (optional)</Label>
              <Input id="to-city" value={toCity} onChange={e => setToCity(e.target.value)} placeholder="e.g., Wilmington" data-testid="input-to-city" />
            </div>
            <div>
              <Label htmlFor="reason">Reason for move (optional)</Label>
              <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Job opportunity, family support, housing..." rows={2} data-testid="input-reason" />
            </div>
            <DialogFooter>
              <Button onClick={() => setStep(2)} disabled={!toState} className="gap-2" data-testid="button-preview-changes">Preview changes <ChevronRight className="h-4 w-4" /></Button>
            </DialogFooter>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            {previewQuery.isLoading && <p className="text-sm text-muted-foreground">Computing eligibility delta...</p>}
            {previewQuery.data && (
              <>
                <div className="rounded-md border p-3 bg-muted/40">
                  <p className="text-sm font-semibold mb-1">{previewQuery.data.from.stateName} → {previewQuery.data.to.stateName}</p>
                  <p className="text-xs text-muted-foreground">{previewQuery.data.to.medicaidNotes}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">Newly eligible</p>
                    <ul className="space-y-1">
                      {previewQuery.data.gained.map((g: any, i: number) => <li key={i} className="text-xs flex gap-1" data-testid={`gained-${i}`}><CheckCircle2 className="h-3 w-3 text-green-500 shrink-0 mt-0.5" /> {g.program}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">No longer eligible</p>
                    <ul className="space-y-1">
                      {previewQuery.data.lost.map((l: any, i: number) => <li key={i} className="text-xs flex gap-1" data-testid={`lost-${i}`}><AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" /> {l.program}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Continued (federal)</p>
                    <ul className="space-y-1">
                      {previewQuery.data.continued.map((c: any, i: number) => <li key={i} className="text-xs flex gap-1" data-testid={`continued-${i}`}><CheckCircle2 className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" /> {c.program}</li>)}
                    </ul>
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)} data-testid="button-back">Back</Button>
                  <Button onClick={() => relocateMutation.mutate()} disabled={relocateMutation.isPending} className="gap-2" data-testid="button-confirm-move">
                    {relocateMutation.isPending ? "Updating..." : <>Confirm move <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </DialogFooter>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PersonalJourneyWizard({ onCreated }: { onCreated: (profileId: string) => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: "", age: "", city: "", state: "TX",
    housingStatus: "", employmentStatus: "", educationLevel: "",
    justiceInvolved: false, releaseDate: "", supervisionStatus: "",
    veteranStatus: false, dependents: "0",
    mentalHealthNeeds: "", substanceUseHistory: "", familySituation: "",
  });

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/resident/journey/create-personal", form);
      return res.json();
    },
    onSuccess: (data) => {
      if (!data.profileId) { toast({ title: "Error", description: "Server did not return a profile ID.", variant: "destructive" }); return; }
      toast({ title: "Your journey is ready", description: `Risk score: ${data.riskScore}/100 (${data.riskLevel}). Interventions have been computed from primary sources.` });
      setOpen(false);
      onCreated(data.profileId);
    },
    onError: () => toast({ title: "Creation failed", description: "Please try again.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/50 text-primary hover:bg-primary/5" data-testid="button-start-journey">
          <Sparkles className="h-4 w-4" /> Start Your Own Journey
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Start Your Own Journey</DialogTitle>
          <DialogDescription>
            Enter your circumstances — the platform will compute your ChainWeb risk profile, benefit eligibility, and a personalized intervention plan. No account needed. Nothing is shared without your consent.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — Who you are */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 1 of 3 — About You (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName">First name (private)</Label>
                <Input id="firstName" value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="e.g., Alex" data-testid="input-first-name" />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" min={16} max={90} value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g., 24" data-testid="input-age" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={v => set("state", v)}>
                  <SelectTrigger data-testid="select-state"><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={form.city} onChange={e => set("city", e.target.value)} placeholder="e.g., Austin" data-testid="input-city" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setStep(2)} className="gap-2" data-testid="button-step1-next">Next <ChevronRight className="h-4 w-4" /></Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 2 — Your situation */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 2 of 3 — Your Current Situation</p>
            <div>
              <Label>Housing status</Label>
              <Select value={form.housingStatus} onValueChange={v => set("housingStatus", v)}>
                <SelectTrigger data-testid="select-housing"><SelectValue placeholder="Select housing status…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stable permanent housing (own or rent)">Stable permanent (own or rent)</SelectItem>
                  <SelectItem value="Transitional housing / halfway house">Transitional / halfway house</SelectItem>
                  <SelectItem value="Staying with friends or family (couch surfing)">Staying with friends/family</SelectItem>
                  <SelectItem value="Emergency shelter or homeless">Homeless or emergency shelter</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employment status</Label>
              <Select value={form.employmentStatus} onValueChange={v => set("employmentStatus", v)}>
                <SelectTrigger data-testid="select-employment"><SelectValue placeholder="Select employment status…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employed full-time">Employed full-time</SelectItem>
                  <SelectItem value="Employed part-time">Employed part-time</SelectItem>
                  <SelectItem value="Self-employed / gig work">Self-employed / gig work</SelectItem>
                  <SelectItem value="Unemployed, actively seeking">Unemployed, seeking work</SelectItem>
                  <SelectItem value="Unemployed, not currently seeking">Not currently seeking work</SelectItem>
                  <SelectItem value="Unable to work">Unable to work</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Highest education level</Label>
              <Select value={form.educationLevel} onValueChange={v => set("educationLevel", v)}>
                <SelectTrigger data-testid="select-education"><SelectValue placeholder="Select education level…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Less than high school">Less than high school</SelectItem>
                  <SelectItem value="High school diploma or GED">High school diploma or GED</SelectItem>
                  <SelectItem value="Some college (1-2 years, no degree)">Some college (no degree)</SelectItem>
                  <SelectItem value="Associate degree">Associate degree</SelectItem>
                  <SelectItem value="Bachelor's degree or higher">Bachelor's degree or higher</SelectItem>
                  <SelectItem value="Vocational / trade certification">Vocational / trade certification</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} data-testid="button-step2-back">Back</Button>
              <Button onClick={() => setStep(3)} className="gap-2" data-testid="button-step2-next">Next <ChevronRight className="h-4 w-4" /></Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3 — Background */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step 3 of 3 — Your Background</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input type="checkbox" id="justiceInvolved" checked={form.justiceInvolved} onChange={e => set("justiceInvolved", e.target.checked)} className="h-4 w-4" data-testid="check-justice" />
                <Label htmlFor="justiceInvolved" className="cursor-pointer">I have a history of justice system involvement (incarceration, probation, parole)</Label>
              </div>
              {form.justiceInvolved && (
                <div className="grid grid-cols-1 gap-3 pl-4 border-l-2 border-muted">
                  <div>
                    <Label htmlFor="releaseDate">Release date (if applicable)</Label>
                    <Input id="releaseDate" type="date" value={form.releaseDate} onChange={e => set("releaseDate", e.target.value)} data-testid="input-release-date" />
                  </div>
                  <div>
                    <Label>Current supervision status</Label>
                    <Select value={form.supervisionStatus} onValueChange={v => set("supervisionStatus", v)}>
                      <SelectTrigger data-testid="select-supervision"><SelectValue placeholder="Select…" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On probation">On probation</SelectItem>
                        <SelectItem value="On parole">On parole</SelectItem>
                        <SelectItem value="Supervision completed">Supervision completed</SelectItem>
                        <SelectItem value="Pre-trial / awaiting sentencing">Pre-trial / awaiting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 rounded-md border p-3">
                <input type="checkbox" id="veteranStatus" checked={form.veteranStatus} onChange={e => set("veteranStatus", e.target.checked)} className="h-4 w-4" data-testid="check-veteran" />
                <Label htmlFor="veteranStatus" className="cursor-pointer">I am a veteran</Label>
              </div>
              <div>
                <Label>Dependents (children or others you care for)</Label>
                <Select value={form.dependents} onValueChange={v => set("dependents", v)}>
                  <SelectTrigger data-testid="select-dependents"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">None</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mentalHealthNeeds">Mental health needs (optional)</Label>
                <Input id="mentalHealthNeeds" value={form.mentalHealthNeeds} onChange={e => set("mentalHealthNeeds", e.target.value)} placeholder="e.g., anxiety, depression, PTSD, none" data-testid="input-mental-health" />
              </div>
              <div>
                <Label htmlFor="familySituation">Family situation (optional)</Label>
                <Textarea id="familySituation" value={form.familySituation} onChange={e => set("familySituation", e.target.value)} placeholder="e.g., aged out of foster care, strong family support, limited contact…" rows={2} data-testid="input-family-situation" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setStep(2)} data-testid="button-step3-back">Back</Button>
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="gap-2" data-testid="button-create-journey">
                {createMutation.isPending ? <><Sparkles className="h-4 w-4 animate-spin" /> Building your journey…</> : <><ArrowRight className="h-4 w-4" /> Build My Journey</>}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ResidentJourneyPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // URL param ?pid=<profileId> → any user can load their own journey
  const profileId = typeof window !== "undefined"
    ? (new URLSearchParams(window.location.search).get("pid") || "demo")
    : "demo";
  const isPersonal = profileId !== "demo";

  const journeyQuery = useQuery<any>({
    queryKey: ["/api/resident", profileId, "journey"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/resident/${profileId}/journey`);
      return res.json();
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/resident/seed-demo?reset=true");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/resident", "demo", "journey"] });
      toast({ title: "Demo scenario reset", description: "Marcus J. has been reseeded." });
    },
  });

  if (journeyQuery.isLoading) {
    return <div className="p-6"><p className="text-sm text-muted-foreground">Loading journey...</p></div>;
  }
  if (!journeyQuery.data) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><User className="h-7 w-7" /> Resident Journey</h1>
          <p className="text-sm text-muted-foreground mt-1">One identity. Every service. Travels with the person — even across state lines.</p>
        </div>
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-3 bg-primary/10 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-3">
                <Badge variant="secondary" className="text-xs">The headline story · How we build stronger communities</Badge>
                <h2 className="text-xl font-bold leading-tight">Meet Marcus. Foster youth. Incarcerated. Now reentering.</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most systems treat Marcus as seven different cases — a child welfare file, an inmate ID, a probation number, a Medicaid applicant,
                  a job seeker, a student, a benefits screener. Each office asks him to start over. Here, he is one person with one story.
                  Every service reads from the same profile and writes back to it. Then Marcus moves from Austin, TX to Wilmington, NC —
                  and eligibility recomputes automatically. <strong className="text-foreground">Borders aren't real, but laws and policies are. The platform handles the policy layer.</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  This is a live demo. No account needed. All data is synthetic — Marcus is a fictional composite.
                </p>
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  size="lg"
                  className="gap-2 mt-2"
                  data-testid="button-seed-demo"
                >
                  <Sparkles className="h-4 w-4" />
                  {seedMutation.isPending ? "Loading Marcus's story…" : "Load Marcus's Journey →"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground">
          After loading, explore: Risk + Protective Factors · Benefits Eligibility · Journey Timeline · Plan a Move to another state
        </p>
      </div>
    );
  }

  const { profile, latestRisk, events, eligibility, eventsByDomain } = journeyQuery.data;

  const isMarcusDemo = profile.firstName === "Marcus" && profile.lastName?.startsWith("J");

  const handlePersonalCreated = (newProfileId: string) => {
    navigate(`/resident-journey?pid=${newProfileId}`);
    setTimeout(() => journeyQuery.refetch(), 300);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4" data-testid="page-resident-journey">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><User className="h-7 w-7" /> Resident Journey</h1>
          <p className="text-sm text-muted-foreground">One identity. Every service. Travels with the person, even across state lines.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PersonalJourneyWizard onCreated={handlePersonalCreated} />
          <Link href="/case-manager">
            <Button variant="outline" className="gap-2" data-testid="link-case-manager"><Shield className="h-4 w-4" /> Case Manager View</Button>
          </Link>
          <RelocationWizard residentId={profileId} currentState={profile.state || "TX"} onComplete={() => journeyQuery.refetch()} />
        </div>
      </div>

      {/* Personal profile banner */}
      {isPersonal && (
        <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 via-card to-card" data-testid="card-personal-banner">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl p-2.5 bg-green-500/10 shrink-0">
                <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-sm text-green-700 dark:text-green-400">Your personal journey is loaded.</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your ChainWeb risk profile and recommended interventions have been computed from primary sources. Go to the <strong className="text-foreground">My ChainWeb Plan</strong> tab to see your personalized action plan.{" "}
                  <button onClick={() => navigate("/resident-journey")} className="underline text-primary hover:no-underline" data-testid="button-view-marcus">View Marcus's demo instead</button>.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marcus demo narrative */}
      {isMarcusDemo && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card" data-testid="card-marcus-narrative">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl p-3 bg-primary/10 shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <Badge variant="secondary" className="text-xs" data-testid="badge-headline-story">The headline story · How we build stronger communities</Badge>
                <h2 className="text-xl font-bold leading-tight" data-testid="text-marcus-headline">
                  This is Marcus. Foster youth. Incarcerated. Now reentering.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-marcus-summary">
                  Most systems treat Marcus as seven different cases — a child welfare file, an inmate ID, a probation number, a Medicaid applicant,
                  a job seeker, a student, a benefits screener. Each office asks him to start over. Each agency holds part of the truth.
                  Here, he is one person with one story. As he moves from reentry to workforce to AI training to community to benefits,
                  every page on this platform reads from the same profile and writes back to it. Nothing is re-typed. Nothing is lost.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-marcus-relocation">
                  Then Marcus relocates from Austin, TX to Wilmington, NC. His Medicaid eligibility recomputes (NC expanded; TX did not).
                  Federal services continue uninterrupted. State-specific programs route to local equivalents. His probation officer sees the
                  same risk and protective factors with citations to primary sources. <strong className="text-foreground">Borders aren't real, but laws and policies are — so the platform handles the policy layer, and the person keeps moving forward.</strong>
                </p>
                <p className="text-xs text-muted-foreground italic pt-1" data-testid="text-marcus-cta">
                  Use the tabs below to walk through Marcus's journey. Click <span className="font-semibold not-italic">Plan a Move</span> to relocate him to another state and watch eligibility recompute live. Or click <span className="font-semibold not-italic">Start Your Own Journey</span> to enter your circumstances.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ProfileHeader profile={profile} />
      <Tabs defaultValue={isPersonal ? "plan" : "overview"}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline" data-testid="tab-timeline">Timeline ({events.length})</TabsTrigger>
          <TabsTrigger value="eligibility" data-testid="tab-eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="risk" data-testid="tab-risk">Risk + Protective</TabsTrigger>
          <TabsTrigger value="plan" data-testid="tab-plan" className="relative">
            {isPersonal ? "My ChainWeb Plan" : "ChainWeb Plan"}
            {isPersonal && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-green-500" />}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <AutomationPanel eventsByDomain={eventsByDomain} eligibility={eligibility} profile={profile} />
          <ActiveServicesPanel eventsByDomain={eventsByDomain} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <EligibilityPanel eligibility={eligibility} />
            <RiskProtectivePanel risk={latestRisk} />
          </div>
        </TabsContent>
        <TabsContent value="timeline">
          <TimelinePanel events={events} />
        </TabsContent>
        <TabsContent value="eligibility">
          <EligibilityPanel eligibility={eligibility} />
        </TabsContent>
        <TabsContent value="risk">
          <RiskProtectivePanel risk={latestRisk} />
        </TabsContent>
        <TabsContent value="plan">
          <ChainWebPlanPanel risk={latestRisk} profileId={profileId} isPersonal={isPersonal} />
        </TabsContent>
      </Tabs>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">No silos. No re-typing.</strong> Every page in the platform reads from this profile and writes back to it.
            When the resident moves to a new state, benefit eligibility recomputes automatically, federal services continue,
            and state-specific services route to local equivalents.
            {!isPersonal && <>{" "}<button onClick={() => seedMutation.mutate()} className="underline text-primary hover:no-underline" data-testid="button-reset-demo">Reset Marcus's demo</button>.</>}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
