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
  Sparkles, Loader2, ExternalLink, Send, Save, X, Plus, MapPin, Bookmark, Trash2, Database, Copy, Check, MessageCircleQuestion, FileText, AlertTriangle,
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

  // Door 2 (no-AI structured briefing) state
  const [scope, setScope] = useState<"A" | "B" | "C" | "D" | "E">("A");
  const [structuredBusy, setStructuredBusy] = useState(false);
  const [briefingSource, setBriefingSource] = useState<"ai" | "structured" | null>(null);
  // Opt-in flags: funding (§5) + TCAF fit (§6) are OFF by default. The briefing
  // is community + audience first. You turn these on when you actually need them.
  const [includeFunding, setIncludeFunding] = useState(false);
  const [includeTcaf, setIncludeTcaf] = useState(false);
  const [audience, setAudience] = useState("");

  // Copy + follow-up state
  const [copied, setCopied] = useState(false);
  const [followupQ, setFollowupQ] = useState("");
  const [followupBusy, setFollowupBusy] = useState(false);
  const [followups, setFollowups] = useState<Array<{ q: string; a: string; savedPlanId?: number }>>([]);
  const [savingPlanIdx, setSavingPlanIdx] = useState<number | null>(null);

  // Prepended to every copy/export so the AI-draft warning travels with the
  // text even after it leaves the page.
  const AI_DRAFT_DISCLAIMER = "AI-generated draft — verify all facts before external use.";

  async function copyBriefing() {
    if (!briefing) return;
    try {
      const text = briefingSource === "ai" ? `${AI_DRAFT_DISCLAIMER}\n\n${briefing}` : briefing;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "Briefing copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Long-press the text to select and copy manually.", variant: "destructive" });
    }
  }

  async function askFollowup(overrideQ?: string, displayLabel?: string) {
    const q = (overrideQ ?? followupQ).trim();
    if (!q) return;
    if (!briefing.trim()) {
      toast({ title: "Run a briefing first", variant: "destructive" });
      return;
    }
    setFollowupBusy(true);
    try {
      const res = await apiRequest("POST", "/api/regional-briefing/followup", {
        question: q,
        priorBriefing: briefing,
        locations, // gives backend the county FIPS list so it can pull RPLICE context
      });
      const data: { answer: string; rpliceWired?: boolean } = await res.json();
      setFollowups((prev) => [...prev, { q: displayLabel ?? q, a: data.answer }]);
      if (!overrideQ) setFollowupQ("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Follow-up failed";
      const isAuth = /401|sign in|unauthorized/i.test(msg);
      toast({
        title: isAuth ? "Please sign in again" : "Follow-up failed",
        description: isAuth
          ? "Your session expired. Refresh the page and sign back in — your briefing is still on screen."
          : msg,
        variant: "destructive",
      });
    } finally {
      setFollowupBusy(false);
    }
  }

  async function saveAsActionPlan(idx: number) {
    const f = followups[idx];
    if (!f) return;
    if (locations.length === 0 || !locations.some((l) => l.countyFips)) {
      toast({
        title: "Need a county to save",
        description: "Add or parse a location with a county FIPS before saving as a RPLICE action plan.",
        variant: "destructive",
      });
      return;
    }
    setSavingPlanIdx(idx);
    try {
      const res = await apiRequest("POST", "/api/regional-briefing/save-action-plan", {
        planText: f.a,
        sourceQuestion: f.q,
        topic,
        locations,
      });
      const data: { id: number; regionName: string; countyFips: string; viewUrl: string; message: string } = await res.json();
      setFollowups((prev) => prev.map((x, i) => (i === idx ? { ...x, savedPlanId: data.id } : x)));
      toast({
        title: `Saved as RPLICE action plan #${data.id}`,
        description: data.message,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    } finally {
      setSavingPlanIdx(null);
    }
  }

  const QUICK_ACTIONS: Array<{ label: string; prompt: string }> = [
    {
      label: "So what?",
      prompt: "Translate the problem analysis in the briefing above into the strategic 'so what' for the audience this briefing was framed for. Give me: (1) 3–5 strategic implications — what does this actually mean they should care about, in plain language; (2) why it matters NOW (timing, leverage points, windows closing); (3) what changes if nothing is done in the next 12 months. Keep it to one screen.",
    },
    {
      label: "Build the implementation project",
      prompt: "Now translate the briefing above into a concrete IMPLEMENTATION PROJECT we can launch in the next 90 days. Structure your answer exactly like this:\n\n## Project name (proposed)\nA short, plain-language name.\n\n## The bet (one paragraph)\nWhat we're testing, why now, who wins if it works.\n\n## Scope (in / out)\nWhich ZIPs, which population, which problem from the briefing — and what we are explicitly NOT doing in phase 1.\n\n## Lead + convening table\nWho leads (named role + entity from the briefing), who must be at the table (named stakeholders from section 4), who is informed but not at the table.\n\n## 30 / 60 / 90 day milestones\nConcrete, measurable, owned. One bullet per milestone with owner.\n\n## Resources required\nPeople (FTEs / loaned staff / volunteers), money (rough ranges, no invented dollar amounts), data/tools, space.\n\n## Quick wins in week 1–2\n3 things that can happen immediately to build momentum and create proof.\n\n## Risks + how we manage them\n3–5 real risks with a one-line mitigation each.\n\n## Success signal at day 90\nThe ONE thing that, if true at day 90, means this is worth scaling.\n\nGround every choice in the briefing above. Do not invent stakeholders, dollar amounts, or deadlines.",
    },
    {
      label: "Next 5 moves this week",
      prompt: "Give me the 5 most important moves I personally should make THIS WEEK based on the briefing above. Each move: (a) the action in one sentence, (b) who I'm calling/emailing (named role from section 4), (c) what I'm asking them for, (d) the email/call opener I can copy-paste. Plain, practical, no jargon.",
    },
    {
      label: "Convening agenda",
      prompt: "Design the agenda for the first convening meeting of the stakeholders identified in the briefing above. Output: (1) who's in the room (named roles), (2) the framing question (one sentence that gets everyone aligned), (3) 4–6 agenda items with time boxes (90-minute meeting), (4) the decision we need to walk out with, (5) what we send people 48 hours in advance to come prepared.",
    },
  ];

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
    setBriefingSource("ai");
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
      const raw = err instanceof Error ? err.message : String(err);
      const isAuth = /401|sign in|unauthorized/i.test(raw);
      const friendly = isAuth
        ? "Your session expired. Refresh the page and sign back in — your topic and locations are still here."
        : /load failed|network|fetch/i.test(raw)
        ? "The connection dropped mid-briefing (server hiccup). Hit Run briefing again — your topic and locations are still here."
        : raw || "Briefing failed";
      toast({
        title: isAuth ? "Please sign in again" : "Briefing failed",
        description: friendly,
        variant: "destructive",
      });
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

  // DOOR 2 — no-AI structured briefing. Assembled by server in code from DB
  // rows only. Slower to read, but it never fails because the AI failed.
  async function runStructured(overrides?: { question?: string; locations?: BriefingLocation[]; topic?: string; scope?: "A" | "B" | "C" | "D" | "E"; includeFunding?: boolean; includeTcaf?: boolean; audience?: string }) {
    const q = (overrides?.question ?? question).trim();
    const locs = overrides?.locations ?? locations;
    const tpc = overrides?.topic ?? topic;
    const sc = overrides?.scope ?? scope;
    const inclF = overrides?.includeFunding ?? includeFunding;
    const inclT = overrides?.includeTcaf ?? includeTcaf;
    const aud = (overrides?.audience ?? audience).trim();
    if (!q && !locs.length) {
      toast({ title: "Type a question or add a location first", variant: "destructive" });
      return;
    }
    setStructuredBusy(true);
    setBriefing("");
    setBriefingSource("structured");
    setPerLocation([]);
    setPlatforms([]);
    try {
      const body: Record<string, unknown> = { scope: sc, includeFunding: inclF, includeTcaf: inclT };
      if (q) body.question = q;
      if (locs.length) body.locations = locs;
      if (tpc) body.topic = tpc;
      if (aud) body.audience = aud;
      const res = await apiRequest("POST", "/api/regional-briefing/structured", body);
      const data: {
        briefing: string;
        locations: BriefingLocation[];
        topic: string;
        scope: string;
        per_location: PerLocation[];
        platforms: PlatformHit[];
      } = await res.json();
      setBriefing(data.briefing);
      if (data.locations?.length) setLocations(data.locations);
      if (data.topic) setTopic(data.topic);
      if (data.per_location) setPerLocation(data.per_location);
      if (data.platforms) setPlatforms(data.platforms);
      toast({ title: "Built from data", description: `Scope ${data.scope} · ${data.platforms?.length ?? 0} platforms · no AI was called.` });
      // Cache to active workflow if any
      if (activeSlug && data.briefing) {
        try {
          await apiRequest("POST", `/api/regional-briefing/workflows/${activeSlug}/cache`, { briefing: data.briefing });
          queryClient.invalidateQueries({ queryKey: ["/api/regional-briefing/workflows"] });
        } catch {
          /* best-effort */
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Build from data failed";
      toast({ title: "Build from data failed", description: msg, variant: "destructive" });
    } finally {
      setStructuredBusy(false);
    }
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
                  <Button onClick={() => run()} disabled={streaming || structuredBusy} data-testid="button-run-briefing">
                    {streaming ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {streaming ? "Working…" : "Run briefing (AI)"}
                  </Button>
                </div>
              </div>

              {/* DOOR 2 — no-AI structured briefing controls */}
              <div className="border-t pt-3 space-y-2" data-testid="structured-door-controls">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Or — build from data only:</span>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as "A" | "B" | "C" | "D" | "E")}
                    className="text-xs border rounded px-2 py-1 bg-background"
                    data-testid="select-scope"
                  >
                    <option value="A">[A] Situation — §1–4 (default)</option>
                    <option value="B">[B] Asset map — §1–4</option>
                    <option value="E">[E] Full analysis — §1–4 + §7 CFIR + §8 RE-AIM</option>
                    <option value="C">[C] Funding-only — §1–4 + §5</option>
                    <option value="D">[D] TCAF-fit-only — §1–4 + §6</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={() => runStructured()}
                    disabled={structuredBusy || streaming}
                    data-testid="button-run-structured"
                    size="sm"
                  >
                    {structuredBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                    Build from data (no AI)
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer" data-testid="toggle-include-funding">
                    <input
                      type="checkbox"
                      checked={includeFunding}
                      onChange={(e) => setIncludeFunding(e.target.checked)}
                      className="h-3.5 w-3.5"
                    />
                    <span>Add funding (§5 grants)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer" data-testid="toggle-include-tcaf">
                    <input
                      type="checkbox"
                      checked={includeTcaf}
                      onChange={(e) => setIncludeTcaf(e.target.checked)}
                      className="h-3.5 w-3.5"
                    />
                    <span>Add TCAF fit (§6)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Audience:</span>
                    <Input
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. United Way of Williamson County"
                      className="h-7 text-xs w-64"
                      data-testid="input-audience"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Default = community-and-audience first. Funding (§5) and TCAF fit (§6) are OFF until you turn them on. The briefing is here to inform the audience, not pitch them.
                </p>
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
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base flex items-center gap-2">
                Briefing
                {briefingSource === "structured" && (
                  <Badge variant="outline" className="text-[10px]" data-testid="badge-source-structured">
                    <Database className="h-3 w-3 mr-1" /> data-only · no AI
                  </Badge>
                )}
                {briefingSource === "ai" && (
                  <Badge variant="outline" className="text-[10px]" data-testid="badge-source-ai">
                    <Sparkles className="h-3 w-3 mr-1" /> AI narrative
                  </Badge>
                )}
              </CardTitle>
              {briefing && !streaming && !structuredBusy && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyBriefing}
                  data-testid="button-copy-briefing"
                  className="h-8"
                >
                  {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {(streaming || (briefing && briefingSource === "ai")) && (
                <div
                  className="mb-3 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2 flex items-start gap-2"
                  data-testid="banner-ai-draft-disclaimer"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">
                    AI-generated draft — verify all facts before external use.
                  </p>
                </div>
              )}
              {!briefing && !streaming && (
                <p className="text-sm text-muted-foreground">
                  Type your question, optionally hit <em>Parse</em> to review the locations the AI extracted, then <em>Run briefing</em>. The answer is scope-aware — ask to "understand the situation" and you get place + data story + stakeholders only; ask for the funding picture, TCAF fit, or a full plan to expand.
                </p>
              )}
              {streaming && !briefing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading per-location grants + platforms, then synthesizing…
                </div>
              )}
              <pre className="whitespace-pre-wrap text-sm leading-6 font-sans select-text" data-testid="text-briefing">
                {briefing}
              </pre>

              {/* Follow-up Q&A — show as soon as there's substantive briefing text,
                  even if the SSE stream never sent a clean done event. */}
              {briefing.trim().length > 200 && (
                <div className="mt-6 pt-4 border-t space-y-3" data-testid="followup-section">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MessageCircleQuestion className="h-4 w-4" />
                    Ask a follow-up about this briefing
                  </div>

                  {followups.length > 0 && (
                    <div className="space-y-3">
                      {followups.map((f, i) => (
                        <div key={i} className="border-l-2 border-primary/40 pl-3 space-y-1.5" data-testid={`followup-${i}`}>
                          <div className="text-xs font-medium text-muted-foreground">You asked:</div>
                          <div className="text-sm font-medium">{f.q}</div>
                          <div className="text-xs font-medium text-muted-foreground pt-1">Answer:</div>
                          <pre className="whitespace-pre-wrap text-sm leading-6 font-sans select-text">{f.a}</pre>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[11px]"
                              onClick={() => {
                                navigator.clipboard.writeText(f.a).then(
                                  () => toast({ title: "Answer copied" }),
                                  () => toast({ title: "Copy failed — long-press to select", variant: "destructive" }),
                                );
                              }}
                              data-testid={`button-copy-followup-${i}`}
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy answer
                            </Button>
                            {f.savedPlanId ? (
                              <a
                                href="/rplice-tools"
                                className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded border border-primary/40 bg-primary/5 hover:bg-primary/10"
                                data-testid={`link-saved-plan-${i}`}
                              >
                                <Check className="h-3 w-3" /> Saved as RPLICE plan #{f.savedPlanId} — open in /rplice-tools
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px]"
                                onClick={() => saveAsActionPlan(i)}
                                disabled={savingPlanIdx === i || locations.length === 0}
                                data-testid={`button-save-plan-${i}`}
                                title={locations.length === 0 ? "Parse a location first to enable saving" : "Save this answer as a tracked RPLICE action plan"}
                              >
                                {savingPlanIdx === i ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Database className="h-3 w-3 mr-1" />
                                )}
                                Save as RPLICE action plan
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quick-action buttons */}
                  <div className="flex flex-wrap gap-2" data-testid="quick-actions">
                    {QUICK_ACTIONS.map((qa) => (
                      <Button
                        key={qa.label}
                        size="sm"
                        variant="secondary"
                        onClick={() => askFollowup(qa.prompt, qa.label)}
                        disabled={followupBusy || streaming}
                        data-testid={`button-quick-${qa.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        className="text-xs h-8"
                      >
                        {qa.label}
                      </Button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Textarea
                      value={followupQ}
                      onChange={(e) => setFollowupQ(e.target.value)}
                      placeholder="…or type your own follow-up — e.g., 'Which 78725 providers have infant slots?', 'Write the United Way pitch in 200 words', 'What's the case for HHSC vs. WIOA funding?'"
                      rows={2}
                      className="text-sm"
                      data-testid="input-followup-question"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          askFollowup();
                        }
                      }}
                    />
                    <Button
                      onClick={() => askFollowup()}
                      disabled={followupBusy || streaming || !followupQ.trim()}
                      data-testid="button-ask-followup"
                      className="sm:self-start"
                    >
                      {followupBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                      Ask
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    ⌘/Ctrl + Enter to ask. Quick-action buttons run pre-built prompts against this briefing — "So what?" turns the problem into strategic implications, "Build the implementation project" turns it into a 30/60/90-day plan with owners + risks + quick wins.
                  </p>
                </div>
              )}
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
                      Re-run AI
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => { loadWorkflow(wf); setTimeout(() => runStructured({ question: wf.question, locations: wf.locations, topic: wf.topic, scope }), 50); }} data-testid={`button-replay-data-${wf.slug}`} title="Replay this workflow against fresh DB data — no AI in the loop">
                      Replay data
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
