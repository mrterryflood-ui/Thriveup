/**
 * Grant Conduit — Nationwide Intelligence Package Builder
 *
 * Any charitable org (nonprofit, university, government, rural community,
 * tribe, faith org, coalition) fills out a short profile and receives a
 * complete, evidence-backed grant intelligence package in one call.
 *
 * Backed by: CEDS regional data, RPLICE evidence, platform outcomes,
 * verified gun violence incident data, and AI-drafted narrative sections.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, MapPin, Target, FileText, Star, TrendingUp,
  AlertTriangle, CheckCircle2, Shield, Globe, Activity,
  Copy, ExternalLink, ChevronRight, Sparkles,
} from "lucide-react";

const ORG_TYPES = [
  { value: "nonprofit",  label: "501(c)(3) Nonprofit" },
  { value: "university", label: "University / College" },
  { value: "government", label: "Government Agency" },
  { value: "rural",      label: "Rural Community / CoC" },
  { value: "tribal",     label: "Tribal Nation / BIA" },
  { value: "faith",      label: "Faith-Based Organization" },
  { value: "coalition",  label: "Coalition / Consortium" },
];

const FOCUS_AREAS = [
  "workforce", "housing", "reentry", "mental health", "education",
  "childcare", "food security", "healthcare", "violence prevention",
  "economic mobility", "veteran services", "immigration",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

function isSafeSourceUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function GradeChip({ grade }: { grade: string }) {
  const color = grade === "A" ? "bg-emerald-100 text-emerald-700 border-emerald-300"
    : grade === "B" ? "bg-blue-100 text-blue-700 border-blue-300"
    : grade === "C" ? "bg-amber-100 text-amber-700 border-amber-300"
    : "bg-rose-100 text-rose-700 border-rose-300";
  return <Badge variant="outline" className={`text-lg font-bold px-3 py-1 ${color}`}>{grade}</Badge>;
}

function copyText(text: string): Promise<void> {
  if (!navigator.clipboard) return Promise.reject(new Error("Clipboard is unavailable"));
  return navigator.clipboard.writeText(text);
}

export default function GrantConduitPage() {
  const { toast } = useToast();

  // Form state
  const [orgType, setOrgType] = useState("nonprofit");
  const [orgName, setOrgName] = useState("");
  const [ein, setEin] = useState("");
  const [state, setState] = useState("TX");
  const [zip, setZip] = useState("");
  const [missionText, setMissionText] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [populations, setPopulations] = useState("");

  // Result
  const [result, setResult] = useState<any>(null);

  const toggleFocus = (area: string) =>
    setFocusAreas(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]);

  const packageMutation = useMutation({
    mutationFn: async () => {
      const body = {
        orgType,
        orgName: orgName.trim() || undefined,
        ein: ein.trim() || undefined,
        geography: { state, zip: zip.trim() || undefined },
        missionText: missionText.trim() || undefined,
        focusAreas,
        populationsServed: populations.trim()
          ? populations.split(",").map(s => s.trim()).filter(Boolean)
          : [],
        generateNarratives: !!missionText.trim(),
      };
      const res = await apiRequest("POST", "/api/grant-conduit/package", body);
      if (!res.ok) throw new Error((await res.json()).error || "Package failed");
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "Package ready", description: "Your intelligence package has been assembled." });
    },
    onMutate: () => setResult(null),
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="container max-w-5xl py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Globe className="h-4 w-4" />
          <span>TCAF Grant Conduit — Nationwide Intelligence Layer</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Grant Intelligence Package</h1>
        <p className="text-muted-foreground max-w-2xl">
          Fill in your organization's profile. We'll assemble a complete, evidence-backed package —
          CEDS regional data, RPLICE implementation science, verified platform outcomes, community
          violence data, matched grant opportunities, and AI-drafted narrative sections — ready to
          hand directly to a grant writer or push to GrantPathPro.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── FORM ── */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Organization Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="grant-org-type">Organization type *</Label>
                <Select value={orgType} onValueChange={setOrgType}>
                  <SelectTrigger id="grant-org-type" aria-label="Organization type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORG_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Organization name <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="e.g. El Buen Samaritano" value={orgName} onChange={e => setOrgName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>EIN <span className="text-muted-foreground">(optional — improves readiness score)</span></Label>
                <Input placeholder="12-3456789" value={ein} onChange={e => setEin(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Geography
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="grant-state">State *</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger id="grant-state" aria-label="State"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ZIP <span className="text-muted-foreground">(optional — refines violence data)</span></Label>
                  <Input placeholder="78702" maxLength={5} value={zip} aria-invalid={zip.length > 0 && zip.length !== 5}
                    onChange={e => setZip(e.target.value.replace(/\D/g, ""))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Focus Areas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map(area => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleFocus(area)}
                    aria-pressed={focusAreas.includes(area)}
                    aria-label={`${focusAreas.includes(area) ? "Remove" : "Add"} ${area} focus area`}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      focusAreas.includes(area)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {area}
                  </button>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Populations served <span className="text-muted-foreground">(comma-separated)</span></Label>
                <Input
                  placeholder="low-income families, returning citizens…"
                  value={populations}
                  onChange={e => setPopulations(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Mission Statement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Providing your mission enables AI-drafted narrative sections (needs statement,
                evidence base, evaluation plan, executive summary, etc.)
              </p>
              <Textarea
                placeholder="We provide wraparound services to low-income families…"
                rows={5}
                value={missionText}
                onChange={e => setMissionText(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={packageMutation.isPending || !state}
            onClick={() => packageMutation.mutate()}
          >
            {packageMutation.isPending ? (
              <><Sparkles className="h-4 w-4 mr-2 animate-pulse" /> Assembling package…</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-2" /> Generate Intelligence Package</>
            )}
          </Button>

          {packageMutation.isPending && (
            <p className="text-xs text-center text-muted-foreground">
              Pulling CEDS data, RPLICE evidence, grant matches, violence data…
            </p>
          )}
        </div>

        {/* ── RESULTS ── */}
        <div className="lg:col-span-2">
          {!result && !packageMutation.isPending && (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl p-12 text-center">
              <div className="space-y-3 max-w-sm">
                <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold">Your package will appear here</h3>
                <p className="text-sm text-muted-foreground">
                  Fill in your profile on the left and click Generate. The result is a complete,
                  evidence-backed grant intelligence file your writer can use immediately.
                </p>
              </div>
            </div>
          )}

          {packageMutation.isPending && (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          )}

          {result && (
            <Tabs defaultValue="readiness" className="space-y-4">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="readiness" className="text-xs">Readiness</TabsTrigger>
                <TabsTrigger value="grants" className="text-xs">Grants ({result.matchedOpportunities?.length ?? 0})</TabsTrigger>
                <TabsTrigger value="violence" className="text-xs">Violence Data</TabsTrigger>
                <TabsTrigger value="evidence" className="text-xs">RPLICE Evidence</TabsTrigger>
                <TabsTrigger value="narratives" className="text-xs">Narratives</TabsTrigger>
                <TabsTrigger value="outcomes" className="text-xs">Outcomes</TabsTrigger>
              </TabsList>

              {/* Readiness */}
              <TabsContent value="readiness" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <GradeChip grade={result.readiness?.grade ?? "—"} />
                      <div>
                        <p className="font-semibold text-xl">{result.readiness?.score ?? 0}/100 readiness score</p>
                        <p className="text-sm text-muted-foreground">
                          {result.cedsRegion ? `${result.cedsRegion.eddName} · ${result.cedsRegion.state}` : state}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {(result.readiness?.checklist ?? []).map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          {item.met
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                          <span className={item.met ? "" : "text-muted-foreground"}>
                            {item.item}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">{item.weight}pts</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {result.cedsRegion && (
                  <Card>
                    <CardHeader><CardTitle className="text-sm">CEDS Regional Context</CardTitle></CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><span className="font-medium">Region:</span> {result.cedsRegion.eddName}</p>
                      {result.cedsRegion.distressedDesignation && (
                        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                          EDA Distressed Area
                        </Badge>
                      )}
                      {result.cedsRegion.strategicVision && (
                        <p className="text-muted-foreground text-xs mt-2">{result.cedsRegion.strategicVision}</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Matched Grants */}
              <TabsContent value="grants" className="space-y-3">
                {(result.matchedOpportunities ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No matching grants found. Try adding focus areas.</p>
                ) : (
                  (result.matchedOpportunities as any[]).map((g: any, i: number) => (
                    <Card key={i}>
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm">{g.title}</p>
                            <p className="text-xs text-muted-foreground">{g.agency} {g.cfda ? `· CFDA ${g.cfda}` : ""}</p>
                          </div>
                          {g.fitScore > 0 && (
                            <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20" variant="outline">
                              <Star className="h-3 w-3 mr-1" />{g.fitScore}
                            </Badge>
                          )}
                        </div>
                        {g.description && <p className="text-xs text-muted-foreground line-clamp-2">{g.description}</p>}
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {g.awardCeiling && <span>Up to ${Number(g.awardCeiling).toLocaleString()}</span>}
                          {g.deadline && <span>Due {g.deadline}</span>}
                          {g.grantType && <Badge variant="secondary" className="text-[10px]">{g.grantType}</Badge>}
                        </div>
                        {g.sourceUrl && isSafeSourceUrl(g.sourceUrl) ? (
                          <a href={g.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 hover:underline">
                            View opportunity <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : g.sourceUrl ? (
                          <span className="text-xs text-muted-foreground">Source link unavailable</span>
                        ) : null}
                      </CardContent>
                    </Card>
                  ))
                )}
                {result.gunViolence?.triggeredGrantCategories?.length > 0 && (
                  <Card className="border-rose-200 dark:border-rose-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Violence-Triggered Grant Programs
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(result.gunViolence?.triggeredGrantCategories ?? []).map((cat: any, i: number) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium">{cat.agency} — {cat.program} <span className="text-xs text-muted-foreground">CFDA {cat.cfda}</span></p>
                          <p className="text-xs text-muted-foreground">{cat.reason}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Violence Data */}
              <TabsContent value="violence" className="space-y-4">
                {result.gunViolence ? (
                  <>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Incidents (90d)", value: result.gunViolence.suppressed ? "Suppressed" : result.gunViolence.incidents, accent: "" },
                        { label: "Victims (90d)", value: result.gunViolence.suppressed ? "Suppressed" : result.gunViolence.victims, accent: "" },
                        { label: "Fatalities (90d)", value: result.gunViolence.suppressed ? "Suppressed" : result.gunViolence.fatalities, accent: "text-rose-600" },
                      ].map(s => (
                        <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                    {result.gunViolence.suppressed ? (
                      <Card className="border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-4 text-sm">
                          <p className="font-medium text-amber-700 dark:text-amber-300">Small counts are suppressed</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            The registry suppresses counts below {result.gunViolence.suppressionFloor ?? 5} incidents to protect privacy. Do not infer a zero.
                          </p>
                        </CardContent>
                      </Card>
                    ) : result.gunViolence.incidents > 0 ? (
                      <Card className="border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-4 text-sm space-y-2">
                          <p className="font-medium text-amber-700 dark:text-amber-300">
                            Cite these numbers directly in your needs statement.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Source: TCAF Gun Violence Registry — verified incident-level data,
                            not estimates. Include as Exhibit A in DOJ, CDC/NCIPC, and SAMHSA applications.
                          </p>
                          {isSafeSourceUrl(result.gunViolence.policyTimelineEndpoint) ? <a href={result.gunViolence.policyTimelineEndpoint} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary flex items-center gap-1 hover:underline">
                            View policy timeline <ExternalLink className="h-3 w-3" />
                          </a> : <span className="text-xs text-muted-foreground">Policy timeline link unavailable</span>}
                        </CardContent>
                      </Card>
                    ) : (
                      <p className="text-sm text-muted-foreground">No incidents on record for this geography in the last 90 days.</p>
                    )}
                    {(result.gunViolence.monthlyTrend ?? []).length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-sm">12-Month Incident Trend</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-1">
                            {(result.gunViolence.monthlyTrend as any[]).map((m: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="w-16 text-muted-foreground">{m.month}</span>
                                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full bg-rose-400 rounded-full"
                                    style={{ width: `${m.suppressed ? 0 : Math.min(100, (m.incidents / Math.max(...(result.gunViolence.monthlyTrend as any[]).map((x:any) => Number(x.incidents) || 0), 1)) * 100)}%` }}
                                  />
                                </div>
                                <span className="w-16 text-right tabular-nums">{m.suppressed ? "Suppressed" : m.incidents}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Violence data unavailable for this geography.</p>
                )}
              </TabsContent>

              {/* RPLICE Evidence */}
              <TabsContent value="evidence" className="space-y-4">
                {result.rpliceEvidence ? (
                  <Card>
                    <CardContent className="pt-5 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Evidence Level", value: result.rpliceEvidence.evidenceLevel },
                          { label: "Fidelity Score", value: result.rpliceEvidence.fidelityScore != null ? `${result.rpliceEvidence.fidelityScore}/100` : "—" },
                          { label: "CFIR Coverage", value: result.rpliceEvidence.cfirConstructsCovered != null ? `${result.rpliceEvidence.cfirConstructsCovered} constructs` : "—" },
                          { label: "RE-AIM Domains", value: (result.rpliceEvidence.reaimDomainsCovered ?? []).join(", ") || "—" },
                          { label: "CFIR Assessment", value: result.rpliceEvidence.cifrAssessment ?? "—" },
                          { label: "RE-AIM Assessment", value: result.rpliceEvidence.reaimEvaluation ?? "—" },
                        ].map(item => (
                          <div key={item.label} className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="font-semibold text-sm">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      {result.rpliceEvidence.narrative && (
                        <p className="text-sm text-muted-foreground">{result.rpliceEvidence.narrative}</p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">No RPLICE evidence on file. Inbound evidence events will appear here when received.</p>
                )}
              </TabsContent>

              {/* Narratives */}
              <TabsContent value="narratives" className="space-y-4">
                {result.narratives && (
                  <p className="text-xs rounded border border-amber-200 bg-amber-50 p-3 text-amber-900">
                    AI-drafted content: review every figure, source, and claim against the cited evidence before submission.
                  </p>
                )}
                {!result.narratives && !missionText.trim() ? (
                  <div className="rounded-xl border-2 border-dashed p-8 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Add a mission statement in the form to generate AI-drafted narrative sections.
                    </p>
                  </div>
                ) : result.narratives?.note ? (
                  <p className="text-sm text-muted-foreground">{result.narratives.note}</p>
                ) : (
                  Object.entries(result.narratives ?? {}).map(([key, value]: [string, any]) => (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="text-sm capitalize flex items-center justify-between">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                          <Button variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => {
                              void copyText(value?.body ?? value ?? "")
                                .then(() => toast({ title: "Copied" }))
                                .catch(() => toast({ title: "Copy failed", description: "Select the text and copy it manually.", variant: "destructive" }));
                            }}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground space-y-2">
                        {value?.headline && <p className="font-semibold text-foreground">{value.headline}</p>}
                        {Array.isArray(value?.body)
                          ? value.body.map((p: string, i: number) => <p key={i}>{p}</p>)
                          : typeof value === "string"
                            ? <p>{value}</p>
                            : value?.subhead && <p>{value.subhead}</p>
                        }
                        {value?.keyNumbers?.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {value.keyNumbers.map((kn: any, i: number) => (
                              <div key={i} className="rounded border px-2 py-1 text-xs">
                                <span className="font-medium">{kn.value}</span> {kn.label}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Platform Outcomes */}
              <TabsContent value="outcomes" className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4" /> Approved Partner Outcomes &amp; Platform Totals</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Approved partner outcomes are reported and reviewed data, not projections.
                      Platform placement totals are a separate all-records measure and must not be
                      interpreted as part of the approved partner cohort.
                    </p>
                    {result.outcomeMetrics && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Participants served", value: result.outcomeMetrics.participantsServed?.toLocaleString() ?? "—" },
                          { label: "Employment rate", value: result.outcomeMetrics.employmentRate != null ? `${result.outcomeMetrics.employmentRate}%` : "—" },
                          { label: "Credentials attained", value: result.outcomeMetrics.credentialsAttained?.toLocaleString() ?? "—" },
                          { label: "Platform job placements (all records)", value: result.outcomeMetrics.platformTotals?.jobPlacements?.toLocaleString() ?? "—" },
                          { label: "Median earnings", value: result.outcomeMetrics.medianEarnings == null ? "Not reported" : `$${result.outcomeMetrics.medianEarnings.toLocaleString()}` },
                        ].map(s => (
                          <div key={s.label} className="rounded border p-2">
                            <p className="text-xs text-muted-foreground">{s.label}</p>
                            <p className="font-semibold">{s.value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {result.grantWriterContext?.platformStatement && (
                      <div className="rounded bg-muted/50 p-3 text-xs text-muted-foreground italic">
                        {result.grantWriterContext.platformStatement}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
