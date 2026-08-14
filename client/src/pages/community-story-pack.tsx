/**
 * Community Story Pack
 *
 * One page that turns any geography + optional org profile into:
 *   • Live data story (disclosed public-data estimates, TCAF scores, narrative)
 *   • Matched grant opportunities (via Grant Conduit)
 *   • Downloadable PDF report
 *   • Downloadable HTML presentation (open in browser → Print to PDF = slides)
 *   • Shareable public link + <iframe> embed code
 *
 * ECS, El Buen Samaritano, any org: fill in your geography, hit Generate.
 */

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Globe, MapPin, Users, TrendingUp, FileText, Download, Share2,
  Sparkles, BarChart3, AlertTriangle, CheckCircle2, ArrowRight,
  Copy, ExternalLink, Presentation, BookOpen, Target, Activity,
  Building2, DollarSign, Shield,
} from "lucide-react";
import { CommunityEvidencePanel } from "@/components/community-evidence-panel";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Demographics {
  totalPopulation: number;
  povertyRate: number;
  uninsuredRate: number;
  unemploymentRate: number;
  housingCostBurden: number;
  singleParentRate: number;
  noHighSchoolDiploma: number;
  medianIncome: number;
  disabilityRate: number;
  ageUnder17: number;
  age65Plus: number;
}

interface SystemScore {
  score: number;
  grade: string;
  label: string;
  keyGap: string;
  urgency?: string;
}

interface Opportunity {
  title?: string;
  name?: string;
  agency?: string;
  funder?: string;
  maxAward?: number;
  amount?: string;
  deadline?: string;
  matchScore?: number;
  focusArea?: string;
}

