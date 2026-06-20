import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlignProgressBar, ALIGN_PHASES, type AlignPhase } from "@/components/align-phase-badge";
import {
  Search, Ear, Puzzle, Compass, Navigation,
  Star, Heart, Brain, PersonStanding,
  ArrowRight, ChevronRight, Sparkles, Users, RefreshCw
} from "lucide-react";
import { useState } from "react";
import alignLogo from "@assets/4C3587C9-E0BC-45FD-9E4E-CD435BE825BD_1781974706746.png";

const PHASE_ICONS = { assess: Search, listen: Ear, integrate: Puzzle, guide: Compass, navigate: Navigation, thrive: Star };
const PHASE_ORDER: AlignPhase[] = ["assess", "listen", "integrate", "guide", "navigate", "thrive"];

const PHASE_DETAILS: Record<AlignPhase, {
  desc: string; next?: string; resources: { label: string; url: string }[];
}> = {
  assess: {
    desc: "Understand where you are — spirit, soul, and body — before deciding where you're going.",
    next: "listen",
    resources: [
      { label: "Benefits Screener", url: "/benefits-screener" },
      { label: "SDOH Explorer", url: "/sdoh-explorer" },
      { label: "Get Help", url: "/get-help" },
    ],
  },
  listen: {
    desc: "Be heard first. Your story, your barriers, your strengths — all of it matters before any plan is made.",
    next: "integrate",
    resources: [
      { label: "Navigator AI", url: "/navigator" },
      { label: "Sparky (AI Companion)", url: "/sparky" },
      { label: "Community Voice", url: "/voice" },
    ],
  },
  integrate: {
    desc: "Connect the dots across health, education, work, family, and community — not one issue at a time.",
    next: "guide",
    resources: [
      { label: "LifeBridge Resources", url: "/ecosystem/lifebridge" },
      { label: "Resource Finder", url: "/resources" },
      { label: "Community Map", url: "/community-map" },
    ],
  },
  guide: {
    desc: "Personalized plans built with you — not handed to you. Your pace, your readiness, your goals.",
    next: "navigate",
    resources: [
      { label: "Transition Plans", url: "/transition-plans" },
      { label: "Academy Pathways", url: "/academy" },
      { label: "Workforce Assessment", url: "/workforce-assessment" },
    ],
  },
  navigate: {
    desc: "Move from awareness to action — with real resources, real relationships, and real accountability.",
    next: "thrive",
    resources: [
      { label: "Mentorship Directory", url: "/mentorship-directory" },
      { label: "Network", url: "/network" },
      { label: "Community Partners", url: "/partners" },
    ],
  },
  thrive: {
    desc: "You have moved from receiving to giving. Empower others. Activate change. Grow. Uplift. Serve.",
    resources: [
      { label: "THRIVE — Your Next Chapter", url: "/thrive" },
      { label: "Open Innovation Lab", url: "/open-innovation-lab" },
      { label: "Initiatives", url: "/initiatives" },
    ],
  },
};

const DIMENSION_QUESTIONS = [
  { key: "spirit", icon: Heart,          color: "text-violet-600 dark:text-violet-400",  label: "Spirit",  question: "Faith, purpose, meaning — how connected do you feel to something larger than yourself?" },
  { key: "soul",   icon: Brain,          color: "text-blue-600 dark:text-blue-400",      label: "Soul",    question: "Emotional wellbeing, relationships, belonging — how are you doing on the inside?" },
  { key: "body",   icon: PersonStanding, color: "text-emerald-600 dark:text-emerald-400",label: "Body",    question: "Housing, health, food, income, safety — how stable is your physical situation?" },
] as const;

