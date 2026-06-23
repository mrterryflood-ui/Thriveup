import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ALIGN_PHASES, type AlignPhase } from "@/components/align-phase-badge";
import {
  Search, Ear, Puzzle, Compass, Navigation, Star,
  Users, Building2, Globe, ArrowRight, TrendingUp,
  Heart, Zap, Target, AlertCircle
} from "lucide-react";
import alignLogo from "@assets/align-logo-optimized.webp";

const PHASE_ICONS = { assess: Search, listen: Ear, integrate: Puzzle, guide: Compass, navigate: Navigation, thrive: Star };

const COMMUNITY_THRIVE_INDICATORS = [
  { label: "Spirit", icon: Target,  color: "text-violet-600 dark:text-violet-400", desc: "Community values, cultural cohesion, shared purpose" },
  { label: "Soul",   icon: Heart,   color: "text-blue-600 dark:text-blue-400",     desc: "Relational trust, belonging, safety, mental health" },
  { label: "Body",   icon: Zap,     color: "text-emerald-600 dark:text-emerald-400",desc: "Housing, income, health outcomes, infrastructure" },
];

export default function AlignCommunityPage() {
  const { data: overview, isLoading } = useQuery<any>({
    queryKey: ["/api/align/community/overview"],
  });

  const phaseCounts: Record<string, number> = overview?.orgsByPhase ?? {};
  const totalOrgs: number = overview?.totalOrgs ?? 0;
  const coveredPhases: string[] = overview?.coveredPhases ?? [];
  const gapPhases = ALIGN_PHASES.filter((p) => !coveredPhases.includes(p.key));
  const individualCounts: Record<string, number> = overview?.individualsByPhase ?? {};
  const totalIndividuals: number = overview?.totalIndividuals ?? 0;

  return (
    <div className="min-h-screen bg-background" data-testid="page-align-community">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-10 pb-8 sm:px-6 text-center"
        style={{ background: "linear-gradient(160deg, #1e1b4b 0%, #064e3b 50%, #0f172a 100%)" }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-violet-600/15 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <img src={alignLogo} alt="ALIGN" className="w-16 h-16 rounded-full bg-white mx-auto mb-4 shadow-xl object-contain" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">ALIGN · Community Overview</p>
          <h1 className="text-xl sm:text-2xl font-black text-white mb-2" data-testid="text-community-headline">
            Collective THRIVE Dashboard
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            How is our community moving through the ALIGN journey — as individuals and as organizations?
            This is the view funders, policymakers, and evaluators need.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-8">

        {/* ── Individual journey stats ─────────────────────────────── */}
        <div data-testid="section-individual-stats">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Individual Journeys
            </p>
            {totalIndividuals > 0 && <Badge variant="secondary" className="ml-auto text-[10px]">{totalIndividuals} total</Badge>}
          </div>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ALIGN_PHASES.map((p) => (
                <div key={p.key} className="h-16 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {ALIGN_PHASES.map((p) => {
                const Icon = PHASE_ICONS[p.key as AlignPhase];
                const count = individualCounts[p.key] ?? 0;
                const pct = totalIndividuals > 0 ? Math.round((count / totalIndividuals) * 100) : 0;
                return (
                  <div key={p.key} className={`rounded-xl border p-3 text-center ${p.bg}`} data-testid={`stat-individual-${p.key}`}>
                    <Icon className={`h-4 w-4 mx-auto mb-1 ${p.color}`} />
                    <p className={`text-lg font-black ${p.color}`}>{count}</p>
                    <p className="text-[9px] text-muted-foreground">{p.label}</p>
                    {totalIndividuals > 0 && <p className="text-[9px] text-muted-foreground">{pct}%</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Organizational phase map ─────────────────────────────── */}
        <div data-testid="section-org-stats">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Organizations by Phase
            </p>
            {totalOrgs > 0 && <Badge variant="secondary" className="ml-auto text-[10px]">{totalOrgs} orgs assessed</Badge>}
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {ALIGN_PHASES.map((p) => <div key={p.key} className="h-12 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : totalOrgs === 0 ? (
            <div className="rounded-xl border bg-card p-6 text-center">
              <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold">No organizational assessments yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                When organizations complete their ALIGN assessment, their phase data appears here.
              </p>
              <Link href="/align/org-assessment">
                <Button size="sm" className="gap-1" data-testid="button-start-org-empty">
                  <Building2 className="h-3 w-3" /> Assess Your Organization
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {ALIGN_PHASES.map((p) => {
                const Icon = PHASE_ICONS[p.key as AlignPhase];
                const count = phaseCounts[p.key] ?? 0;
                const pct = totalOrgs > 0 ? Math.round((count / totalOrgs) * 100) : 0;
                return (
                  <div key={p.key} className={`flex items-center gap-3 rounded-xl border p-3 ${p.bg}`} data-testid={`bar-org-${p.key}`}>
                    <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${p.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${p.color}`} />
                    </div>
                    <p className={`text-xs font-semibold w-20 flex-shrink-0 ${p.color}`}>{p.label}</p>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-current rounded-full transition-all" style={{ width: `${pct}%`, color: "currentColor" }} />
                    </div>
                    <p className={`text-xs font-bold w-8 text-right ${p.color}`}>{count}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Gap analysis ─────────────────────────────────────────── */}
        {gapPhases.length > 0 && (
          <div data-testid="section-gaps">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Community Gaps — No Organizational Coverage
              </p>
            </div>
            <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                These ALIGN phases have no organization currently claiming coverage in this community.
                These are the funding and partnership gaps.
              </p>
              <div className="flex flex-wrap gap-2">
                {gapPhases.map((p) => {
                  const Icon = PHASE_ICONS[p.key as AlignPhase];
                  return (
                    <div key={p.key} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${p.bg}`} data-testid={`badge-gap-${p.key}`}>
                      <Icon className={`h-3 w-3 ${p.color}`} />
                      <span className={`text-xs font-semibold ${p.color}`}>{p.label}</span>
                    </div>
                  );
                })}
              </div>
              <Link href="/align/org-assessment">
                <Button size="sm" variant="outline" className="gap-1" data-testid="button-fill-gap">
                  <Building2 className="h-3 w-3" /> Does your org fill a gap?
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ── Community Spirit·Soul·Body ────────────────────────────── */}
        <div data-testid="section-community-dimensions">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Community Spirit · Soul · Body
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COMMUNITY_THRIVE_INDICATORS.map((ind) => {
              const Icon = ind.icon;
              const score = overview?.communityScores?.[ind.label.toLowerCase()] ?? null;
              return (
                <Card key={ind.label} className="border" data-testid={`card-community-${ind.label.toLowerCase()}`}>
                  <CardContent className="pt-4 space-y-2 text-center">
                    <Icon className={`h-5 w-5 mx-auto ${ind.color}`} />
                    <p className="font-semibold text-sm">{ind.label}</p>
                    <p className="text-[10px] text-muted-foreground">{ind.desc}</p>
                    {score !== null
                      ? <p className={`text-xl font-black ${ind.color}`}>{score}/100</p>
                      : <p className="text-xs text-muted-foreground italic">Data will appear as orgs complete assessments</p>
                    }
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── CTAs ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t pt-6" data-testid="section-community-ctas">
          <Link href="/align/org-assessment">
            <Card className="border hover:border-primary/50 transition-colors cursor-pointer" data-testid="card-cta-org">
              <CardContent className="pt-4 space-y-2">
                <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <p className="font-semibold text-sm">Assess Your Organization</p>
                <p className="text-[10px] text-muted-foreground">Add your org's ALIGN data to the community picture.</p>
                <p className={`text-xs font-medium flex items-center gap-1 text-indigo-600 dark:text-indigo-400`}>
                  Start <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/align/my-journey">
            <Card className="border hover:border-primary/50 transition-colors cursor-pointer" data-testid="card-cta-individual">
              <CardContent className="pt-4 space-y-2">
                <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <p className="font-semibold text-sm">My Individual Journey</p>
                <p className="text-[10px] text-muted-foreground">Track your personal ALIGN progress.</p>
                <p className={`text-xs font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400`}>
                  View <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/thrive">
            <Card className="border hover:border-primary/50 transition-colors cursor-pointer" data-testid="card-cta-thrive">
              <CardContent className="pt-4 space-y-2">
                <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <p className="font-semibold text-sm">THRIVE</p>
                <p className="text-[10px] text-muted-foreground">Empower · Activate · Grow · Uplift · Serve.</p>
                <p className={`text-xs font-medium flex items-center gap-1 text-amber-600 dark:text-amber-400`}>
                  See pathways <ArrowRight className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

      </div>
    </div>
  );
}
