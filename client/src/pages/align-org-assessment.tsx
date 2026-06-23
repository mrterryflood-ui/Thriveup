import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlignProgressBar, ALIGN_PHASES, type AlignPhase } from "@/components/align-phase-badge";
import {
  Search, Ear, Puzzle, Compass, Navigation, Star,
  Target, Heart, Zap, ArrowRight, RefreshCw,
  ChevronRight, Plus, Trash2, Building2, Users, Globe
} from "lucide-react";
import { useState } from "react";
import alignLogo from "@assets/align-logo-optimized.webp";

type AlignPhaseKey = "assess" | "listen" | "integrate" | "guide" | "navigate" | "thrive";
const PHASE_ORDER: AlignPhaseKey[] = ["assess", "listen", "integrate", "guide", "navigate", "thrive"];
const PHASE_ICONS = { assess: Search, listen: Ear, integrate: Puzzle, guide: Compass, navigate: Navigation, thrive: Star };

const ORG_PHASE_CONTEXT: Record<AlignPhaseKey, { orgDesc: string; questions: string[] }> = {
  assess: {
    orgDesc: "Know your gaps, strengths, and community context — an honest inventory of where your organization stands.",
    questions: ["Have you completed a formal needs assessment in the last 2 years?", "Do you know which populations you are NOT reaching?", "Can you articulate your theory of change?"],
  },
  listen: {
    orgDesc: "Are you actually hearing the people you serve — not just collecting data, but centering their voices in your decisions?",
    questions: ["Do the people you serve have a real say in your programs?", "Do you have formal community listening processes?", "Are lived-experience leaders on your board or staff?"],
  },
  integrate: {
    orgDesc: "Are you connected across sectors? Can a person you serve get warm handoffs — not referrals that go nowhere?",
    questions: ["Do you have active MOUs or partnerships with 3+ other orgs?", "Can you share data across partners with consent?", "Do you co-design services with other providers?"],
  },
  guide: {
    orgDesc: "Do you have a clear roadmap, funded plan, and workforce aligned to your theory of change?",
    questions: ["Is your strategic plan current and funded?", "Do staff have clear professional development pathways?", "Are your programs evidence-based or evidence-informed?"],
  },
  navigate: {
    orgDesc: "Are you actively delivering, measuring fidelity, and iterating based on data and community feedback?",
    questions: ["Do you track outcomes — not just outputs?", "Can you show year-over-year improvement on at least one indicator?", "Do you have a feedback loop from participants to program changes?"],
  },
  thrive: {
    orgDesc: "You are influencing policy, building community ownership, and your model is replicable and sustainable.",
    questions: ["Have you influenced local or state policy in the last 3 years?", "Could your model be replicated by another org?", "Do communities you serve own assets or have formal governance roles?"],
  },
};

const ORG_DIMENSIONS = [
  {
    key: "mission", icon: Target, color: "text-violet-600 dark:text-violet-400",
    label: "Mission", sublabel: "Spirit",
    question: "How clear, aligned, and trusted is your mission in the community you serve?",
    hint: "Consider: mission clarity, community trust, values alignment, why you exist.",
  },
  {
    key: "culture", icon: Heart, color: "text-blue-600 dark:text-blue-400",
    label: "Culture", sublabel: "Soul",
    question: "How healthy is your organizational culture — for staff, volunteers, and the people you serve?",
    hint: "Consider: staff wellbeing, lived-experience leadership, psychological safety, belonging.",
  },
  {
    key: "capacity", icon: Zap, color: "text-emerald-600 dark:text-emerald-400",
    label: "Capacity", sublabel: "Body",
    question: "How stable and well-resourced is your organizational capacity?",
    hint: "Consider: funding stability, data systems, facilities, technology, operational infrastructure.",
  },
] as const;

const ORG_TYPES = ["Nonprofit", "Faith Community", "School / Educational", "Government / Public Agency", "Business / Social Enterprise", "Coalition", "Community Group", "Informal Network"];

