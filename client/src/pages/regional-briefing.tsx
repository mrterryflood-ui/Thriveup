import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sparkles, Loader2, ExternalLink, Send, Save, X, Plus, MapPin, Bookmark, Trash2, Database,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BriefingLocation {
  label: string;
  region: string;
  zip?: string;
  countyFips?: string;
  metroId?: string;
}
interface GrantHit {
  id: string;
  title: string;
  agency: string | null;
  funding_amount: string | null;
  deadline: string | null;
  fit_score: number | null;
  status: string | null;
  source_url: string | null;
  cfda: string | null;
  snippet: string;
}
interface PlatformHit {
  name: string;
  url: string | null;
  role: string | null;
  description: string | null;
}
interface PerLocation {
  location: BriefingLocation;
  grant_count: number;
  grants: GrantHit[];
}
interface SavedWorkflow {
  id: number;
  slug: string;
  name: string;
  question: string;
  topic: string;
  locations: BriefingLocation[];
  lastBriefing: string | null;
  lastRunAt: string | null;
  updatedAt: string;
}

export default function RegionalBriefingPage() {
  const { toast } = useToast();

  // Chat input + parsed state
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState("");
  const [locations, setLocations] = useState<BriefingLocation[]>([]);
  const [extracting, setExtracting] = useState(false);

  // Briefing state
  const [streaming, setStreaming] = useState(false);
  const [briefing, setBriefing] = useState("");
  const [perLocation, setPerLocation] = useState<PerLocation[]>([]);
  const [platforms, setPlatforms] = useState<PlatformHit[]>([]);

  // Save + saved workflows
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Chainweb runner state
  const [chainwebBusy, setChainwebBusy] = useState(false);

  const workflowsQuery = useQuery<{ workflows: SavedWorkflow[] }>({
    queryKey: ["/api/regional-briefing/workflows"],
  });

  async function extract() {
    const q = question.trim();
    if (!q) {
      toast({ title: "Type a question first", variant: "destructive" });
      return;
    }
    setExtracting(true);
    try {
      const res = await apiRequest("POST", "/api/regional-briefing/extract", { question: q });
      const data: { locations: BriefingLocation[]; topic: string } = await res.json();
      setLocations(data.locations);
      setTopic(data.topic);
      toast({ title: "Parsed", description: `${data.locations.length} location(s) · topic: ${data.topic}` });
    } catch (err) {
      toast({ title: "Parse failed", description: err instanceof Error ? err.message : "Try again", variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  }

  async function run(overrides?: { question?: string; locations?: BriefingLocation[]; topic?: string }) {
    const q = (overrides?.question ?? question).trim();
    const locs = overrides?.locations ?? locations;
    const tpc = overrides?.topic ?? topic;
    if (!q && !locs.length) {
      toast({ title: "Type a question or add a location first", variant: "destructive" });
      return;
    }
    setStreaming(true);
    setBriefing("");
    setPerLocation([]);
    setPlatforms([]);

    const body: Record<string, unknown> = {};
    if (q) body.question = q;
    if (locs.length) body.locations = locs;
    if (tpc) body.topic = tpc;

    try {
      const res = await fetch("/api/regional-briefing/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error ?? "Request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let finalText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.trim();
          if (!line.startsWith("data:")) continue;
          let payload: {
            context?: { locations?: BriefingLocation[]; topic?: string; platforms?: PlatformHit[]; per_location?: PerLocation[] };
            content?: string;
            error?: string;
            done?: boolean;
          } | null = null;
          try {
            payload = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }
          if (!payload) continue;
          if (payload.error) throw new Error(payload.error);
          if (payload.context) {
            if (payload.context.locations?.length) setLocations(payload.context.locations);
            if (payload.context.topic) setTopic(payload.context.topic);
            if (payload.context.per_location) setPerLocation(payload.context.per_location);
            if (payload.context.platforms) setPlatforms(payload.context.platforms);
          }
          if (typeof payload.content === "string") {
            finalText += payload.content;
            setBriefing(finalText);
          }
        }
      }
      // Cache last briefing back to a saved workflow if we're inside one
      if (activeSlug && finalText.trim()) {
        try {
          await apiRequest("POST", `/api/regional-briefing/workflows/${activeSlug}/cache`, { briefing: finalText });
          queryClient.invalidateQueries({ queryKey: ["/api/regional-briefing/workflows"] });
        } catch {
          /* best-effort */
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Briefing failed";
      toast({ title: "Briefing failed", description: message, variant: "destructive" });
    } finally {
      setStreaming(false);
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/regional-briefing/workflows", {
        name: saveName.trim(),
        question: question.trim(),
        topic: topic || "community well-being",
        locations,
      });
      return (await res.json()).workflow as SavedWorkflow;
    },
    onSuccess: (wf) => {
      setActiveSlug(wf.slug);
      setSaveOpen(false);
      setSaveName("");
      queryClient.invalidateQueries({ queryKey: ["/api/regional-briefing/workflows"] });
      toast({ title: "Workflow saved", description: wf.name });
    },
    onError: (err: unknown) => {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (slug: string) => {
      await apiRequest("DELETE", `/api/regional-briefing/workflows/${slug}`);
      return slug;
    },
    onSuccess: (slug) => {
      if (activeSlug === slug) setActiveSlug(null);
      queryClient.invalidateQueries({ queryKey: ["/api/regional-briefing/workflows"] });
    },
  });

  function loadWorkflow(wf: SavedWorkflow) {
    setActiveSlug(wf.slug);
    setQuestion(wf.question);
    setTopic(wf.topic);
    setLocations(wf.locations);
    setBriefing(wf.lastBriefing ?? "");
    setPerLocation([]);
    setPlatforms([]);
    toast({ title: "Loaded", description: wf.name });
  }

  function updateLocation(i: number, patch: Partial<BriefingLocation>) {
    setLocations((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch, label: patch.label ?? `${patch.region ?? l.region}${(patch.zip ?? l.zip) ? " " + (patch.zip ?? l.zip) : ""}` } : l)));
  }
  function removeLocation(i: number) {
    setLocations((prev) => prev.filter((_, idx) => idx !== i));
  }
  function addLocation() {
    if (locations.length >= 6) {
      toast({ title: "Max 6 locations", variant: "destructive" });
      return;
    }
    setLocations((prev) => [...prev, { label: "New location", region: "" }]);
  }

  async function runChainweb() {
    const countyLocs = locations.filter((l) => l.countyFips && /^\d{5}$/.test(l.countyFips));
    if (!countyLocs.length) {
      toast({
        title: "Need a county FIPS",
        description: "Add a 5-digit county FIPS to at least one location (e.g., 48491 for Williamson County TX).",
        variant: "destructive",
      });
      return;
    }
    setChainwebBusy(true);
    try {
      const res = await apiRequest("POST", "/api/corridor/chainweb/run-counties", {
        counties: countyLocs.map((l) => ({ countyFips: l.countyFips!, metroId: l.metroId || `cty-${l.countyFips}` })),
      });
      const data: { ok: boolean; report?: { totalEvidenceWritten: number; summary: { succeeded: number; failed: number; skipped: number } } } = await res.json();
      if (!data.ok || !data.report) throw new Error("Chainweb did not return a report");
      toast({
        title: "Chainweb complete",
        description: `${data.report.totalEvidenceWritten} evidence rows written · ${data.report.summary.succeeded} ok · ${data.report.summary.failed} failed · ${data.report.summary.skipped} skipped`,
      });
    } catch (err) {
      toast({ title: "Chainweb failed", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setChainwebBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void run();
    }
  }

  const savedList = workflowsQuery.data?.workflows ?? [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl" data-testid="page-regional-briefing">
      <PageHeader
        title="Regional Briefing"
        description="Ask anything about any city, county, ZIP — or compare several. The AI parses your question, pulls matching grants from our 721-grant pipeline, lists every TCAF capability, names stakeholders by ZIP, lays out an implementation plan with measurable outcomes, and lets you lock the whole thing in as a reusable workflow."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Community Intelligence" },
          { label: "Regional Briefing" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {/* Ask */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Ask the AI
                {activeSlug && <Badge variant="outline" className="ml-2 text-[10px]" data-testid="badge-active-workflow">workflow: {activeSlug}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder='e.g., "Compare childcare infrastructure gaps in Round Rock 78664, Hutto 78634, and Georgetown 78626. Who are the stakeholders by ZIP and what outcomes should we commit to?"'
                data-testid="input-question"
                className="text-base"
              />
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs text-muted-foreground">⌘/Ctrl + Enter to run · Parse first to edit the locations the AI extracted</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={extract} disabled={extracting || streaming} data-testid="button-parse">
                    {extracting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
                    Parse
                  </Button>
                  <Button onClick={() => run()} disabled={streaming} data-testid="button-run-briefing">
                    {streaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {streaming ? "Working…" : "Run briefing"}
                  </Button>
                </div>
              </div>

              {/* Parsed locations editor */}
              {(locations.length > 0 || topic) && (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span>TOPIC:</span>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="h-7 text-xs max-w-xs"
                      data-testid="input-topic"
                    />
                    <span className="ml-4">LOCATIONS ({locations.length}/6):</span>
                    <Button variant="ghost" size="sm" onClick={addLocation} data-testid="button-add-location">
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {locations.map((l, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" data-testid={`location-row-${i}`}>
                        <Input
                          value={l.region}
                          onChange={(e) => updateLocation(i, { region: e.target.value })}
                          placeholder="City / county / region"
                          className="h-7 text-xs"
                          data-testid={`input-region-${i}`}
                        />
                        <Input
                          value={l.zip ?? ""}
                          onChange={(e) => updateLocation(i, { zip: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })}
                          placeholder="ZIP"
                          className="h-7 text-xs w-24"
                          data-testid={`input-zip-${i}`}
                        />
                        <Input
                          value={l.countyFips ?? ""}
                          onChange={(e) => updateLocation(i, { countyFips: e.target.value.replace(/[^0-9]/g, "").slice(0, 5) })}
                          placeholder="County FIPS"
                          className="h-7 text-xs w-28"
                          data-testid={`input-fips-${i}`}
                        />
                        <Button variant="ghost" size="sm" onClick={() => removeLocation(i)} data-testid={`button-remove-${i}`}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    County FIPS (5-digit, e.g., <span className="font-mono">48491</span> = Williamson County TX) enables the Chainweb pull below. Look up at{" "}
                    <a className="underline" target="_blank" rel="noreferrer" href="https://www.census.gov/library/reference/code-lists/ansi.html">census.gov ANSI codes</a>.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" disabled={!locations.length || !question.trim()} data-testid="button-open-save">
                          <Save className="h-3 w-3 mr-1" /> Save as workflow
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Save this briefing as a workflow</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">Re-run anytime with one click. Stores your question + parsed locations + topic.</p>
                          <Input
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="e.g., N. Wilco Childcare Compare"
                            data-testid="input-workflow-name"
                          />
                        </div>
                        <DialogFooter>
                          <Button onClick={() => saveMutation.mutate()} disabled={!saveName.trim() || saveMutation.isPending} data-testid="button-confirm-save">
                            {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={runChainweb}
                      disabled={chainwebBusy || !locations.some((l) => l.countyFips)}
                      data-testid="button-run-chainweb"
                    >
                      {chainwebBusy ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Database className="h-3 w-3 mr-1" />}
                      Run Chainweb (primary-source pull)
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Briefing output */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Briefing</CardTitle>
            </CardHeader>
            <CardContent>
              {!briefing && !streaming && (
                <p className="text-sm text-muted-foreground">
                  Type your question, optionally hit <em>Parse</em> to review the locations the AI extracted, then <em>Run briefing</em>. The answer streams here with: the data story, verifiable data, stakeholders by ZIP, every matching grant, all TCAF solutions, an implementation plan, measurable outcomes per stakeholder, cross-location comparison (if 2+ locations), and concrete next moves.
                </p>
              )}
              {streaming && !briefing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading per-location grants + platforms, then synthesizing…
                </div>
              )}
              <pre className="whitespace-pre-wrap text-sm leading-6 font-sans" data-testid="text-briefing">
                {briefing}
              </pre>
            </CardContent>
          </Card>

          {/* Per-location grants */}
          {perLocation.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Matching grants by location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {perLocation.map((pl, i) => (
                    <div key={i} className="border rounded-md p-3 space-y-2" data-testid={`per-location-${i}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">{pl.location.label}</span>
                        <Badge variant="secondary" className="text-[10px]">{pl.grant_count}</Badge>
                      </div>
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {pl.grants.length === 0 && <p className="text-[11px] text-muted-foreground">No grants matched these keywords.</p>}
                        {pl.grants.map((g) => (
                          <div key={g.id} className="border-l-2 border-primary/40 pl-2 text-xs" data-testid={`grant-${g.id}-loc-${i}`}>
                            <div className="font-semibold leading-tight">{g.title}</div>
                            <div className="text-[10px] text-muted-foreground">{g.agency ?? "—"}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {g.funding_amount && <Badge variant="secondary" className="text-[9px]">{g.funding_amount}</Badge>}
                              {g.deadline && <Badge variant="outline" className="text-[9px]">Due {g.deadline}</Badge>}
                              {typeof g.fit_score === "number" && <Badge className="text-[9px]">Fit {g.fit_score}</Badge>}
                            </div>
                            {g.source_url && (
                              <a href={g.source_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                                Source <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platforms */}
          {platforms.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">TCAF platforms in scope ({platforms.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {platforms.map((p) => (
                    <div key={p.name} className="border rounded p-2 text-xs" data-testid={`platform-${p.name.toLowerCase().replace(/\s+/g, "-")}`}>
                      <div className="font-semibold">{p.name}</div>
                      {p.role && <div className="text-[10px] text-muted-foreground">{p.role}</div>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Saved workflows sidebar */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bookmark className="h-4 w-4" /> Saved workflows
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {workflowsQuery.isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {!workflowsQuery.isLoading && savedList.length === 0 && (
                <p className="text-xs text-muted-foreground">No saved workflows yet. Save one above to re-run it anytime.</p>
              )}
              {savedList.map((wf) => (
                <div key={wf.slug} className={`border rounded p-2 text-xs ${activeSlug === wf.slug ? "border-primary bg-primary/5" : ""}`} data-testid={`workflow-${wf.slug}`}>
                  <div className="font-semibold leading-tight">{wf.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {wf.locations.length} location{wf.locations.length === 1 ? "" : "s"} · {wf.topic}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {wf.locations.slice(0, 4).map((l, i) => (
                      <Badge key={i} variant="outline" className="text-[9px]">{l.label}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => loadWorkflow(wf)} data-testid={`button-load-${wf.slug}`}>
                      Load
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { loadWorkflow(wf); setTimeout(() => run({ question: wf.question, locations: wf.locations, topic: wf.topic }), 50); }} data-testid={`button-rerun-${wf.slug}`}>
                      Re-run
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => deleteMutation.mutate(wf.slug)} data-testid={`button-delete-${wf.slug}`}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