interface StoryPack {
  generatedAt: string;
  brief: {
    geography: { displayName: string; zip?: string; state?: string; countyName?: string };
    evidence?: any;
    demographics: Demographics;
    systemsScores: Record<string, SystemScore>;
    overallScore: number;
    overallGrade: string;
    atRiskPopulations: Array<{ name: string; estimated: number; unit?: string }>;
    narrative: string;
    solutions?: { grants?: unknown[]; topInterventions?: string[] };
  };
  grant: {
    readiness?: { score: number; grade: string; gaps?: string[] };
    cedsRegion?: { name: string; goals?: string[] };
    matchedOpportunities?: Opportunity[];
    gunViolence?: { incidents: number; victims: number; fatalities: number; windowDays: number };
    narratives?: Record<string, string>;
    rpliceEvidence?: unknown[];
  } | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtPct(v?: number) {
  if (v == null || isNaN(v)) return "—";
  return `${Number(v).toFixed(1)}%`;
}
function fmtDollar(n?: number) {
  if (!n) return "—";
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}
function gradeColor(grade?: string) {
  if (!grade) return "bg-gray-100 text-gray-700";
  if (grade === "A") return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (grade === "B") return "bg-blue-100 text-blue-700 border-blue-300";
  if (grade === "C") return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-rose-100 text-rose-700 border-rose-300";
}

function StatCard({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-xl p-4 text-center border ${warn ? "bg-rose-50 border-rose-200" : "bg-emerald-50 border-emerald-200"}`}>
      <div className={`text-2xl font-black ${warn ? "text-rose-700" : "text-emerald-700"}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function ScoreBar({ label, score, grade, gap }: { label: string; score: number; grade: string; gap?: string }) {
  const color = grade === "A" ? "bg-emerald-500" : grade === "B" ? "bg-blue-500" : grade === "C" ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <Badge variant="outline" className={`text-xs ${gradeColor(grade)}`}>{grade} · {Math.round(score)}/100</Badge>
      </div>
      <Progress value={score} className="h-2" />
      {gap && <p className="text-xs text-muted-foreground">{gap}</p>}
    </div>
  );
}

// ── Focus area tags ───────────────────────────────────────────────────────────
const FOCUS_AREAS = [
  "housing", "food security", "emergency relief", "healthcare",
  "education", "workforce", "reentry", "mental health", "childcare",
  "violence prevention", "economic mobility", "immigration",
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommunityStoryPackPage() {
  const { toast } = useToast();

  // Form state
  const [location, setLocation]       = useState("");
  const [orgName, setOrgName]         = useState("");
  const [orgType, setOrgType]         = useState("nonprofit");
  const [focusAreas, setFocusAreas]   = useState<string[]>([]);
  const [missionText, setMissionText] = useState("");
  const [withGrants, setWithGrants]   = useState(true);

  // Result state
  const [story, setStory]   = useState<StoryPack | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl]   = useState<string | null>(null);

  const toggleFocus = (a: string) =>
    setFocusAreas((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  // ── Generate story ──────────────────────────────────────────────────────────
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/community-story/pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          orgName: orgName.trim() || undefined,
          orgType,
          focusAreas,
          missionText: missionText.trim() || undefined,
          includeGrantData: withGrants,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error ?? "Generation failed");
      }
      return res.json() as Promise<StoryPack>;
    },
    onSuccess: (data) => {
      setStory(data);
      setShareId(null);
      setEmbedCode(null);
      toast({ title: "Story ready", description: "Your community story has been assembled." });
    },
    onError: (err: Error) => {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    },
  });

  // ── PDF download ────────────────────────────────────────────────────────────
  // Some mobile browsers (iOS Safari in certain contexts, in-app webviews like
  // Instagram/Facebook browser) silently ignore a synthetic <a download> click
  // or block window.open(). We keep the generated blob URL around and surface
  // a persistent, tappable fallback link so the report is never unreachable —
  // the user can manually open/save it even if the automatic download didn't fire.
  const [pdfFallbackUrl, setPdfFallbackUrl] = useState<{ url: string; filename: string } | null>(null);
  const pdfMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/community-story/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          orgName: orgName.trim() || undefined,
          orgType,
          focusAreas,
          missionText: missionText.trim() || undefined,
          includeGrantData: withGrants,
        }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const geo = story?.brief?.geography;
      const filename = `community-story-${(geo?.displayName ?? location).replace(/[^a-z0-9]/gi, "-").slice(0, 50)}.pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      // Don't revoke immediately — some mobile browsers process the download
      // asynchronously and a too-early revoke breaks it. Keep the URL alive
      // and offer a manual fallback link; revoke once the user navigates away
      // or triggers another export.
      setPdfFallbackUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url, filename };
      });
    },
    onError: () => toast({ title: "PDF failed", description: "Could not generate the PDF. Please try again.", variant: "destructive" }),
  });

  useEffect(() => {
    return () => {
      if (pdfFallbackUrl) URL.revokeObjectURL(pdfFallbackUrl.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Presentation download ───────────────────────────────────────────────────
  const presentMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/community-story/presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location.trim(),
          orgName: orgName.trim() || undefined,
          orgType,
          focusAreas,
          missionText: missionText.trim() || undefined,
          includeGrantData: withGrants,
        }),
      });
      if (!res.ok) throw new Error("Presentation generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `community-story-${location.replace(/[^a-z0-9]/gi, "-").slice(0, 40)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: () => toast({ title: "Presentation failed", variant: "destructive" }),
  });

  // ── Share / embed ───────────────────────────────────────────────────────────
  const shareMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/community-story/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story, location: location.trim(), orgName: orgName.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Share creation failed");
      return res.json() as Promise<{ shareId: string; shareUrl: string; embedCode: string }>;
    },
    onSuccess: (data) => {
      setShareId(data.shareId);
      setShareUrl(data.shareUrl);
      setEmbedCode(data.embedCode);
      toast({ title: "Share link created", description: "Anyone with the link can view this story." });
    },
    onError: (err: Error) => toast({ title: "Share failed", description: err.message, variant: "destructive" }),
  });

  const brief = story?.brief;
  const grant = story?.grant;
  const demo  = brief?.demographics;
  const geo   = brief?.geography;

  return (
    <div className="container max-w-6xl py-8 px-4 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Globe className="h-4 w-4" />
          <span>TCAF · Community Story Pack</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Community Story Pack</h1>
        <p className="text-muted-foreground max-w-2xl">
          Enter any geography and we'll assemble a complete community data story — disclosed public-data estimates,
          TCAF-derived social-determinant scores, matched grant opportunities, and an AI-drafted narrative —
          packaged as a PDF report, presentation deck, and shareable/embeddable page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT: Form ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Geography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>ZIP/ZCTA, city, county, or multi-county service area *</Label>
                <Input
                  placeholder="e.g. 28472  or  Columbus County, NC"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  ZIPs are reported as Census ZCTAs. A city request may resolve to a disclosed ZCTA rather than citywide data.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Organization (optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label>Organization name</Label>
                <Input
                  placeholder="e.g. Emergency Charitable Services (NC)"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Organization type</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nonprofit">501(c)(3) Nonprofit</SelectItem>
                    <SelectItem value="government">Government Agency</SelectItem>
                    <SelectItem value="faith">Faith-Based Organization</SelectItem>
                    <SelectItem value="coalition">Coalition / Consortium</SelectItem>
                    <SelectItem value="university">University / College</SelectItem>
                    <SelectItem value="tribal">Tribal Nation</SelectItem>
                    <SelectItem value="rural">Rural Community / CoC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Mission statement <span className="text-muted-foreground">(unlocks AI narratives)</span></Label>
                <Textarea
                  placeholder="Describe your organization's mission and the community you serve…"
                  rows={3}
                  value={missionText}
                  onChange={(e) => setMissionText(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => toggleFocus(area)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      focusAreas.includes(area)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withGrants}
                  onChange={(e) => setWithGrants(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Include grant intelligence</span>
              </label>
              <p className="text-xs text-muted-foreground mt-1 ml-6">
                Adds CEDS regional data, matched funding opportunities, and RPLICE evidence
              </p>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            onClick={() => generateMutation.mutate()}
            disabled={!location.trim() || generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <><Activity className="h-4 w-4 mr-2 animate-pulse" /> Generating story…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Community Story</>
            )}
          </Button>

          {story && (
            <div className="space-y-2">
              <Separator />
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Export & Share</p>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => pdfMutation.mutate()}
                  disabled={pdfMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2 text-primary" />
                  {pdfMutation.isPending ? "Generating PDF…" : "Download PDF Report"}
                </Button>
                {pdfFallbackUrl && (
                  <a
                    href={pdfFallbackUrl.url}
                    download={pdfFallbackUrl.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground underline underline-offset-2 px-1"
                    data-testid="link-pdf-fallback"
                  >
                    PDF generated — if the download didn't start automatically, tap here to open it
                  </a>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => presentMutation.mutate()}
                  disabled={presentMutation.isPending}
                >
                  <Presentation className="h-4 w-4 mr-2 text-primary" />
                  {presentMutation.isPending ? "Building slides…" : "Download Presentation"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareMutation.mutate()}
                  disabled={shareMutation.isPending}
                >
                  <Share2 className="h-4 w-4 mr-2 text-primary" />
                  {shareMutation.isPending ? "Creating link…" : "Create Share / Embed Link"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open("/loi-writer", "_blank")}
                >
                  <ArrowRight className="h-4 w-4 mr-2 text-primary" />
                  Open LOI Writer
                </Button>
              </div>

              {/* Share output */}
              {shareUrl && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="pt-4 space-y-3">
                    <p className="text-xs font-semibold text-emerald-800">Public share link (30 days)</p>
                    <div className="flex gap-2">
                      <Input value={shareUrl} readOnly className="text-xs h-8" />
                      <Button size="sm" variant="outline" className="h-8 shrink-0"
                        onClick={() => navigator.clipboard.writeText(shareUrl).then(() =>
                          toast({ title: "Copied!" }))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-semibold text-emerald-800">Embed code (for your website)</p>
                    <div className="flex gap-2">
                      <Input value={embedCode ?? ""} readOnly className="text-xs h-8" />
                      <Button size="sm" variant="outline" className="h-8 shrink-0"
                        onClick={() => navigator.clipboard.writeText(embedCode ?? "").then(() =>
                          toast({ title: "Copied!" }))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Paste the embed code on any page (your website, grant portal, partner site)
                      to show this community story in an iframe.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Story output ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Empty state */}
          {!story && !generateMutation.isPending && (
            <Card className="border-dashed">
              <CardContent className="py-20 text-center space-y-4">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-semibold text-lg">Your community story will appear here</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Enter a geography and hit Generate. Works for any ZIP code, city, or county in the US.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  {["28472 — Whiteville, Columbus County NC", "78741 — East Austin TX", "60619 — South Side Chicago IL"].map((ex) => (
                    <button
                      key={ex}
                      className="px-3 py-1 rounded-full border hover:border-primary hover:text-primary transition-colors"
                      onClick={() => setLocation(ex.split(" — ")[0])}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading state */}
          {generateMutation.isPending && (
            <Card>
              <CardContent className="py-20 text-center space-y-4">
                <Activity className="h-10 w-10 text-primary mx-auto animate-pulse" />
                <p className="font-semibold">Assembling your community story…</p>
                <p className="text-sm text-muted-foreground">
                  Pulling disclosed public-data estimates, TCAF scores, grant opportunities, and AI narratives.
                  This takes 15–30 seconds.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Story output */}
          {story && brief && (
            <Tabs defaultValue="overview">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="grants" disabled={!grant}>Grants</TabsTrigger>
                <TabsTrigger value="narrative">Narrative</TabsTrigger>
              </TabsList>

              {/* ── Overview tab ─────────────────────────────────────────── */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Location header */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{geo?.countyName ?? geo?.state ?? ""}</span>
                        </div>
                        <h2 className="text-2xl font-bold">{geo?.displayName ?? location}</h2>
                        {orgName && <p className="text-muted-foreground mt-0.5">{orgName}</p>}
                      </div>
                      <div className="text-center shrink-0">
                        <Badge variant="outline" className={`text-2xl font-black px-4 py-2 ${gradeColor(brief.overallGrade)}`}>
                          {brief.overallGrade}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{brief.overallScore}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <CommunityEvidencePanel evidence={brief.evidence} />

                {/* Key stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    label="Population"
                    value={demo?.totalPopulation != null ? Number(demo.totalPopulation).toLocaleString() : "—"}
                  />
                  <StatCard
                    label="Poverty Rate"
                    value={fmtPct(demo?.povertyRate)}
                    warn={(demo?.povertyRate ?? 0) > 15}
                  />
                  <StatCard
                    label="Uninsured"
                    value={fmtPct(demo?.uninsuredRate)}
                    warn={(demo?.uninsuredRate ?? 0) > 10}
                  />
                  <StatCard
                    label="Unemployed"
                    value={fmtPct(demo?.unemploymentRate)}
                    warn={(demo?.unemploymentRate ?? 0) > 8}
                  />
                </div>

                {/* At-risk populations */}
                {brief.atRiskPopulations?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> At-Risk Populations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {brief.atRiskPopulations.map((p, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{p.name}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Grant readiness */}
                {grant?.readiness && (
                  <Card className="border-emerald-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center shrink-0">
                          <Badge variant="outline" className={`text-xl font-bold px-3 py-1 ${gradeColor(grant.readiness.grade)}`}>
                            {grant.readiness.grade}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-0.5">Grant Readiness</p>
                        </div>
                        <div className="flex-1">
                          <Progress value={grant.readiness.score} className="h-2 mb-2" />
                          <p className="text-xs text-muted-foreground">{grant.readiness.score}/100 — {grant.readiness.gaps?.slice(0,2).join(" · ")}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Gun violence context */}
                {grant?.gunViolence && grant.gunViolence.incidents > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-sm text-red-800">Community Safety Context</span>
                        <Badge variant="outline" className="text-red-700 border-red-300 text-xs">
                          {grant.gunViolence.incidents} incidents · {grant.gunViolence.windowDays}d window
                        </Badge>
                      </div>
                      <p className="text-xs text-red-700">
                        {grant.gunViolence.victims} victims · {grant.gunViolence.fatalities} fatalities —
                        triggers funding eligibility for violence prevention grants
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Data tab ─────────────────────────────────────────────── */}
              <TabsContent value="data" className="space-y-4 mt-4">

                {/* Demographics table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" /> Demographics (observed public-data estimates)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {[
                        ["Poverty Rate",             fmtPct(demo?.povertyRate)],
                        ["Unemployment Rate",         fmtPct(demo?.unemploymentRate)],
                        ["Uninsured Rate",            fmtPct(demo?.uninsuredRate)],
                        ["Housing Cost Burden",       fmtPct(demo?.housingCostBurden)],
                        ["Single-Parent Households",  fmtPct(demo?.singleParentRate)],
                        ["No High School Diploma",    fmtPct(demo?.noHighSchoolDiploma)],
                        ["Disability Rate",           fmtPct(demo?.disabilityRate)],
                        ["Children Under 17",         fmtPct(demo?.ageUnder17)],
                        ["Adults 65+",                fmtPct(demo?.age65Plus)],
                        ["Median Household Income",   demo?.medianIncome ? fmtDollar(demo.medianIncome) : "—"],
                      ].map(([label, val], i) => (
                        <div key={i} className={`flex justify-between py-2 px-2 rounded text-sm ${i % 2 === 0 ? "bg-muted/40" : ""}`}>
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Systems scores */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" /> Systems Health Scores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(brief.systemsScores).map(([key, s]) => (
                      <ScoreBar
                        key={key}
                        label={s.label ?? key}
                        score={s.score}
                        grade={s.grade}
                        gap={s.keyGap}
                      />
                    ))}
                  </CardContent>
                </Card>

                {/* CEDS region */}
                {grant?.cedsRegion && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-blue-700" />
                        <span className="font-semibold text-sm text-blue-900">
                          CEDS Region: {grant.cedsRegion.name}
                        </span>
                      </div>
                      {grant.cedsRegion.goals && (
                        <ul className="space-y-1">
                          {grant.cedsRegion.goals.slice(0, 4).map((g, i) => (
                            <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                              <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" /> {g}
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Grants tab ────────────────────────────────────────────── */}
              <TabsContent value="grants" className="space-y-3 mt-4">
                {grant?.matchedOpportunities?.length ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {grant.matchedOpportunities.length} opportunities matched to this community's profile and focus areas.
                    </p>
                    {grant.matchedOpportunities.map((opp, i) => (
                      <Card key={i} className="border-l-4 border-l-emerald-400">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{opp.title ?? opp.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {opp.agency ?? opp.funder}
                                {opp.deadline ? ` · Deadline: ${opp.deadline}` : ""}
                                {opp.focusArea ? ` · ${opp.focusArea}` : ""}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              {opp.maxAward && (
                                <Badge variant="outline" className="text-emerald-700 border-emerald-300">
                                  <DollarSign className="h-3 w-3 mr-0.5" />
                                  {fmtDollar(opp.maxAward)}
                                </Badge>
                              )}
                              {opp.matchScore && (
                                <p className="text-xs text-muted-foreground mt-1">{opp.matchScore}% match</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Target className="h-8 w-8 mx-auto mb-2" />
                      <p>Enable "Include grant intelligence" and regenerate to see matched opportunities.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ── Narrative tab ─────────────────────────────────────────── */}
              <TabsContent value="narrative" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-primary" /> Community Narrative
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {brief.narrative}
                    </p>
                  </CardContent>
                </Card>

                {/* AI narratives from grant conduit */}
                {grant?.narratives && Object.entries(grant.narratives)
                  .filter(([, v]) => v && String(v).length > 50)
                  .map(([key, val]) => (
                    <Card key={key}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          {key === "problemStatement" ? "Problem Statement"
                           : key === "solutionApproach" ? "Solution Approach"
                           : key === "communityNeed" ? "Community Need"
                           : key === "evidenceBase" ? "Evidence Base"
                           : key}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-muted-foreground">{String(val)}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7 text-xs"
                          onClick={() => navigator.clipboard.writeText(String(val)).then(() =>
                            toast({ title: "Copied to clipboard" }))}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </CardContent>
                    </Card>
                  ))}

                {/* RPLICE evidence */}
                {grant?.rpliceEvidence && Array.isArray(grant.rpliceEvidence) && grant.rpliceEvidence.length > 0 && (
                  <Card className="border-blue-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" /> RPLICE Evidence Base
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(grant.rpliceEvidence as Record<string, unknown>[]).slice(0, 5).map((ev, i) => (
                        <div key={i} className="text-xs p-2 bg-blue-50 rounded border border-blue-100">
                          <span className="font-medium">{String(ev.title ?? ev.name ?? "Evidence")}</span>
                          {Boolean(ev.summary) && <span className="text-muted-foreground"> — {String(ev.summary).slice(0, 120)}</span>}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* ── Partner API note ─────────────────────────────────────────────────── */}
      <Card className="border-dashed bg-muted/30">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">External organizations — connect via Partner API</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Organizations like ECS can call{" "}
                <code className="bg-muted px-1 rounded text-xs">GET /api/partner/v1/community-story?location=28472</code>{" "}
                with their ecosystem key to get this data in JSON — for their own grant applications,
                websites, or county reports. Contact TCAF to request a partner key.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
