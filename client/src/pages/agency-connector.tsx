import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Circle, ArrowRight, ArrowLeft, Zap, Eye,
  Code2, Copy, AlertTriangle, Globe, Users, TrendingUp,
  BookOpen, Shield, Send, Puzzle, RefreshCw, ChevronRight,
  CheckSquare, Square, Key, Mail,
} from "lucide-react";

// ── Types mirrored from the server ───────────────────────────────────────────
interface EndpointRec {
  id: string;
  label: string;
  method: "GET" | "POST";
  path: string;
  scope: string;
  description: string;
  returnsSummary: string;
  score: number;
  matchedKeywords: string[];
  rationale: string;
  gap?: string;
}

interface PreviewResult {
  ok: boolean;
  data?: any;
  error?: string;
  gap?: string;
}

interface CodeResult {
  javascript: string;
  python: string;
  curl: string;
  embed: string;
}

// ── Endpoint icon map ─────────────────────────────────────────────────────────
const EP_ICONS: Record<string, typeof Globe> = {
  benefits: Shield,
  community: Users,
  impact: TrendingUp,
  "community-story": BookOpen,
  students: BookOpen,
  "early-warnings": AlertTriangle,
  "foster-refer": Send,
  push: Send,
  "embed-portal": Globe,
};

const STEPS = ["Your Organization", "Recommended Endpoints", "Live Preview", "Get the Code"] as const;

// ── Org type options ──────────────────────────────────────────────────────────
const ORG_TYPES = [
  "Direct Service Nonprofit",
  "Workforce Board / WIB",
  "School / Youth-Serving Org",
  "Funder / Foundation",
  "Government Agency",
  "Child Welfare Agency",
  "Faith-Based Organization",
  "Research / Advocacy Org",
  "Intermediary / Backbone Org",
  "Community Development Corp",
  "Other",
];

// ── Clipboard helper ──────────────────────────────────────────────────────────
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(code).then(() =>
      toast({ title: "Copied!", description: `${lang} snippet copied to clipboard.` })
    );
  };
  return (
    <div className="relative">
      <pre className="bg-gray-950 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto max-h-96 overflow-y-auto leading-relaxed">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2 h-7 text-xs bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
        onClick={copy}
      >
        <Copy className="h-3 w-3 mr-1" /> Copy
      </Button>
    </div>
  );
}

// ── Known Gap notice ──────────────────────────────────────────────────────────
const MEDIAN_EARNINGS_NOTE = `Hello ThriveUp team,

We're integrating with the Partner API and noticed that the medianEarnings field in the /api/partner/v1/impact response consistently returns null. Our Intel layer relies on this to cite wage outcomes for funders and county workforce boards.

Could you confirm whether medianEarnings has been wired up on your side, or when we might expect it to be populated?

Thank you,
[Your name]`;

