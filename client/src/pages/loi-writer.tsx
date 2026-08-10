import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveStatusPill } from "@/components/autosave-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { SDOHImpactChain } from "@/components/sdoh-impact-chain";
import { DFCCrossNav } from "@/components/dfc-cross-nav";
import {
  FileText, Brain, Loader2, Copy, Printer, CheckCircle2,
  AlertTriangle, Target, Shield, Sparkles, BarChart3,
  RefreshCw, Award, TrendingUp, Zap, BookOpen, Star,
  ChevronDown, ChevronUp, Activity, Link2
} from "lucide-react";

function ScoreCard({ label, score, grade, color }: { label: string; score: number; grade?: string; color: string }) {
  return (
    <div className={`p-4 rounded-xl border-2 ${color} text-center`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-bold">{score}</p>
      {grade && <Badge className="mt-1">{grade}</Badge>}
    </div>
  );
}

function RPLICELens({ name, icon: Icon, data }: { name: string; icon: any; data: any }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  const scoreColor = data.score >= 80 ? "text-green-600" : data.score >= 65 ? "text-yellow-600" : "text-red-600";
  return (
    <div className="border rounded-xl overflow-hidden">
      <button className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors" onClick={() => setOpen(!open)}>
        <Icon className={`h-5 w-5 ${scoreColor}`} />
        <span className="font-bold text-sm flex-1">{name}</span>
        <Badge variant={data.score >= 80 ? "default" : data.score >= 65 ? "secondary" : "destructive"}>{data.score}/100 · {data.grade}</Badge>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t px-4 pb-4 pt-3 space-y-3">
          <div>
            <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Strengths</p>
            {data.strengths?.map((s: string, i: number) => <p key={i} className="text-xs flex items-start gap-1.5 mb-1"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /> {s}</p>)}
          </div>
          <div>
            <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">Gaps</p>
            {data.gaps?.map((g: string, i: number) => <p key={i} className="text-xs flex items-start gap-1.5 mb-1"><AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" /> {g}</p>)}
          </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <p className="text-xs"><strong>Recommendation:</strong> {data.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LOIWriterPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("loi");
  const [loiText, setLoiText] = useState("");
  const [loiSettings, setLoiSettings] = useState({ focus: "", tone: "", emphasize: "" });

  // Autosave the whole draft (text + settings) per user, scoped to "default"
  // since this writer is a single-bucket tool, not per-grant.
  const autosave = useAutosave<{ loiText: string; loiSettings: { focus: string; tone: string; emphasize: string } }>({
    editorKind: "loi_writer",
    value: { loiText, loiSettings },
    onHydrate: (saved) => {
      if (saved?.loiText) setLoiText(saved.loiText);
      if (saved?.loiSettings) setLoiSettings(saved.loiSettings);
    },
    shouldSave: (v) => v.loiText.length > 0 || v.loiSettings.focus.length > 0 || v.loiSettings.tone.length > 0 || v.loiSettings.emphasize.length > 0,
  });

  const loiMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/coalition/ai-loi", loiSettings);
      return res.json();
    },
    onSuccess: (data) => {
      setLoiText(data.loi);
    },
    onError: (err: any) => {
      toast({
        title: "LOI generation failed",
        description: err?.message || "Could not draft the LOI. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rpliceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/benefits/coalition/rplice-validation", {});
      return res.json();
    },
    onError: (err: any) => {
      toast({
        title: "Validation failed",
        description: err?.message || "Could not run the validation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const wordCount = loiText.split(/\s+/).filter(Boolean).length;
  const wordCountColor = wordCount === 0 ? "text-muted-foreground" : wordCount <= 520 && wordCount >= 480 ? "text-green-600" : wordCount > 520 ? "text-red-600" : "text-yellow-600";

  const v = rpliceMutation.data?.validation;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-background dark:to-purple-950/10" data-testid="loi-writer-page">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3 text-sm px-3 py-1">St. David's Foundation · LOI Due April 27</Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" data-testid="text-loi-title">LOI Writer & Validation</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            AI-powered LOI drafting with real Census data, plus RPLICE/CFIR 2.0/RE-AIM validation scoring.
          </p>
          <div className="mt-3 flex justify-center">
            <AutosaveStatusPill status={autosave.status} lastSavedAt={autosave.lastSavedAt} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-lg mx-auto">
            <TabsTrigger value="loi" data-testid="tab-loi"><FileText className="h-4 w-4 mr-2" /> 500-Word LOI</TabsTrigger>
            <TabsTrigger value="sdoh" data-testid="tab-sdoh"><Link2 className="h-4 w-4 mr-2" /> SDOH Chain</TabsTrigger>
            <TabsTrigger value="validation" data-testid="tab-validation"><Shield className="h-4 w-4 mr-2" /> RPLICE Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="loi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" /> LOI Generator</CardTitle>
                <CardDescription>Generate a 500-word LOI with real enrollment data from all 5 counties. Customize tone and emphasis below, or use defaults.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Focus Area</Label>
                    <Input value={loiSettings.focus} onChange={e => setLoiSettings({...loiSettings, focus: e.target.value})}
                      placeholder="e.g., Williamson County individual + Bastrop/Caldwell collaborative" data-testid="input-loi-focus" />
                  </div>
                  <div>
                    <Label>Tone</Label>
                    <Input value={loiSettings.tone} onChange={e => setLoiSettings({...loiSettings, tone: e.target.value})}
                      placeholder="e.g., Confident, community-centered, specific" data-testid="input-loi-tone" />
                  </div>
                  <div>
                    <Label>Emphasize</Label>
                    <Input value={loiSettings.emphasize} onChange={e => setLoiSettings({...loiSettings, emphasize: e.target.value})}
                      placeholder="e.g., Renewals, mixed-status families, rural access" data-testid="input-loi-emphasize" />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {[
                    { label: "Williamson Focus", focus: "Individual application for Williamson County with deep neighborhood specificity", tone: "Direct, data-driven, community-rooted", emphasize: "Pflugerville HQ, 135 census tracts, CHW deployment" },
                    { label: "Rural Equity", focus: "Collaborative for Bastrop and Caldwell — most isolated, least served", tone: "Urgent, empathetic, barrier-aware", emphasize: "Transportation barriers, 48% non-English, paper-first enrollment" },
                    { label: "Renewals First", focus: "Retention infrastructure — keeping enrolled families enrolled", tone: "Steady, experienced, systems-oriented", emphasize: "60-30-14 day renewal cascade, navigator continuity, barrier-matched renewal" },
                    { label: "Full Region", focus: "5-county technology backbone connecting 18 partners", tone: "Coalition-builder, integrative, data-centered", emphasize: "501 tracts, $3.2B unclaimed, no wrong door" },
                  ].map(preset => (
                    <Button key={preset.label} variant="outline" size="sm" onClick={() => setLoiSettings(preset)} data-testid={`button-preset-${preset.label.toLowerCase().replace(/\s/g, '-')}`}>
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <Button onClick={() => loiMutation.mutate()} disabled={loiMutation.isPending} size="lg" className="w-full" data-testid="button-generate-loi">
                  {loiMutation.isPending ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Drafting LOI with real Census data...</>
                  ) : loiText ? (
                    <><RefreshCw className="h-5 w-5 mr-2" /> Regenerate LOI</>
                  ) : (
                    <><Brain className="h-5 w-5 mr-2" /> Generate 500-Word LOI</>
                  )}
                </Button>

                {loiMutation.isError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 p-3 text-sm" data-testid="error-loi">
                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700 dark:text-red-400">Couldn't generate the LOI</p>
                      <p className="text-xs text-muted-foreground">{(loiMutation.error as any)?.message || "Please try again."}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => loiMutation.mutate()} data-testid="button-retry-loi">Retry</Button>
                  </div>
                )}

                {loiMutation.isSuccess && !loiText && !loiMutation.isPending && (
                  <p className="text-sm text-muted-foreground text-center" data-testid="empty-loi">
                    The generator returned no text. Adjust your inputs and try again.
                  </p>
                )}

                {loiMutation.data?.dataSnapshot && (
                  <div className="flex gap-3 flex-wrap justify-center">
                    <Badge variant="outline">Data: {loiMutation.data.dataSnapshot.totalEligible?.toLocaleString()} eligible</Badge>
                    <Badge variant="outline">{loiMutation.data.dataSnapshot.totalGap?.toLocaleString()} gap</Badge>
                    <Badge variant="outline">{loiMutation.data.dataSnapshot.totalTracts} tracts</Badge>
                    <Badge variant="outline">${(loiMutation.data.dataSnapshot.unclaimed / 1e9).toFixed(1)}B unclaimed</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {(loiText || loiMutation.isPending) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <CardTitle>Letter of Intent Draft</CardTitle>
                      <CardDescription>Edit directly below. This is YOUR draft — refine until it sounds like you.</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${wordCountColor}`} data-testid="text-word-count">{wordCount} words</span>
                      <Progress value={Math.min((wordCount / 500) * 100, 100)} className="w-24 h-3" />
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(loiText); toast({ title: "Copied!", description: "LOI copied to clipboard." }); }} data-testid="button-copy-loi">
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => window.print()} data-testid="button-print-loi">
                        <Printer className="h-3 w-3 mr-1" /> Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loiMutation.isPending ? (
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-3 text-muted-foreground">Drafting with real enrollment data...</span>
                    </div>
                  ) : (
                    <Textarea value={loiText} onChange={e => setLoiText(e.target.value)}
                      className="min-h-[500px] font-serif text-base leading-relaxed" data-testid="textarea-loi" />
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-bold text-sm flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> LOI Checklist (from St. David's webinar)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    "Leads with enrollment impact, not technology",
                    "Mentions renewals prominently (valued equally)",
                    "Addresses mixed-status families",
                    "Shows collaborative logic (why each partner type)",
                    "Geographic specificity (county/neighborhood level)",
                    "HHSC CPP pathway mentioned",
                    "Direct services emphasized over system strengthening",
                    "Real enrollment gap data included",
                    "Barrier-matched outreach approach",
                    "Sustainability beyond the 3-year grant",
                    "500 words or fewer",
                    "No budget details (concept only)",
                  ].map(item => (
                    <label key={item} className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                      <input type="checkbox" className="mt-1 rounded" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdoh" className="space-y-4">
            <SDOHImpactChain />
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            <Card className="border-purple-300 dark:border-purple-700 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
              <CardContent className="pt-6 text-center space-y-4">
                <Shield className="h-14 w-14 mx-auto text-purple-600" />
                <h2 className="text-2xl font-bold">RPLICE / CFIR 2.0 / RE-AIM Validation</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Run a rigorous implementation science validation of TCAF's proposal using three frameworks.
                  This identifies strengths, gaps, and specific actions to strengthen the LOI before submission.
                </p>
                <Button onClick={() => rpliceMutation.mutate()} disabled={rpliceMutation.isPending} size="lg" data-testid="button-run-validation">
                  {rpliceMutation.isPending ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Running validation (this takes ~30 seconds)...</>
                  ) : v ? (
                    <><RefreshCw className="h-5 w-5 mr-2" /> Re-run Validation</>
                  ) : (
                    <><Shield className="h-5 w-5 mr-2" /> Run RPLICE + CFIR 2.0 + RE-AIM Validation</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {rpliceMutation.isPending && (
              <Card>
                <CardContent className="flex items-center justify-center p-12" data-testid="pending-validation">
                  <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  <span className="ml-3 text-muted-foreground">Running RPLICE / CFIR 2.0 / RE-AIM validation…</span>
                </CardContent>
              </Card>
            )}

            {rpliceMutation.isError && (
              <Card className="border-red-300 dark:border-red-800">
                <CardContent className="flex items-start gap-2 p-4 text-sm" data-testid="error-validation">
                  <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-700 dark:text-red-400">Validation failed</p>
                    <p className="text-xs text-muted-foreground">{(rpliceMutation.error as any)?.message || "Please try again."}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => rpliceMutation.mutate()} data-testid="button-retry-validation">Retry</Button>
                </CardContent>
              </Card>
            )}

            {rpliceMutation.isSuccess && !v && !rpliceMutation.isPending && (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground" data-testid="empty-validation">
                  The validation returned no results. Please re-run it.
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => rpliceMutation.mutate()} data-testid="button-rerun-validation">Re-run Validation</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {v && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ScoreCard label="Overall Score" score={v.overallScore} grade={v.overallGrade} color="border-blue-300 dark:border-blue-700" />
                  <ScoreCard label="CFIR 2.0 Readiness" score={v.cfir2?.overallReadiness} color="border-purple-300 dark:border-purple-700" />
                  <ScoreCard label="RE-AIM Composite" score={v.ream?.composite} color="border-green-300 dark:border-green-700" />
                  <div className="p-4 rounded-xl border-2 border-orange-300 dark:border-orange-700 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Readiness</p>
                    <p className="text-lg font-bold">{v.readinessLevel}</p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" /> RPLICE Six-Lens Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <RPLICELens name="Research Lens" icon={BarChart3} data={v.rplice?.research} />
                    <RPLICELens name="Practice Lens" icon={Target} data={v.rplice?.practice} />
                    <RPLICELens name="Leadership Lens" icon={Award} data={v.rplice?.leadership} />
                    <RPLICELens name="Implementation Lens" icon={Zap} data={v.rplice?.implementation} />
                    <RPLICELens name="Community Lens" icon={Star} data={v.rplice?.community} />
                    <RPLICELens name="Evaluation Lens" icon={Activity} data={v.rplice?.evaluation} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-5 w-5" /> CFIR 2.0 Domains</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {v.cfir2 && Object.entries(v.cfir2).filter(([k]) => k !== "overallReadiness").map(([key, val]: [string, any]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                            <Badge variant={val.score >= 80 ? "default" : "secondary"}>{val.score}/100</Badge>
                          </div>
                          <Progress value={val.score} className="h-2" />
                          {val.findings?.slice(0, 2).map((f: string, i: number) => (
                            <p key={i} className="text-xs text-muted-foreground pl-2">· {f}</p>
                          ))}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5" /> RE-AIM Scoring</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {v.ream && Object.entries(v.ream).filter(([k]) => k !== "composite").map(([key, val]: [string, any]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">{key}</p>
                            <Badge variant={val.score >= 80 ? "default" : "secondary"}>{val.score}/100</Badge>
                          </div>
                          <Progress value={val.score} className="h-2" />
                          <p className="text-xs text-muted-foreground pl-2">{val.rationale}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Target className="h-5 w-5" /> Grant Alignment (St. David's Rubric)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {v.grantAlignment && Object.entries(v.grantAlignment).map(([key, val]: [string, any]) => (
                      <div key={key} className="p-4 rounded-xl border">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                          <Badge variant={val.score >= 80 ? "default" : val.score >= 65 ? "secondary" : "destructive"}>{val.score}/100</Badge>
                        </div>
                        <Progress value={val.score} className="h-2 mb-2" />
                        {val.evidence?.map((e: string, i: number) => (
                          <p key={i} className="text-xs flex items-start gap-1.5 mb-1"><CheckCircle2 className="h-3 w-3 text-green-600 shrink-0 mt-0.5" /> {e}</p>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-950/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-red-500" /> Critical Findings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {v.criticalFindings?.map((f: string, i: number) => (
                        <p key={i} className="text-sm flex items-start gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" /> {f}</p>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 dark:border-green-800 bg-green-50/30 dark:bg-green-950/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-5 w-5 text-green-600" /> LOI Strengthening Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {v.loiStrengtheningActions?.map((a: string, i: number) => (
                        <p key={i} className="text-sm flex items-start gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> {a}</p>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base"><Star className="h-5 w-5 text-blue-600" /> Top Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {v.topRecommendations?.map((r: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 mb-3 p-3 rounded-lg border bg-white dark:bg-background">
                        <Badge className="shrink-0 mt-0.5">{i + 1}</Badge>
                        <p className="text-sm">{r}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DFCCrossNav currentPage="loi-writer" />
      </div>
    </div>
  );
}
