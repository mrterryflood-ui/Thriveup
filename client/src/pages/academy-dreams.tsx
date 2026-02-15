import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { AcademyDreamProfile } from "@shared/schema";
import {
  Target,
  GraduationCap,
  Star,
  Heart,
  Brain,
  Lightbulb,
  Rocket,
  Plus,
  X,
  Pencil,
  Award,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";

interface ScoreItem {
  label: string;
  key: "academicScore" | "leadershipScore" | "communityScore" | "wellnessScore";
  icon: typeof Star;
  color: string;
  bgColor: string;
}

const SCORE_ITEMS: ScoreItem[] = [
  { label: "Academic", key: "academicScore", icon: GraduationCap, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
  { label: "Leadership", key: "leadershipScore", icon: Award, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
  { label: "Community", key: "communityScore", icon: Users, color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" },
  { label: "Wellness", key: "wellnessScore", icon: Heart, color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-100 dark:bg-rose-900/30" },
];

const MILESTONES = [
  { stage: "6th Grade", description: "Discover your passion", icon: Lightbulb },
  { stage: "7th-8th Grade", description: "Develop your skills", icon: Brain },
  { stage: "9th-10th Grade", description: "Build your portfolio", icon: TrendingUp },
  { stage: "11th-12th Grade", description: "Apply to your dream school", icon: GraduationCap },
  { stage: "Beyond", description: "Launch your career", icon: Rocket },
];

function DreamProfileView({ profile, onEdit }: { profile: AcademyDreamProfile; onEdit: () => void }) {
  const readinessScore = Math.round(
    (profile.academicScore + profile.leadershipScore + profile.communityScore + profile.wellnessScore) / 4
  );

  return (
    <div className="space-y-6">
      <Card className="p-6" data-testid="card-dream-profile">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Dream Profile
            </h2>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit} data-testid="button-edit-profile">
            <Pencil className="h-4 w-4 mr-1" /> Edit Profile
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Dream Career</p>
            <p className="font-medium" data-testid="text-dream-career">{profile.dreamCareer || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Dream College</p>
            <p className="font-medium" data-testid="text-dream-college">{profile.dreamCollege || "Not set"}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-holistic-scores">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" /> Holistic Resume Scores
          </h2>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Readiness Score</p>
            <p className="text-2xl font-bold" data-testid="text-readiness-score">{readinessScore}</p>
          </div>
        </div>
        <div className="space-y-4">
          {SCORE_ITEMS.map((item) => {
            const Icon = item.icon;
            const value = profile[item.key];
            return (
              <div key={item.key} data-testid={`score-${item.key}`}>
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`rounded-md p-1.5 ${item.bgColor}`}>
                      <Icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold">{value}/100</span>
                </div>
                <Progress value={value} className="h-2.5" />
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6" data-testid="card-short-term-goals">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" /> Short-Term Goals
          </h2>
          {profile.shortTermGoals.length > 0 ? (
            <div className="space-y-2">
              {profile.shortTermGoals.map((goal, i) => (
                <Card key={i} className="p-3" data-testid={`card-short-goal-${i}`}>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{goal}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No short-term goals set yet.</p>
          )}
        </Card>

        <Card className="p-6" data-testid="card-long-term-goals">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Rocket className="h-5 w-5 text-primary" /> Long-Term Goals
          </h2>
          {profile.longTermGoals.length > 0 ? (
            <div className="space-y-2">
              {profile.longTermGoals.map((goal, i) => (
                <Card key={i} className="p-3" data-testid={`card-long-goal-${i}`}>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-sm">{goal}</span>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No long-term goals set yet.</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6" data-testid="card-strengths">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" /> My Strengths
          </h2>
          {profile.strengths.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.strengths.map((s, i) => (
                <Badge key={i} variant="secondary" data-testid={`badge-strength-${i}`}>{s}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No strengths added yet.</p>
          )}
        </Card>

        <Card className="p-6" data-testid="card-growth-areas">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Brain className="h-5 w-5 text-primary" /> Growth Areas
          </h2>
          {profile.growthAreas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.growthAreas.map((g, i) => (
                <Badge key={i} variant="outline" data-testid={`badge-growth-${i}`}>{g}</Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No growth areas added yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function DreamProfileForm({
  profile,
  onCancel,
}: {
  profile: AcademyDreamProfile | null;
  onCancel: () => void;
}) {
  const { toast } = useToast();

  const [dreamCareer, setDreamCareer] = useState(profile?.dreamCareer ?? "");
  const [dreamCollege, setDreamCollege] = useState(profile?.dreamCollege ?? "");
  const [shortTermGoals, setShortTermGoals] = useState<string[]>(profile?.shortTermGoals ?? []);
  const [longTermGoals, setLongTermGoals] = useState<string[]>(profile?.longTermGoals ?? []);
  const [strengths, setStrengths] = useState<string[]>(profile?.strengths ?? []);
  const [growthAreas, setGrowthAreas] = useState<string[]>(profile?.growthAreas ?? []);
  const [academicScore, setAcademicScore] = useState(profile?.academicScore ?? 0);
  const [leadershipScore, setLeadershipScore] = useState(profile?.leadershipScore ?? 0);
  const [communityScore, setCommunityScore] = useState(profile?.communityScore ?? 0);
  const [wellnessScore, setWellnessScore] = useState(profile?.wellnessScore ?? 0);

  const [newShortGoal, setNewShortGoal] = useState("");
  const [newLongGoal, setNewLongGoal] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newGrowthArea, setNewGrowthArea] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/academy/dream-profile", {
        dreamCareer,
        dreamCollege,
        shortTermGoals,
        longTermGoals,
        strengths,
        growthAreas,
        academicScore,
        leadershipScore,
        communityScore,
        wellnessScore,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/dream-profile"] });
      toast({ title: "Dream profile saved!" });
      onCancel();
    },
    onError: () => {
      toast({ title: "Failed to save profile", variant: "destructive" });
    },
  });

  function addItem(list: string[], setList: (v: string[]) => void, value: string, setInput: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setInput("");
    }
  }

  function removeItem(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index));
  }

  function clampScore(val: string): number {
    const n = parseInt(val, 10);
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  return (
    <Card className="p-6" data-testid="card-dream-form">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
        <Pencil className="h-5 w-5 text-primary" /> {profile ? "Edit" : "Create"} Dream Profile
      </h2>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Dream Career</label>
            <Input
              value={dreamCareer}
              onChange={(e) => setDreamCareer(e.target.value)}
              placeholder="e.g. Software Engineer"
              data-testid="input-dream-career"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Dream College</label>
            <Input
              value={dreamCollege}
              onChange={(e) => setDreamCollege(e.target.value)}
              placeholder="e.g. MIT"
              data-testid="input-dream-college"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Short-Term Goals</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newShortGoal}
                onChange={(e) => setNewShortGoal(e.target.value)}
                placeholder="Add a short-term goal"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(shortTermGoals, setShortTermGoals, newShortGoal, setNewShortGoal))}
                data-testid="input-short-term-goal"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(shortTermGoals, setShortTermGoals, newShortGoal, setNewShortGoal)}
                data-testid="button-add-short-goal"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {shortTermGoals.map((goal, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-sm">{goal}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(shortTermGoals, setShortTermGoals, i)}
                    data-testid={`button-remove-short-goal-${i}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Long-Term Goals</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newLongGoal}
                onChange={(e) => setNewLongGoal(e.target.value)}
                placeholder="Add a long-term goal"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(longTermGoals, setLongTermGoals, newLongGoal, setNewLongGoal))}
                data-testid="input-long-term-goal"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(longTermGoals, setLongTermGoals, newLongGoal, setNewLongGoal)}
                data-testid="button-add-long-goal"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {longTermGoals.map((goal, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2">
                  <span className="text-sm">{goal}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeItem(longTermGoals, setLongTermGoals, i)}
                    data-testid={`button-remove-long-goal-${i}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Strengths</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                placeholder="Add a strength"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(strengths, setStrengths, newStrength, setNewStrength))}
                data-testid="input-strength"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(strengths, setStrengths, newStrength, setNewStrength)}
                data-testid="button-add-strength"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {strengths.map((s, i) => (
                <Badge key={i} variant="secondary" className="gap-1" data-testid={`badge-form-strength-${i}`}>
                  {s}
                  <button onClick={() => removeItem(strengths, setStrengths, i)} className="ml-0.5" data-testid={`button-remove-strength-${i}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Growth Areas</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newGrowthArea}
                onChange={(e) => setNewGrowthArea(e.target.value)}
                placeholder="Add a growth area"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(growthAreas, setGrowthAreas, newGrowthArea, setNewGrowthArea))}
                data-testid="input-growth-area"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => addItem(growthAreas, setGrowthAreas, newGrowthArea, setNewGrowthArea)}
                data-testid="button-add-growth-area"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {growthAreas.map((g, i) => (
                <Badge key={i} variant="outline" className="gap-1" data-testid={`badge-form-growth-${i}`}>
                  {g}
                  <button onClick={() => removeItem(growthAreas, setGrowthAreas, i)} className="ml-0.5" data-testid={`button-remove-growth-${i}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Holistic Resume Scores</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Academic (0-100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={academicScore}
                onChange={(e) => setAcademicScore(clampScore(e.target.value))}
                data-testid="input-academic-score"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Leadership (0-100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={leadershipScore}
                onChange={(e) => setLeadershipScore(clampScore(e.target.value))}
                data-testid="input-leadership-score"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Community (0-100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={communityScore}
                onChange={(e) => setCommunityScore(clampScore(e.target.value))}
                data-testid="input-community-score"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Wellness (0-100)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={wellnessScore}
                onChange={(e) => setWellnessScore(clampScore(e.target.value))}
                data-testid="input-wellness-score"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-2">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-dream-profile">
            {saveMutation.isPending ? "Saving..." : "Save Dream Profile"}
          </Button>
          {profile && (
            <Button variant="outline" onClick={onCancel} data-testid="button-cancel-edit">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function AcademyDreamsPage() {
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading, error } = useQuery<AcademyDreamProfile>({
    queryKey: ["/api/academy/dream-profile"],
  });

  const hasProfile = !!profile && !error;

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-72 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="page-academy-dreams">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" data-testid="text-page-title">
          Dream Design & Assessment
        </h1>
        <p className="text-muted-foreground" data-testid="text-page-subtitle">
          Plan your future, build your holistic resume
        </p>
      </div>

      {editing || !hasProfile ? (
        <DreamProfileForm
          profile={hasProfile ? profile : null}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <DreamProfileView profile={profile} onEdit={() => setEditing(true)} />
      )}

      <div className="mt-10" data-testid="section-milestones">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Rocket className="h-6 w-6 text-primary" /> Your Future Is Bright
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MILESTONES.map((ms, i) => {
            const Icon = ms.icon;
            return (
              <Card key={i} className="p-4 text-center" data-testid={`card-milestone-${i}`}>
                <div className="rounded-md p-2.5 bg-primary/10 inline-flex mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-semibold text-sm mb-1">{ms.stage}</p>
                <p className="text-xs text-muted-foreground">{ms.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