function GapBanner({ gap }: { gap: string }) {
  const { toast } = useToast();
  const isEarnings = gap.toLowerCase().includes("medianearnings");
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">Known Data Gap</p>
        <p className="text-xs text-amber-700 mt-0.5">{gap}</p>
        {isEarnings && (
          <Button
            size="sm"
            variant="outline"
            className="mt-2 h-7 text-xs border-amber-300 text-amber-800 hover:bg-amber-100"
            onClick={() => {
              navigator.clipboard.writeText(MEDIAN_EARNINGS_NOTE).then(() =>
                toast({ title: "Note copied", description: "Paste it into an email to ThriveUp." })
              );
            }}
          >
            <Copy className="h-3 w-3 mr-1" /> Copy note to send ThriveUp
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 60 ? "bg-emerald-500" : score >= 30 ? "bg-blue-500" : "bg-gray-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{score}%</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AgencyConnectorPage() {
  const { toast } = useToast();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);

  // ── Step 1: Profile ─────────────────────────────────────────────────────────
  const [orgName, setOrgName]     = useState("");
  const [mission, setMission]     = useState("");
  const [orgType, setOrgType]     = useState("");
  const [location, setLocation]   = useState("");
  const [accentColor, setAccentColor] = useState("#1a6faf");

  // ── Step 2: Recommendations ─────────────────────────────────────────────────
  const [recommendations, setRecommendations] = useState<EndpointRec[]>([]);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);

  // ── Step 3: Preview ─────────────────────────────────────────────────────────
  const [previews, setPreviews]   = useState<Record<string, PreviewResult>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());

  // ── Step 4: Code ────────────────────────────────────────────────────────────
  const [code, setCode]           = useState<CodeResult | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  // ── Step 4: Key request ─────────────────────────────────────────────────────
  const [contactEmail, setContactEmail] = useState("");
  const [requestingKey, setRequestingKey] = useState(false);
  const [issuedKey, setIssuedKey]         = useState<string | null>(null);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const analyzeMission = useCallback(async () => {
    if (!mission.trim()) { toast({ title: "Mission required", description: "Tell us what your organisation does.", variant: "destructive" }); return; }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/agency-connector/mission-map", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mission, orgName, orgType, location }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setRecommendations(data.recommendations || []);
      // Auto-select top 3 scored above 20%
      const autoSel = (data.recommendations as EndpointRec[])
        .filter(r => r.score >= 20)
        .slice(0, 5)
        .map(r => r.id);
      setSelected(new Set(autoSel));
      setStep(1);
    } catch (e: any) {
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  }, [mission, orgName, orgType, location, toast]);

  const toggleEndpoint = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const loadPreviews = useCallback(async () => {
    setStep(2);
    const toLoad = [...selected].filter(id => !previews[id]);
    if (!toLoad.length) return;
    setLoadingPreviews(new Set(toLoad));
    await Promise.all(toLoad.map(async id => {
      try {
        const res = await fetch(`/api/agency-connector/preview/${id}?location=${encodeURIComponent(location || "28472")}`);
        const data = await res.json();
        setPreviews(prev => ({ ...prev, [id]: data }));
      } catch {
        setPreviews(prev => ({ ...prev, [id]: { ok: false, error: "Preview unavailable" } }));
      } finally {
        setLoadingPreviews(prev => { const n = new Set(prev); n.delete(id); return n; });
      }
    }));
  }, [selected, location, previews]);

  const generateCode = useCallback(async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch("/api/agency-connector/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointIds: [...selected], orgName, location, color: accentColor }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCode(await res.json());
      setStep(3);
    } catch (e: any) {
      toast({ title: "Code generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingCode(false);
    }
  }, [selected, orgName, location, accentColor, toast]);

  // ── Step header ─────────────────────────────────────────────────────────────
  const selectedRecs = recommendations.filter(r => selected.has(r.id));
  const hasGap = selectedRecs.some(r => r.gap);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* ── Hero ── */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3 text-blue-300 text-sm font-medium">
            <Puzzle className="h-4 w-4" />
            ThriveUp Partner API
          </div>
          <h1 className="text-3xl font-bold mb-2">Agency Connector</h1>
          <p className="text-blue-100 text-lg max-w-2xl">
            Describe your organisation's mission. We'll identify which ThriveUp data endpoints fit,
            show you live data previews, and generate copy-paste integration code for your stack.
          </p>
        </div>
      </div>

      {/* ── Step indicator ── */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-1">
                <button
                  className={`flex items-center gap-1.5 text-sm px-2 py-1 rounded transition-colors ${
                    i === step ? "text-blue-700 font-semibold" :
                    i < step  ? "text-emerald-600 cursor-pointer hover:bg-emerald-50" :
                    "text-gray-400 cursor-default"
                  }`}
                  onClick={() => i < step ? setStep(i) : undefined}
                  disabled={i > step}
                >
                  {i < step
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : i === step
                      ? <Circle className="h-4 w-4 text-blue-600 fill-blue-100" />
                      : <Circle className="h-4 w-4 text-gray-300" />
                  }
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 0 — Organisation Profile
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tell us about your organisation</h2>
              <p className="text-gray-500 mt-1">
                Paste your mission statement and we'll score every ThriveUp endpoint against it instantly.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="orgName">Organisation name</Label>
                <Input
                  id="orgName"
                  placeholder="Emergency Charitable Services of NC"
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orgType">Organisation type</Label>
                <select
                  id="orgType"
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={orgType}
                  onChange={e => setOrgType(e.target.value)}
                >
                  <option value="">Select one…</option>
                  {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Primary service area (ZIP or county)</Label>
                <Input
                  id="location"
                  placeholder="28472 or Columbus County, NC"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Brand colour (for embed widget)</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    placeholder="#1a6faf"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mission">Mission statement *</Label>
              <Textarea
                id="mission"
                rows={5}
                placeholder="ECS of NC provides emergency assistance, including food, shelter, housing, utility help, and referrals to partner services for families in Brunswick, Bladen, Columbus, Pender, and New Hanover counties."
                value={mission}
                onChange={e => setMission(e.target.value)}
                className="resize-none"
              />
              <p className="text-xs text-gray-400">Paste your actual mission statement for the best match. More detail = better recommendations.</p>
            </div>

            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={analyzeMission}
                disabled={analyzing || !mission.trim()}
                className="bg-blue-700 hover:bg-blue-800"
              >
                {analyzing ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing…</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" /> Analyze Mission <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 1 — Recommended Endpoints
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended endpoints</h2>
                <p className="text-gray-500 mt-1">
                  Scored against your mission. Select the ones that fit — then we'll pull live data.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{selected.size} endpoint{selected.size !== 1 ? "s" : ""} selected</p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setSelected(new Set(recommendations.map(r => r.id)))}
                >
                  Select all
                </Button>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {recommendations.map(rec => {
                const Icon = EP_ICONS[rec.id] || Puzzle;
                const isSelected = selected.has(rec.id);
                return (
                  <div
                    key={rec.id}
                    onClick={() => toggleEndpoint(rec.id)}
                    className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${isSelected ? "text-blue-600" : "text-gray-400"}`}>
                        {isSelected
                          ? <CheckSquare className="h-5 w-5" />
                          : <Square className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Icon className="h-4 w-4 text-gray-500 shrink-0" />
                          <span className="font-semibold text-gray-900">{rec.label}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.method} {rec.path}
                          </Badge>
                          <Badge
                            className={`text-xs ${
                              rec.scope === "public" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                            }`}
                            variant="secondary"
                          >
                            {rec.scope}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                        <ScoreBar score={rec.score} />
                        {rec.rationale && (
                          <p className="text-xs text-gray-500 mt-2 italic">{rec.rationale}</p>
                        )}
                        {rec.gap && (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                            ⚠ Known gap: {rec.gap}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={loadPreviews}
                disabled={!selected.size}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview {selected.size} endpoint{selected.size !== 1 ? "s" : ""}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 2 — Live Preview
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Live data preview</h2>
                <p className="text-gray-500 mt-1">
                  Real responses from the ThriveUp Partner API, pulled right now for your location.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>

            {hasGap && (
              <GapBanner gap={selectedRecs.find(r => r.gap)!.gap!} />
            )}

            {selectedRecs.length > 0 && (
              <Tabs defaultValue={selectedRecs[0].id}>
                <TabsList className="flex-wrap h-auto gap-1 bg-gray-100 p-1">
                  {selectedRecs.map(rec => (
                    <TabsTrigger key={rec.id} value={rec.id} className="text-xs">
                      {rec.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {selectedRecs.map(rec => {
                  const preview = previews[rec.id];
                  const loading = loadingPreviews.has(rec.id);
                  return (
                    <TabsContent key={rec.id} value={rec.id} className="space-y-3 mt-4">
                      {/* endpoint meta */}
                      <div className="flex flex-wrap gap-2 items-center text-sm">
                        <Badge variant="outline" className="font-mono">{rec.method} {rec.path}</Badge>
                        <Badge variant="secondary" className="text-xs">{rec.scope}</Badge>
                      </div>

                      {rec.gap && <GapBanner gap={rec.gap} />}

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Returns</CardTitle>
                          <CardDescription className="text-xs">{rec.returnsSummary}</CardDescription>
                        </CardHeader>
                      </Card>

                      {loading ? (
                        <div className="bg-gray-950 rounded-lg p-6 flex items-center gap-3 text-gray-400 text-sm">
                          <RefreshCw className="h-4 w-4 animate-spin" /> Fetching live data…
                        </div>
                      ) : preview ? (
                        preview.ok ? (
                          <CodeBlock
                            code={JSON.stringify(
                              // Truncate large arrays to first 2 items for readability
                              truncateResponse(preview.data),
                              null, 2
                            )}
                            lang="JSON"
                          />
                        ) : (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                            <strong>Preview failed:</strong> {preview.error}
                          </div>
                        )
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setLoadingPreviews(prev => new Set([...prev, rec.id]));
                            try {
                              const res = await fetch(`/api/agency-connector/preview/${rec.id}?location=${encodeURIComponent(location || "28472")}`);
                              const data = await res.json();
                              setPreviews(prev => ({ ...prev, [rec.id]: data }));
                            } finally {
                              setLoadingPreviews(prev => { const n = new Set(prev); n.delete(rec.id); return n; });
                            }
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" /> Load preview
                        </Button>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                onClick={generateCode}
                disabled={generatingCode || !selected.size}
                className="bg-blue-700 hover:bg-blue-800"
              >
                {generatingCode ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Building…</>
                ) : (
                  <><Code2 className="h-4 w-4 mr-2" /> Get integration code <ArrowRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            STEP 3 — Get the Code
        ══════════════════════════════════════════════════════════════════════ */}
        {step === 3 && code && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your integration code</h2>
                <p className="text-gray-500 mt-1">
                  Copy into your project. Swap <code className="bg-gray-100 px-1 rounded text-xs">YOUR_TCAF_PARTNER_KEY</code> with the key ThriveUp issues you.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            </div>

            {hasGap && (
              <GapBanner gap={selectedRecs.find(r => r.gap)!.gap!} />
            )}

            {/* Partner key — self-service */}
            {issuedKey ? (
              <Card className="border-emerald-300 bg-emerald-50">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-semibold text-emerald-800">Your partner key is ready</p>
                  </div>
                  <p className="text-xs text-emerald-700">
                    A copy has been emailed to <strong>{contactEmail}</strong>. Keep this key private — do not commit it to version control.
                  </p>
                  <div className="relative">
                    <pre className="bg-white border border-emerald-200 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 break-all pr-20">
                      {issuedKey}
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 h-7 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                      onClick={() => {
                        navigator.clipboard.writeText(issuedKey);
                        toast({ title: "Key copied!", description: "Paste it in place of YOUR_TCAF_PARTNER_KEY." });
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Replace <code className="bg-gray-100 px-1 rounded">YOUR_TCAF_PARTNER_KEY</code> in the code below with this value.
                  </p>
                  <div className="pt-1">
                    <Button
                      className="w-full bg-emerald-700 hover:bg-emerald-800 h-9 text-sm"
                      onClick={() => {
                        window.location.href = `/partner-dashboard?key=${encodeURIComponent(issuedKey)}`;
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" /> Open your live dashboard →
                    </Button>
                    <p className="text-xs text-center text-gray-400 mt-1.5">
                      Your community data, benefits catalog, and impact reports — no setup required.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-600 shrink-0" />
                    <p className="text-sm font-semibold text-blue-800">Get your partner key instantly</p>
                  </div>
                  <p className="text-xs text-blue-700">
                    Enter your contact email and we'll generate a <code className="bg-blue-100 px-0.5 rounded">tcaf_*</code> key
                    scoped to the endpoints you selected — no waiting, no back-and-forth.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="your@org.email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        className="pl-9 bg-white border-blue-200 text-sm"
                      />
                    </div>
                    <Button
                      className="bg-blue-700 hover:bg-blue-800 shrink-0"
                      disabled={requestingKey || !contactEmail.includes("@")}
                      onClick={async () => {
                        setRequestingKey(true);
                        try {
                          const res = await fetch("/api/agency-connector/request-key", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              orgName,
                              orgEmail: contactEmail,
                              orgType,
                              location,
                              endpointIds: [...selected],
                              color: accentColor,
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Failed");
                          setIssuedKey(data.key);
                          toast({ title: "Key issued!", description: "Copy it above and paste into your code." });
                        } catch (e: any) {
                          toast({ title: "Could not issue key", description: e.message, variant: "destructive" });
                        } finally {
                          setRequestingKey(false);
                        }
                      }}
                    >
                      {requestingKey ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Issuing…</>
                      ) : (
                        <><Key className="h-4 w-4 mr-2" /> Get my key</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="javascript">
              <TabsList className="bg-gray-100">
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="curl">curl</TabsTrigger>
                <TabsTrigger value="embed">Embed Widget</TabsTrigger>
              </TabsList>

              <TabsContent value="javascript" className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Works in any browser or Node.js environment. No SDK needed.</p>
                <CodeBlock code={code.javascript} lang="JavaScript" />
              </TabsContent>

              <TabsContent value="python" className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Requires <code className="bg-gray-100 px-1 rounded">pip install requests</code>.</p>
                <CodeBlock code={code.python} lang="Python" />
              </TabsContent>

              <TabsContent value="curl" className="mt-4">
                <p className="text-xs text-gray-500 mb-2">Test from terminal. Requires <code className="bg-gray-100 px-1 rounded">jq</code> for pretty-printing.</p>
                <CodeBlock code={code.curl} lang="curl" />
              </TabsContent>

              <TabsContent value="embed" className="mt-4">
                <p className="text-xs text-gray-500 mb-2">
                  Drop this one snippet into your HTML. No partner key required for the public widget.
                  The button appears bottom-right and opens a full community portal overlay.
                </p>
                <CodeBlock code={code.embed} lang="HTML" />
                <div className="mt-3 bg-gray-50 border rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Live preview</p>
                  <iframe
                    src={`/embed/community-portal?location=${encodeURIComponent(location || "28472")}&org=${encodeURIComponent(orgName || "Your Organization")}&color=${encodeURIComponent(accentColor || "#1a6faf")}`}
                    className="w-full rounded border bg-white"
                    style={{ height: 360 }}
                    title="Community portal preview"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* What's included summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Endpoints in this package</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="divide-y">
                  {selectedRecs.map(rec => (
                    <div key={rec.id} className="py-2 flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{rec.label}</p>
                        <p className="text-xs text-gray-500">{rec.path} · scope: {rec.scope}</p>
                        {rec.gap && (
                          <p className="text-xs text-amber-600 mt-0.5">⚠ {rec.gap}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                Start over
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const allCode = `${code.javascript}\n\n---\n\n${code.curl}`;
                  navigator.clipboard.writeText(allCode);
                  toast({ title: "All code copied!", description: "JS + curl snippets copied." });
                }}
              >
                <Copy className="h-4 w-4 mr-1" /> Copy all
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function truncateResponse(data: any): any {
  if (!data || typeof data !== "object") return data;
  const result: any = Array.isArray(data) ? [] : {};
  for (const [k, v] of Object.entries(data)) {
    if (Array.isArray(v) && v.length > 2) {
      result[k] = [...v.slice(0, 2), `… (${v.length - 2} more)`];
    } else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      result[k] = truncateResponse(v);
    } else {
      result[k] = v;
    }
  }
  return result;
}