export default function AlignJourneyPage() {
  const { toast } = useToast();
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editScores, setEditScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/align/profile"],
  });

  const advanceMutation = useMutation({
    mutationFn: (nextPhase: AlignPhase) =>
      apiRequest("POST", "/api/align/profile", { currentPhase: nextPhase }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/align/profile"] });
      toast({ title: "Phase updated", description: "Your ALIGN journey has advanced." });
    },
  });

  const saveDimensionsMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiRequest("POST", "/api/align/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/align/profile"] });
      setSaving(false);
      toast({ title: "Saved", description: "Your Spirit · Soul · Body reflections are saved." });
    },
  });

  const currentPhase: AlignPhase = profile?.currentPhase ?? "assess";
  const phaseIdx = PHASE_ORDER.indexOf(currentPhase);
  const progressPct = Math.round(((phaseIdx + 1) / PHASE_ORDER.length) * 100);
  const details = PHASE_DETAILS[currentPhase];
  const PhaseIcon = PHASE_ICONS[currentPhase];
  const phaseInfo = ALIGN_PHASES.find((p) => p.key === currentPhase)!;

  function handleSave() {
    setSaving(true);
    const payload: Record<string, unknown> = {};
    for (const d of DIMENSION_QUESTIONS) {
      if (editScores[d.key] !== undefined) payload[`${d.key}Score`] = editScores[d.key];
      if (editNotes[d.key] !== undefined) payload[`${d.key}Notes`] = editNotes[d.key];
    }
    saveDimensionsMutation.mutate(payload);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="align-journey-loading">
        <div className="text-center space-y-3">
          <img src={alignLogo} alt="ALIGN" className="w-16 h-16 rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading your journey…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="page-align-journey">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="border-b px-4 py-5 sm:px-6"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #1a3a2a 100%)" }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img src={alignLogo} alt="ALIGN" className="w-14 h-14 rounded-full bg-white object-contain flex-shrink-0" />
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">My ALIGN Journey</p>
            <h1 className="text-lg font-black text-white">Aligning People with Purpose</h1>
            <div className="mt-2">
              <AlignProgressBar phase={currentPhase} />
            </div>
          </div>
          <div className="sm:ml-auto flex-shrink-0 text-center sm:text-right">
            <p className="text-[10px] text-white/50 mb-1">Overall progress</p>
            <p className="text-2xl font-black text-white">{progressPct}%</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 space-y-6">

        {/* ── Current phase card ──────────────────────────────────────── */}
        <Card className={`border-2 ${phaseInfo.bg}`} data-testid="card-current-phase">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${phaseInfo.bg}`}>
                <PhaseIcon className={`h-5 w-5 ${phaseInfo.color}`} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Phase</p>
                <CardTitle className={`text-lg ${phaseInfo.color}`}>
                  {currentPhase === "thrive" ? "★ THRIVE" : `${phaseInfo.letter} — ${phaseInfo.label}`}
                </CardTitle>
              </div>
              {currentPhase === "thrive" && (
                <Link href="/thrive" className="sm:ml-auto">
                  <Button size="sm" className="gap-1" data-testid="button-go-thrive">
                    <Sparkles className="h-3 w-3" /> Open THRIVE
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{details.desc}</p>

            {/* Resources for this phase */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {currentPhase === "thrive" ? "Your Contribution Pathways" : "Recommended Next Steps"}
              </p>
              <div className="flex flex-wrap gap-2">
                {details.resources.map((r) => (
                  <Link key={r.url} href={r.url}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10 gap-1" data-testid={`badge-phase-resource-${r.label.toLowerCase().replace(/\s+/g, "-")}`}>
                      {r.label} <ChevronRight className="h-3 w-3" />
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            {/* Advance button */}
            {details.next && (
              <div className="pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={advanceMutation.isPending}
                  onClick={() => advanceMutation.mutate(details.next as AlignPhase)}
                  data-testid="button-advance-phase">
                  {advanceMutation.isPending ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                  Advance to {ALIGN_PHASES.find((p) => p.key === details.next)?.label}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">Only advance when you feel genuinely ready — at your own pace.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Spirit · Soul · Body ────────────────────────────────────── */}
        <div data-testid="section-dimensions">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Spirit · Soul · Body Reflection
          </p>
          <div className="space-y-4">
            {DIMENSION_QUESTIONS.map((d) => {
              const Icon = d.icon;
              const score = editScores[d.key] ?? profile?.[`${d.key}Score`] ?? 0;
              const notes = editNotes[d.key] ?? profile?.[`${d.key}Notes`] ?? "";
              return (
                <Card key={d.key} className="border" data-testid={`card-dimension-${d.key}`}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${d.color}`} />
                      <p className="font-semibold text-sm">{d.label}</p>
                      <span className={`ml-auto text-xs font-bold ${d.color}`}>{score}/100</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{d.question}</p>
                    <Progress value={score} className="h-2" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={score}
                      onChange={(e) => setEditScores((prev) => ({ ...prev, [d.key]: Number(e.target.value) }))}
                      className="w-full accent-current"
                      data-testid={`slider-${d.key}`}
                    />
                    <Textarea
                      placeholder={`Reflect on your ${d.label.toLowerCase()}…`}
                      value={notes}
                      onChange={(e) => setEditNotes((prev) => ({ ...prev, [d.key]: e.target.value }))}
                      className="text-xs min-h-[60px]"
                      data-testid={`textarea-${d.key}-notes`}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Button
            className="mt-3 gap-1"
            size="sm"
            onClick={handleSave}
            disabled={saving || saveDimensionsMutation.isPending}
            data-testid="button-save-dimensions">
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
            Save Reflections
          </Button>
        </div>

        {/* ── Full phase map ──────────────────────────────────────────── */}
        <div data-testid="section-phase-map">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Your Full Journey
          </p>
          <div className="space-y-2">
            {PHASE_ORDER.map((phase, i) => {
              const info = ALIGN_PHASES.find((p) => p.key === phase)!;
              const Icon = PHASE_ICONS[phase];
              const isActive = phase === currentPhase;
              const isDone = i < phaseIdx;
              return (
                <div key={phase}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all
                    ${isActive ? `${info.bg} border-2` : isDone ? "bg-muted/30" : "bg-card opacity-60"}`}
                  data-testid={`row-phase-${phase}`}>
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
                    ${isActive || isDone ? info.bg : "bg-muted"}`}>
                    <Icon className={`h-4 w-4 ${isActive || isDone ? info.color : "text-muted-foreground"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${isActive ? info.color : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                      {phase === "thrive" ? "★ THRIVE" : `${info.letter} — ${info.label}`}
                      {isActive && <span className="ml-2 text-[10px] font-normal">← you are here</span>}
                      {isDone && <span className="ml-2 text-[10px] font-normal text-emerald-600">✓ completed</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{PHASE_DETAILS[phase].desc.slice(0, 70)}…</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer links ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Link href="/align">
            <Button variant="ghost" size="sm" data-testid="link-back-align">← ALIGN Home</Button>
          </Link>
          <Link href="/thrive">
            <Button variant="ghost" size="sm" data-testid="link-to-thrive">THRIVE →</Button>
          </Link>
          <Link href="/transition-plans">
            <Button variant="ghost" size="sm" data-testid="link-transition-plans">Transition Plans →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