export default function AlignOrgAssessmentPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Form state for new / existing profile
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [started, setStarted] = useState(false);
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [phaseCoverage, setPhaseCoverage] = useState<AlignPhaseKey[]>([]);
  const [programs, setPrograms] = useState<{ name: string; phases: AlignPhaseKey[]; participants: number }[]>([]);
  const [newProgram, setNewProgram] = useState({ name: "", phases: [] as AlignPhaseKey[], participants: 0 });

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/align/org/profile"],
    enabled: started,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/align/org/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/align/org/profile"] });
      toast({ title: "Saved", description: "Your organizational ALIGN profile has been updated." });
    },
  });

  const advanceMutation = useMutation({
    mutationFn: (nextPhase: AlignPhaseKey) =>
      apiRequest("POST", "/api/align/org/profile", { currentPhase: nextPhase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/align/org/profile"] });
      toast({ title: "Phase advanced", description: "Your organization has moved to the next ALIGN phase." });
    },
  });

  function handleStart() {
    if (!orgName.trim()) { toast({ title: "Organization name required", variant: "destructive" }); return; }
    saveMutation.mutate({ orgName, orgType, currentPhase: "assess" });
    setStarted(true);
  }

  function handleSave() {
    const payload: Record<string, unknown> = { phaseCoverage };
    for (const d of ORG_DIMENSIONS) {
      if (editScores[d.key] !== undefined) payload[`${d.key}Score`] = editScores[d.key];
      if (editNotes[d.key] !== undefined) payload[`${d.key}Notes`] = editNotes[d.key];
    }
    saveMutation.mutate(payload);
  }

  function togglePhase(phase: AlignPhaseKey) {
    setPhaseCoverage((prev) =>
      prev.includes(phase) ? prev.filter((p) => p !== phase) : [...prev, phase]
    );
  }

  function addProgram() {
    if (!newProgram.name.trim()) return;
    setPrograms((prev) => [...prev, { ...newProgram }]);
    setNewProgram({ name: "", phases: [], participants: 0 });
  }

  const currentPhase: AlignPhaseKey = profile?.currentPhase ?? "assess";
  const phaseIdx = PHASE_ORDER.indexOf(currentPhase);
  const phaseInfo = ALIGN_PHASES.find((p) => p.key === currentPhase)!;
  const PhaseIcon = PHASE_ICONS[currentPhase];
  const ctx = ORG_PHASE_CONTEXT[currentPhase];
  const nextPhase = PHASE_ORDER[phaseIdx + 1] as AlignPhaseKey | undefined;

  // ── Entry screen (before org name entered) ──────────────────────────────────
  if (!started && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4" data-testid="page-align-org-entry">
        <div className="max-w-md w-full space-y-6 text-center">
          <img src={alignLogo} alt="ALIGN" className="w-20 h-20 rounded-full bg-white mx-auto shadow-xl object-contain" />
          <div>
            <h1 className="text-xl font-black">Organizational ALIGN Assessment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              The same Spirit · Soul · Body framework — applied to your organization.
              Understand where you are, map your programs to phases, and build toward collective THRIVE.
            </p>
          </div>
          <Card className="border text-left">
            <CardContent className="pt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold">Organization Name</label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your organization's name"
                  className="mt-1"
                  data-testid="input-org-name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">Organization Type</label>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ORG_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrgType(t)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${orgType === t ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"}`}
                      data-testid={`button-org-type-${t.toLowerCase().replace(/\s+/g, "-")}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full gap-1" onClick={handleStart} disabled={saveMutation.isPending} data-testid="button-start-org-assessment">
                {saveMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                Begin Organizational Assessment
              </Button>
            </CardContent>
          </Card>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
            <Link href="/align/community"><button className="hover:underline flex items-center gap-1"><Globe className="h-3 w-3" /> Community Overview</button></Link>
            <span>·</span>
            <Link href="/align"><button className="hover:underline">ALIGN Home</button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-align-org-assessment">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="border-b px-4 py-5 sm:px-6"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #064e3b 100%)" }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img src={alignLogo} alt="ALIGN" className="w-14 h-14 rounded-full bg-white object-contain flex-shrink-0" />
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Organizational ALIGN Assessment</p>
            <h1 className="text-lg font-black text-white">{profile?.orgName ?? orgName}</h1>
            {profile?.orgType && <Badge className="mt-1 bg-white/10 text-white/70 border-white/20 text-[10px]">{profile.orgType}</Badge>}
            <div className="mt-2"><AlignProgressBar phase={currentPhase} /></div>
          </div>
          <div className="sm:ml-auto flex-shrink-0 text-center sm:text-right">
            <p className="text-[10px] text-white/50 mb-1">Org phase</p>
            <p className="text-sm font-black text-white capitalize">{currentPhase}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* ── Current phase context ────────────────────────────────── */}
        <Card className={`border-2 ${phaseInfo.bg}`} data-testid="card-org-current-phase">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${phaseInfo.bg}`}>
                <PhaseIcon className={`h-5 w-5 ${phaseInfo.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Organizational Phase</p>
                <CardTitle className={`text-base ${phaseInfo.color}`}>{phaseInfo.letter} — {phaseInfo.label}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">{ctx.orgDesc}</p>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Reflective Questions</p>
              {ctx.questions.map((q) => (
                <div key={q} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
            {nextPhase && (
              <Button size="sm" variant="outline" className="gap-1 mt-2"
                disabled={advanceMutation.isPending}
                onClick={() => advanceMutation.mutate(nextPhase)}
                data-testid="button-org-advance-phase">
                {advanceMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                Advance to {ALIGN_PHASES.find((p) => p.key === nextPhase)?.label}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Mission · Culture · Capacity ────────────────────────── */}
        <div data-testid="section-org-dimensions">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Mission · Culture · Capacity Assessment
          </p>
          <div className="space-y-4">
            {ORG_DIMENSIONS.map((d) => {
              const Icon = d.icon;
              const score = editScores[d.key] ?? profile?.[`${d.key}Score`] ?? 0;
              const notes = editNotes[d.key] ?? profile?.[`${d.key}Notes`] ?? "";
              return (
                <Card key={d.key} data-testid={`card-org-dimension-${d.key}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${d.color}`} />
                      <div>
                        <span className="font-semibold text-sm">{d.label}</span>
                        <span className="text-[10px] text-muted-foreground ml-1">({d.sublabel})</span>
                      </div>
                      <span className={`ml-auto text-xs font-bold ${d.color}`}>{score}/100</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.question}</p>
                    <p className="text-[10px] text-muted-foreground/70 italic">{d.hint}</p>
                    <Progress value={score} className="h-2" />
                    <input type="range" min={0} max={100} value={score}
                      onChange={(e) => setEditScores((prev) => ({ ...prev, [d.key]: Number(e.target.value) }))}
                      className="w-full accent-current" data-testid={`slider-org-${d.key}`} />
                    <Textarea
                      placeholder={`Notes on your organization's ${d.label.toLowerCase()}…`}
                      value={notes}
                      onChange={(e) => setEditNotes((prev) => ({ ...prev, [d.key]: e.target.value }))}
                      className="text-xs min-h-[60px]"
                      data-testid={`textarea-org-${d.key}`} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button size="sm" className="mt-3 gap-1" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-org-save-dimensions">
            {saveMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
            Save Assessment
          </Button>
        </div>

        {/* ── Phase coverage ───────────────────────────────────────── */}
        <div data-testid="section-phase-coverage">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            ALIGN Phase Coverage
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Which ALIGN phases does your organization's current work actually serve?
            This shows funders and partners where you fit in the community ecosystem.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALIGN_PHASES.map((p) => {
              const Icon = PHASE_ICONS[p.key as AlignPhaseKey];
              const covered = phaseCoverage.includes(p.key as AlignPhaseKey)
                || (profile?.phaseCoverage ?? []).includes(p.key);
              return (
                <button
                  key={p.key}
                  onClick={() => togglePhase(p.key as AlignPhaseKey)}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${covered ? `${p.bg} border-2` : "bg-card hover:bg-muted"}`}
                  data-testid={`button-phase-coverage-${p.key}`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${p.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${p.color}`} />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${covered ? p.color : "text-foreground"}`}>{p.label}</p>
                    {covered && <p className="text-[9px] text-muted-foreground">✓ covered</p>}
                  </div>
                </button>
              );
            })}
          </div>
          <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => saveMutation.mutate({ phaseCoverage })} data-testid="button-save-coverage">
            Save Coverage
          </Button>
        </div>

        {/* ── Programs-to-phases mapping ───────────────────────────── */}
        <div data-testid="section-program-mapping">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Program → Phase Mapping
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Map each of your programs or services to the ALIGN phase(s) it serves.
            This creates a clear picture for funders of what you do and where the gaps are.
          </p>

          {/* Existing programs */}
          {programs.length > 0 && (
            <div className="space-y-2 mb-3">
              {programs.map((p, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border bg-card p-3" data-testid={`card-program-${i}`}>
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{p.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.phases.map((ph) => {
                        const info = ALIGN_PHASES.find((x) => x.key === ph)!;
                        return <Badge key={ph} className={`text-[9px] ${info.bg} ${info.color} border`}>{info.label}</Badge>;
                      })}
                    </div>
                    {p.participants > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">{p.participants.toLocaleString()} participants served</p>}
                  </div>
                  <button onClick={() => setPrograms((prev) => prev.filter((_, j) => j !== i))} data-testid={`button-remove-program-${i}`}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new program */}
          <Card className="border">
            <CardContent className="pt-4 space-y-3">
              <p className="text-xs font-semibold">Add a Program</p>
              <Input
                placeholder="Program or service name"
                value={newProgram.name}
                onChange={(e) => setNewProgram((p) => ({ ...p, name: e.target.value }))}
                className="text-xs"
                data-testid="input-program-name"
              />
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Which ALIGN phases does it serve?</p>
                <div className="flex flex-wrap gap-1">
                  {ALIGN_PHASES.map((ph) => {
                    const selected = newProgram.phases.includes(ph.key as AlignPhaseKey);
                    return (
                      <button
                        key={ph.key}
                        onClick={() => setNewProgram((p) => ({
                          ...p,
                          phases: selected ? p.phases.filter((x) => x !== ph.key) : [...p.phases, ph.key as AlignPhaseKey],
                        }))}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${selected ? `${ph.bg} ${ph.color} border-current` : "bg-background hover:bg-muted"}`}
                        data-testid={`button-program-phase-${ph.key}`}>
                        {ph.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Input
                type="number"
                placeholder="Participants served per year (optional)"
                value={newProgram.participants || ""}
                onChange={(e) => setNewProgram((p) => ({ ...p, participants: Number(e.target.value) }))}
                className="text-xs"
                data-testid="input-program-participants"
              />
              <Button size="sm" variant="outline" className="gap-1" onClick={addProgram} data-testid="button-add-program">
                <Plus className="h-3 w-3" /> Add Program
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Link href="/align"><Button variant="ghost" size="sm" data-testid="link-org-back-align">← ALIGN Home</Button></Link>
          <Link href="/align/community"><Button variant="ghost" size="sm" data-testid="link-org-community"><Globe className="h-3 w-3 mr-1" /> Community Overview</Button></Link>
          <Link href="/thrive"><Button variant="ghost" size="sm" data-testid="link-org-thrive">THRIVE →</Button></Link>
        </div>
      </div>
    </div>
  );
}
