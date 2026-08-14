import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CommunityEvidencePanel } from "@/components/community-evidence-panel";
import {
  LayoutDashboard, Key, Building2, MapPin, Users, TrendingUp,
  Shield, FileText, Download, Copy, RefreshCw, AlertTriangle,
  CheckCircle2, ChevronRight, Globe, Briefcase, Award, LogOut,
  BarChart3, BookOpen, Zap,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = "partnerDashboardAuth";

// ── Types ─────────────────────────────────────────────────────────────────────
interface AuthState {
  key: string;
  orgName: string;
  orgEmail: string | null;
  location: string;
  scopes: string[];
  keyPrefix: string;
}

interface TabData<T = any> {
  status: "idle" | "loading" | "ok" | "error";
  data?: T;
  error?: string;
}

// ── Grade helpers ─────────────────────────────────────────────────────────────
function gradeColor(grade: string | null | undefined): string {
  if (!grade) return "bg-gray-100 text-gray-500";
  const g = grade.toUpperCase();
  if (g === "A") return "bg-green-100 text-green-800 border-green-300";
  if (g === "B") return "bg-blue-100 text-blue-800 border-blue-300";
  if (g === "C") return "bg-yellow-100 text-yellow-800 border-yellow-300";
  if (g === "D") return "bg-orange-100 text-orange-700 border-orange-300";
  if (g === "F") return "bg-red-100 text-red-800 border-red-300";
  return "bg-gray-100 text-gray-500 border-gray-200";
}

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${Number(n).toFixed(1)}%`;
}

// ── Scope badge ───────────────────────────────────────────────────────────────
function ScopeBadge({ scope }: { scope: string }) {
  const colors: Record<string, string> = {
    "benefits:read":  "bg-green-100 text-green-800",
    "community:read": "bg-blue-100 text-blue-800",
    "inbound:write":  "bg-purple-100 text-purple-800",
    "impact:read":    "bg-orange-100 text-orange-800",
    "content:read":   "bg-gray-100 text-gray-700",
  };
  const cls = colors[scope] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold font-mono ${cls}`}>
      {scope}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color = "blue",
}: {
  icon: typeof LayoutDashboard; label: string; value: string; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:   "bg-blue-50 border-blue-200 text-blue-700",
    green:  "bg-green-50 border-green-200 text-green-700",
    red:    "bg-red-50 border-red-200 text-red-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    amber:  "bg-amber-50 border-amber-200 text-amber-700",
  };
  const ring = colors[color] ?? colors.blue;
  return (
    <Card className="border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${ring}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// ── Key entry screen ──────────────────────────────────────────────────────────
function KeyEntryScreen({
  onAuth,
}: {
  onAuth: (state: AuthState) => void;
}) {
  const { toast } = useToast();
  const [key, setKey] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!key.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/partner-dashboard/auth", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: key.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Authentication failed");
      const state: AuthState = {
        key: key.trim(),
        orgName:   data.orgName,
        orgEmail:  data.orgEmail ?? null,
        location:  data.location,
        scopes:    data.scopes ?? [],
        keyPrefix: data.keyPrefix,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      onAuth(state);
    } catch (e: any) {
      toast({ title: "Connection failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [key, onAuth, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white/80 text-sm font-medium mb-4">
            <LayoutDashboard className="h-4 w-4" />
            ThriveUp Partner Dashboard
          </div>
          <h1 className="text-3xl font-bold text-white">Your organization's data, ready.</h1>
          <p className="text-blue-200 mt-2 text-sm leading-relaxed">
            Enter your partner key to access live community intelligence, benefits data,
            and impact reporting for your service area.
          </p>
        </div>

        {/* Card */}
        <Card className="border-0 shadow-2xl">
          <CardContent className="pt-6 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" /> Partner key
              </label>
              <Input
                type="password"
                placeholder="tcaf_…"
                value={key}
                onChange={e => setKey(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleConnect()}
                className="font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-400">
                Your <code className="bg-gray-100 px-1 rounded">tcaf_*</code> key — issued when you completed the Agency Connector
              </p>
            </div>

            <Button
              className="w-full bg-blue-700 hover:bg-blue-800"
              disabled={loading || !key.trim().startsWith("tcaf_")}
              onClick={handleConnect}
            >
              {loading ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Connecting…</>
              ) : (
                <><ChevronRight className="h-4 w-4 mr-2" /> Open my dashboard</>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400">
              Don't have a key?{" "}
              <a href="/agency-connector" className="text-blue-600 hover:underline font-medium">
                Get one in 60 seconds →
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ auth, story }: { auth: AuthState; story: TabData }) {
  const geo   = story.data?.brief?.geography ?? {};
  const brief = story.data?.brief ?? {};
  const demo  = brief.demographics ?? {};

  // Support both indicators array and flat demographics object
  const indicators: any[] = brief.indicators ?? [];
  const povertyInd = indicators.find((i: any) =>
    (i.label ?? i.name ?? "").toLowerCase().includes("poverty"),
  );
  const povertyRate = povertyInd?.value ?? demo.povertyRate ?? null;
  const popRaw = geo.population ?? geo.totalPopulation ?? demo.totalPopulation ?? null;
  const overallGrade = brief.overallGrade ?? brief.grade ?? null;

  return (
    <div className="space-y-6">
      {/* Welcome card */}
      <Card className="bg-gradient-to-r from-blue-700 to-blue-600 border-0 text-white">
        <CardContent className="pt-6 pb-5">
          <div className="flex items-start gap-3">
            <Building2 className="h-6 w-6 mt-0.5 opacity-80 shrink-0" />
            <div>
              <p className="text-sm text-blue-200 font-medium">Connected as</p>
              <h2 className="text-xl font-bold">{auth.orgName}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-blue-200 text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {auth.location}
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {auth.scopes.map(s => (
              <span key={s} className="bg-white/20 text-white text-xs font-mono px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {story.status === "loading" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      )}
      {story.status === "ok" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon={MapPin}
            label="Service area"
            value={geo.displayName ?? auth.location}
            sub={geo.county ? `${geo.county}, ${geo.state ?? ""}` : undefined}
            color="blue"
          />
          <StatCard
            icon={Users}
            label="Population served"
            value={popRaw ? fmt(popRaw) : "—"}
            sub="Census ACS 5-year estimate"
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Poverty rate"
            value={povertyRate != null ? pct(povertyRate) : "—"}
            sub={povertyInd ? `Grade ${povertyInd.grade ?? "—"}` : "Census ACS 5-year estimate"}
            color={povertyRate != null && povertyRate > 18 ? "red" : "green"}
          />
        </div>
      )}
      {story.status === "error" && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {story.error ?? "Could not load community data. Check your key or try again."}
        </div>
      )}

      {/* Quick actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">What you can do here</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2.5">
          {[
            { icon: Globe,   tab: "community", label: "View your Community Story", sub: "Disclosed public-data estimates, TCAF-derived scores, grant matches" },
            { icon: Shield,  tab: "benefits",  label: "Browse the Benefits Catalog", sub: "Live programs your clients can apply for right now" },
            { icon: BarChart3, tab: "impact",   label: "See your Impact Numbers", sub: "Participants served, employment outcomes, credentials" },
            { icon: FileText, tab: "reports",  label: "Download a Funder Report", sub: "Grant-ready PDF with community data and outcomes" },
          ].map(({ icon: Icon, label, sub, tab }) => (
            <div key={tab} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{label}</p>
                <p className="text-xs text-gray-500">{sub}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Community tab ─────────────────────────────────────────────────────────────
function CommunityTab({ story }: { story: TabData }) {
  if (story.status === "loading") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-24" />
      </div>
    );
  }
  if (story.status === "error" || !story.data) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {story.error ?? "Community data unavailable."}
      </div>
    );
  }

  const { toast } = useToast();
  const brief      = story.data?.brief ?? {};
  const geo        = brief.geography ?? {};
  const demo       = brief.demographics ?? {};
  const indicators: any[] = brief.indicators ?? [];
  const narratives = brief.narratives ?? brief.narrative ?? {};
  const grantCount = (story.data?.grant?.opportunities ?? story.data?.grant ?? []);
  const grantN     = Array.isArray(grantCount) ? grantCount.length : 0;
  const overallGrade = brief.overallGrade ?? brief.grade ?? null;

  // If no indicators array, synthesize from flat demographics
  const syntheticIndicators = indicators.length === 0 && Object.keys(demo).length > 0
    ? [
        demo.povertyRate     != null ? { label: "Poverty rate",       value: demo.povertyRate,     displayValue: `${Number(demo.povertyRate).toFixed(1)}%`,  grade: demo.povertyRate > 20 ? "F" : demo.povertyRate > 15 ? "D" : demo.povertyRate > 10 ? "C" : "B", source: "Observed public-data estimate" } : null,
        demo.unemploymentRate != null ? { label: "Unemployment",      value: demo.unemploymentRate, displayValue: `${Number(demo.unemploymentRate).toFixed(1)}%`, source: "Observed public-data estimate" } : null,
        demo.medianIncome    != null ? { label: "Median income",      value: demo.medianIncome,    displayValue: `$${fmt(demo.medianIncome)}`, source: "Observed public-data estimate" } : null,
        demo.uninsuredRate != null ? { label: "Uninsured",            value: demo.uninsuredRate,    displayValue: `${Number(demo.uninsuredRate).toFixed(1)}%`, source: "Observed public-data estimate" } : null,
        demo.singleParentRate != null ? { label: "Single-parent HH", value: demo.singleParentRate, displayValue: `${Number(demo.singleParentRate).toFixed(1)}%`, source: "Observed public-data estimate" } : null,
        demo.noHighSchoolDiploma != null ? { label: "Below HS diploma", value: demo.noHighSchoolDiploma, displayValue: `${Number(demo.noHighSchoolDiploma).toFixed(1)}%`, source: "Observed public-data estimate" } : null,
      ].filter(Boolean) as any[]
    : indicators;

  const narrativeText =
    typeof narratives === "string"
      ? narratives
      : narratives.demographics ?? narratives.need ?? narratives.overview
        ?? (Object.keys(demo).length > 0
          ? `${geo.displayName ?? "This community"} has a poverty rate of ${demo.povertyRate != null ? demo.povertyRate.toFixed(1) + "%" : "—"}${demo.totalPopulation ? " with a population of " + fmt(demo.totalPopulation) : ""}. ${demo.unemploymentRate != null ? `The unemployment rate is ${demo.unemploymentRate.toFixed(1)}%.` : ""}${demo.medianIncome != null ? ` Median household income is $${fmt(demo.medianIncome)}.` : ""}`
          : "");

  return (
    <div className="space-y-5">
      {/* Geography header */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-lg">{geo.displayName ?? "Your Service Area"}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                {geo.population && <span>Population: <strong>{fmt(geo.population)}</strong></span>}
                {geo.medianIncome && <span>Median income: <strong>${fmt(geo.medianIncome)}</strong></span>}
                {overallGrade && (
                  <span>
                    Community grade:{" "}
                    <span className={`inline-block font-bold px-1.5 rounded ${gradeColor(overallGrade)}`}>
                      {overallGrade}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CommunityEvidencePanel evidence={brief.evidence} compact />

      {/* SDOH indicator grid */}
      {(syntheticIndicators.length > 0 || indicators.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Social Determinants of Health — By Domain</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(syntheticIndicators.length > 0 ? syntheticIndicators : indicators).slice(0, 12).map((ind: any, i: number) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-600 truncate pr-2">
                      {ind.label ?? ind.name ?? "Indicator"}
                    </p>
                    {ind.grade && (
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${gradeColor(ind.grade)}`}>
                        {ind.grade}
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {ind.displayValue ?? (ind.value != null
                      ? (typeof ind.value === "number" && ind.value < 1 && ind.value > 0
                          ? pct(ind.value * 100)
                          : ind.value > 100 ? `$${fmt(ind.value)}` : pct(ind.value))
                      : "—")}
                  </p>
                  {ind.source && <p className="text-xs text-gray-400 mt-0.5">{ind.source}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demographics narrative */}
      {narrativeText && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">AI-synthesized demographics narrative</CardTitle>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(narrativeText);
                  toast({ title: "Copied!", description: "Paste into your grant proposal's Statement of Need." });
                }}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy for proposal
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-700 leading-relaxed">{narrativeText}</p>
          </CardContent>
        </Card>
      )}

      {/* Grant matches */}
      {grantN > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            <strong>{grantN} funding opportunities</strong> matched to your community's documented needs —
            see the <strong>Reports</strong> tab to generate a full grant package.
          </span>
        </div>
      )}
    </div>
  );
}

// ── Benefits tab ──────────────────────────────────────────────────────────────
function BenefitsTab({ benefits }: { benefits: TabData }) {
  if (benefits.status === "loading") {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
    );
  }
  if (benefits.status === "error" || !benefits.data) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {benefits.error ?? "Benefits catalog unavailable."}
      </div>
    );
  }

  const programs: any[] = benefits.data?.programs ?? [];
  const count = benefits.data?.count ?? programs.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{count} active programs</h3>
        <Badge variant="outline" className="text-xs">Live catalog</Badge>
      </div>

      <div className="space-y-3">
        {programs.map((prog: any, i: number) => (
          <Card key={prog.id ?? i}>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="h-4 w-4 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900 text-sm">{prog.title}</h4>
                    {prog.status && (
                      <Badge
                        className={`text-xs shrink-0 ${
                          prog.status === "active" ? "bg-green-100 text-green-800" :
                          prog.status === "waitlist" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {prog.status}
                      </Badge>
                    )}
                  </div>
                  {prog.description && (
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{prog.description}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-500">
                    {prog.targetPopulation && <span>Target: {prog.targetPopulation}</span>}
                    {prog.geographicFocus && <span>Area: {prog.geographicFocus}</span>}
                    {prog.methodology && <span>Method: {prog.methodology}</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400 text-center">
        Catalog updated continuously · Source: ThriveUp Partner API /benefits
      </p>
    </div>
  );
}

// ── Impact tab ────────────────────────────────────────────────────────────────
function ImpactTab({ impact }: { impact: TabData }) {
  if (impact.status === "loading") {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (impact.status === "error" || !impact.data) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
        {impact.error ?? "Impact data unavailable."}
      </div>
    );
  }

  const totals   = impact.data?.totals ?? {};
  const outcomes: any[] = impact.data?.outcomes ?? [];

  return (
    <div className="space-y-5">
      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Participants served"
          value={fmt(totals.participantsServed)}
          color="blue"
        />
        <StatCard
          icon={Briefcase}
          label="Entered employment"
          value={fmt(totals.enteredEmployment)}
          color="green"
        />
        <StatCard
          icon={Award}
          label="Credentials attained"
          value={fmt(totals.credentialsAttained)}
          color="purple"
        />
      </div>

      {/* medianEarnings gap notice */}
      <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          <strong>Median earnings</strong> — this field is not yet wired in ThriveUp's impact endpoint.
          All other outcome metrics above are live.
        </span>
      </div>

      {/* Outcomes table */}
      {outcomes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Outcome records ({outcomes.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-2 pr-3 font-semibold text-gray-500 whitespace-nowrap">Org / Program</th>
                  <th className="py-2 pr-3 font-semibold text-gray-500 text-right whitespace-nowrap">Served</th>
                  <th className="py-2 pr-3 font-semibold text-gray-500 text-right whitespace-nowrap">Completed</th>
                  <th className="py-2 font-semibold text-gray-500 whitespace-nowrap">Period</th>
                </tr>
              </thead>
              <tbody>
                {outcomes.slice(0, 20).map((o: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 pr-3 text-gray-800">
                      <div className="font-medium">{o.orgName ?? "—"}</div>
                      <div className="text-gray-400">{o.programName ?? ""}</div>
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-700">{fmt(o.participantsServed)}</td>
                    <td className="py-2 pr-3 text-right text-gray-700">{fmt(o.participantsCompleted)}</td>
                    <td className="py-2 text-gray-500">{o.reportingPeriod ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {outcomes.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">
          No outcome records yet. Submit outcomes via <code className="bg-gray-100 px-1 rounded">POST /partner/v1/heartbeat</code> or the foster youth referral endpoint.
        </div>
      )}
    </div>
  );
}

// ── Reports tab ───────────────────────────────────────────────────────────────
function ReportsTab({ auth, story }: { auth: AuthState; story: TabData }) {
  const { toast } = useToast();
  const [generatingPdf,   setGeneratingPdf]   = useState(false);
  const [shareUrl,        setShareUrl]         = useState<string | null>(null);
  const [generatingShare, setGeneratingShare]  = useState(false);
  const [revoking,        setRevoking]         = useState(false);

  const downloadPdf = useCallback(async () => {
    setGeneratingPdf(true);
    try {
      const res = await fetch("/api/partner-dashboard/report-pdf", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "x-tcaf-key": auth.key },
        body:    JSON.stringify({ location: auth.location }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `community-report-${auth.orgName.replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: "PDF failed", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingPdf(false);
    }
  }, [auth, toast]);

  const narratives = story.data?.brief?.narratives ?? story.data?.brief?.narrative ?? {};
  const narrativeText =
    typeof narratives === "string"
      ? narratives
      : narratives.demographics ?? narratives.need ?? narratives.overview ?? "";

  const generateShare = useCallback(async () => {
    setGeneratingShare(true);
    try {
      const res = await fetch("/api/partner-dashboard/share/generate", {
        method: "POST",
        headers: { "x-tcaf-key": auth.key },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setShareUrl(data.shareUrl);
    } catch (e: any) {
      toast({ title: "Could not generate link", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingShare(false);
    }
  }, [auth.key, toast]);

  const revokeShare = useCallback(async () => {
    setRevoking(true);
    try {
      const res = await fetch("/api/partner-dashboard/share/revoke", {
        method: "DELETE",
        headers: { "x-tcaf-key": auth.key },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setShareUrl(null);
      toast({ title: "Share link revoked", description: "The public link is no longer active." });
    } catch (e: any) {
      toast({ title: "Could not revoke", description: e.message, variant: "destructive" });
    } finally {
      setRevoking(false);
    }
  }, [auth.key, toast]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600">
        Download funder-ready reports, copy grant-narrative text, and share a public view with funders or board members.
      </p>

      {/* PDF download */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Community Intelligence Report (PDF)</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                A formatted PDF for {auth.location} — demographics, SDOH indicators, matched grants,
                and evidence base. Ready to attach to any letter of intent.
              </p>
              <Button
                className="mt-3 bg-blue-700 hover:bg-blue-800 h-8 text-xs"
                onClick={downloadPdf}
                disabled={generatingPdf}
              >
                {generatingPdf ? (
                  <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Generating…</>
                ) : (
                  <><Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grant narrative copy */}
      {narrativeText && (
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                <Copy className="h-5 w-5 text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Statement of Need — copy to proposal</h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-2 leading-relaxed">
                  This paragraph is sourced directly from Census ACS data for your service area. Paste it into any grant proposal's "Statement of Need" section.
                </p>
                <div className="bg-gray-50 border rounded-lg p-3 text-xs text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                  {narrativeText}
                </div>
                <Button
                  variant="outline"
                  className="mt-2 h-7 text-xs border-green-300 text-green-800 hover:bg-green-50"
                  onClick={() => {
                    navigator.clipboard.writeText(narrativeText);
                    toast({ title: "Copied!", description: "Paste it into your grant proposal." });
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy paragraph
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Share link */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Share with your board or a funder</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-3 leading-relaxed">
                Generate a public read-only link anyone can open — community data, SDOH indicators, benefits catalog.
                Your partner key stays private.
              </p>
              {shareUrl ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2">
                    <span className="text-xs font-mono text-gray-700 truncate flex-1">{shareUrl}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast({ title: "Link copied!", description: "Anyone with this link can view your dashboard." });
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">Anyone with this link can view your dashboard — no key required.</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0 px-2"
                      onClick={revokeShare}
                      disabled={revoking}
                    >
                      {revoking ? <><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Revoking…</> : "Revoke link"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                  onClick={generateShare}
                  disabled={generatingShare}
                >
                  {generatingShare
                    ? <><RefreshCw className="h-3 w-3 mr-1.5 animate-spin" /> Generating…</>
                    : <><Globe className="h-3 w-3 mr-1.5" /> Generate share link</>}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Embed instructions */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">Embed ThriveUp on your website</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-2 leading-relaxed">
                Add a "Get Help" portal button to your website with one script tag — no key required.
                Your visitors get a community story, benefits screener, grants tab, and Navigator AI.
              </p>
              <Button
                variant="outline"
                className="h-7 text-xs"
                onClick={() => window.open("/widget-install", "_blank")}
              >
                <Zap className="h-3 w-3 mr-1" /> View embed instructions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PartnerDashboardPage() {
  const [, navigate] = useLocation();
  const { toast }    = useToast();

  const [auth, setAuth]         = useState<AuthState | null>(null);
  const [booting, setBooting]   = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Per-tab data
  const [story,    setStory]    = useState<TabData>({ status: "idle" });
  const [benefits, setBenefits] = useState<TabData>({ status: "idle" });
  const [impact,   setImpact]   = useState<TabData>({ status: "idle" });

  // ── Bootstrap: check URL param or localStorage ────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("key");

    if (urlKey && urlKey.startsWith("tcaf_")) {
      // Authenticate with key from URL param then clean the URL
      (async () => {
        try {
          const res  = await fetch("/api/partner-dashboard/auth", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ key: urlKey }),
          });
          const data = await res.json();
          if (res.ok) {
            const state: AuthState = {
              key: urlKey, orgName: data.orgName, orgEmail: data.orgEmail ?? null,
              location: data.location, scopes: data.scopes ?? [], keyPrefix: data.keyPrefix,
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            setAuth(state);
            window.history.replaceState({}, "", "/partner-dashboard");
          }
        } catch {}
        setBooting(false);
      })();
      return;
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const cached: AuthState = JSON.parse(stored);
        // Revalidate the cached key against the server so a stale or tampered
        // location value can't silently drive the wrong geography's community data.
        (async () => {
          try {
            const res  = await fetch("/api/partner-dashboard/auth", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ key: cached.key }),
            });
            if (res.ok) {
              const data = await res.json();
              // Always use the server-authoritative location/scopes; keep the cached key.
              const fresh: AuthState = {
                key:       cached.key,
                orgName:   data.orgName   ?? cached.orgName,
                orgEmail:  data.orgEmail  ?? cached.orgEmail ?? null,
                location:  data.location  ?? cached.location,
                scopes:    data.scopes    ?? cached.scopes ?? [],
                keyPrefix: data.keyPrefix ?? cached.keyPrefix,
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
              setAuth(fresh);
            } else {
              // Key is no longer valid — clear the stale session.
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            // Network failure: fall back to the cached state so offline users
            // aren't logged out unexpectedly, but do not persist location changes.
            setAuth(cached);
          } finally {
            setBooting(false);
          }
        })();
        return;
      } catch {
        // JSON parse failed — clear the corrupt entry.
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setBooting(false);
  }, []);

  // ── Load community story as soon as we have auth ──────────────────────────
  const loadStory = useCallback(async (a: AuthState) => {
    if (story.status !== "idle") return;
    setStory({ status: "loading" });
    try {
      const res  = await fetch(
        `/api/partner-dashboard/community-story?location=${encodeURIComponent(a.location)}`,
        { headers: { "x-tcaf-key": a.key } },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setStory({ status: "ok", data });
    } catch (e: any) {
      setStory({ status: "error", error: e.message });
    }
  }, [story.status]);

  const loadBenefits = useCallback(async (a: AuthState) => {
    if (benefits.status !== "idle") return;
    setBenefits({ status: "loading" });
    try {
      const res  = await fetch("/api/partner-dashboard/benefits", {
        headers: { "x-tcaf-key": a.key },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setBenefits({ status: "ok", data });
    } catch (e: any) {
      setBenefits({ status: "error", error: e.message });
    }
  }, [benefits.status]);

  const loadImpact = useCallback(async (a: AuthState) => {
    if (impact.status !== "idle") return;
    setImpact({ status: "loading" });
    try {
      const res  = await fetch("/api/partner-dashboard/impact", {
        headers: { "x-tcaf-key": a.key },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setImpact({ status: "ok", data });
    } catch (e: any) {
      setImpact({ status: "error", error: e.message });
    }
  }, [impact.status]);

  // Load story immediately on auth; load others on tab switch
  useEffect(() => {
    if (auth) loadStory(auth);
  }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth) return;
    if (activeTab === "benefits") loadBenefits(auth);
    if (activeTab === "impact")   loadImpact(auth);
  }, [activeTab, auth]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
    setStory({ status: "idle" });
    setBenefits({ status: "idle" });
    setImpact({ status: "idle" });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!auth) {
    return (
      <KeyEntryScreen
        onAuth={state => {
          setAuth(state);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-medium mb-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              ThriveUp Partner Dashboard
            </div>
            <h1 className="text-xl font-bold text-white">{auth.orgName}</h1>
            <p className="text-blue-200 text-sm flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {auth.location}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex flex-wrap gap-1.5 justify-end">
              {auth.scopes.map(s => <ScopeBadge key={s} scope={s} />)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-200 hover:text-white hover:bg-white/10 h-8"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border shadow-sm mb-6 flex flex-wrap h-auto gap-0.5 p-1">
            {[
              { value: "overview",   label: "Overview",   icon: LayoutDashboard },
              { value: "community",  label: "Community",  icon: Globe },
              { value: "benefits",   label: "Benefits",   icon: Shield },
              { value: "impact",     label: "Impact",     icon: BarChart3 },
              { value: "reports",    label: "Reports",    icon: FileText },
            ].map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1.5 text-sm">
                <Icon className="h-3.5 w-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab auth={auth} story={story} />
          </TabsContent>
          <TabsContent value="community">
            <CommunityTab story={story} />
          </TabsContent>
          <TabsContent value="benefits">
            <BenefitsTab benefits={benefits} />
          </TabsContent>
          <TabsContent value="impact">
            <ImpactTab impact={impact} />
          </TabsContent>
          <TabsContent value="reports">
            <ReportsTab auth={auth} story={story} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
