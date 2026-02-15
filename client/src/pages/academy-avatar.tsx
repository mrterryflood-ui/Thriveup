import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Save, Users, Scissors, Shirt, Glasses,
  Eye, Palette, User, Crown, Star,
  GraduationCap, Target, Loader2,
  Battery, Heart, Shield, Smile
} from "lucide-react";
import { Link } from "wouter";
import type { AcademyAvatar } from "@shared/schema";

interface SelfAssessmentData {
  id: string;
  energyLevel: number | null;
  stressLevel: number | null;
  focusLevel: number | null;
  belongingLevel: number | null;
  confidenceLevel: number | null;
  moodRating: number | null;
  reflectionText: string | null;
  goalsForToday: string | null;
  gratitudeNote: string | null;
  createdAt: string;
}

function getTraitBarColor(value: number): string {
  if (value >= 7) return "bg-emerald-500";
  if (value >= 4) return "bg-amber-500";
  return "bg-red-500";
}

function getTraitBgColor(value: number): string {
  if (value >= 7) return "bg-emerald-500/15";
  if (value >= 4) return "bg-amber-500/15";
  return "bg-red-500/15";
}

const PERSONALITY_TRAITS = [
  { key: "energy", label: "Energy", field: "energyLevel" as const, icon: Battery },
  { key: "calm", label: "Calm", field: "stressLevel" as const, icon: Heart, invert: true },
  { key: "focus", label: "Focus", field: "focusLevel" as const, icon: Target },
  { key: "connection", label: "Connection", field: "belongingLevel" as const, icon: Users },
  { key: "confidence", label: "Confidence", field: "confidenceLevel" as const, icon: Shield },
  { key: "mood", label: "Mood", field: "moodRating" as const, icon: Smile },
] as const;

const SKIN_TONES = ["#F5D6BA", "#E8B88A", "#C68642", "#8B6914", "#6B4226", "#3B2414"];
const HAIR_COLORS = ["#1a1a1a", "#4a3728", "#8B4513", "#DAA520", "#C0392B", "#2C3E50"];
const HAIR_STYLES = ["short", "medium", "long", "braids", "locs", "fade", "afro", "twists"];
const OUTFITS = ["casual", "formal", "athletic", "creative", "tech"];
const ACCESSORIES = ["none", "glasses", "headband", "watch", "necklace", "hat"];
const ROLES = ["student", "mentor", "team_captain", "class_president"];

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  mentor: "Mentor",
  team_captain: "Team Captain",
  class_president: "Class President",
};

const HAIR_STYLE_LABELS: Record<string, string> = {
  short: "Short",
  medium: "Medium",
  long: "Long",
  braids: "Braids",
  locs: "Locs",
  fade: "Fade",
  afro: "Afro",
  twists: "Twists",
};

const OUTFIT_LABELS: Record<string, string> = {
  casual: "Casual",
  formal: "Formal",
  athletic: "Athletic",
  creative: "Creative",
  tech: "Tech",
};

const ACCESSORY_LABELS: Record<string, string> = {
  none: "None",
  glasses: "Glasses",
  headband: "Headband",
  watch: "Watch",
  necklace: "Necklace",
  hat: "Hat",
};

const BACKGROUND_SCENES: Record<string, { gradient: string; label: string }> = {
  school: { gradient: "from-blue-200 to-sky-300 dark:from-blue-900 dark:to-sky-800", label: "School" },
  park: { gradient: "from-green-200 to-emerald-300 dark:from-green-900 dark:to-emerald-800", label: "Park" },
  library: { gradient: "from-amber-200 to-orange-300 dark:from-amber-900 dark:to-orange-800", label: "Library" },
  space: { gradient: "from-rose-300 to-red-400 dark:from-rose-900 dark:to-red-800", label: "Space" },
};

interface AvatarFormState {
  displayName: string;
  role: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
  background: string;
  bio: string;
  dreamGoal: string;
}

const DEFAULT_STATE: AvatarFormState = {
  displayName: "",
  role: "student",
  skinTone: "#8B6914",
  hairStyle: "short",
  hairColor: "#1a1a1a",
  outfit: "casual",
  outfitColor: "#4F46E5",
  accessory: "none",
  background: "school",
  bio: "",
  dreamGoal: "",
};

function ColorSwatches({
  colors,
  selected,
  onSelect,
  testIdPrefix,
}: {
  colors: string[];
  selected: string;
  onSelect: (color: string) => void;
  testIdPrefix: string;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          data-testid={`${testIdPrefix}-${color}`}
          onClick={() => onSelect(color)}
          className={`w-8 h-8 rounded-md border-2 transition-all shrink-0 ${
            selected === color
              ? "border-primary ring-2 ring-primary/30 scale-110"
              : "border-border"
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function AvatarPreview({ form }: { form: AvatarFormState }) {
  const bg = BACKGROUND_SCENES[form.background] || BACKGROUND_SCENES.school;

  const hairTopOffset = (): string => {
    switch (form.hairStyle) {
      case "afro": return "-20px";
      case "long": return "-10px";
      case "braids": return "-8px";
      case "locs": return "-8px";
      case "twists": return "-8px";
      default: return "-6px";
    }
  };

  const hairWidth = (): string => {
    switch (form.hairStyle) {
      case "afro": return "120px";
      case "long": return "100px";
      case "braids": return "95px";
      case "locs": return "95px";
      default: return "90px";
    }
  };

  const hairHeight = (): string => {
    switch (form.hairStyle) {
      case "afro": return "70px";
      case "long": return "65px";
      case "medium": return "50px";
      case "braids": return "60px";
      case "locs": return "60px";
      case "twists": return "55px";
      case "fade": return "30px";
      default: return "35px";
    }
  };

  const hairBorderRadius = (): string => {
    switch (form.hairStyle) {
      case "afro": return "50%";
      case "fade": return "50% 50% 0 0";
      case "braids": return "40% 40% 10% 10%";
      case "locs": return "40% 40% 10% 10%";
      case "twists": return "40% 40% 10% 10%";
      default: return "50% 50% 20% 20%";
    }
  };

  return (
    <div
      data-testid="avatar-preview"
      className={`relative w-full max-w-xs mx-auto aspect-[3/4] rounded-md overflow-hidden bg-gradient-to-b ${bg.gradient}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="relative" style={{ width: "90px", height: "90px" }}>
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10"
            style={{
              top: hairTopOffset(),
              width: hairWidth(),
              height: hairHeight(),
              backgroundColor: form.hairColor,
              borderRadius: hairBorderRadius(),
            }}
          />
          <div
            data-testid="avatar-head"
            className="relative z-20 rounded-full w-full h-full"
            style={{ backgroundColor: form.skinTone }}
          >
            <div className="absolute top-[35%] left-[25%] w-2.5 h-2.5 rounded-full bg-white">
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-gray-800" />
            </div>
            <div className="absolute top-[35%] right-[25%] w-2.5 h-2.5 rounded-full bg-white">
              <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-gray-800" />
            </div>
            <div
              className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-4 h-2 rounded-b-full"
              style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
            />
          </div>
        </div>

        <div
          data-testid="avatar-body"
          className="w-24 h-28 rounded-md mt-1 relative"
          style={{ backgroundColor: form.outfitColor }}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-medium text-white/80 uppercase tracking-wider">
            {OUTFIT_LABELS[form.outfit] || form.outfit}
          </div>
          <div
            className="absolute -left-3 top-1 w-3 h-16 rounded-l-md"
            style={{ backgroundColor: form.skinTone }}
          />
          <div
            className="absolute -right-3 top-1 w-3 h-16 rounded-r-md"
            style={{ backgroundColor: form.skinTone }}
          />
        </div>

        {form.accessory !== "none" && (
          <Badge
            variant="secondary"
            className="absolute top-3 right-3"
            data-testid="avatar-accessory-badge"
          >
            {ACCESSORY_LABELS[form.accessory] || form.accessory}
          </Badge>
        )}

        <div className="absolute bottom-3 left-0 right-0 text-center">
          <p
            className="font-semibold text-sm text-foreground drop-shadow-sm"
            data-testid="avatar-display-name"
          >
            {form.displayName || "Your Name"}
          </p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[form.role] || form.role}
          </p>
        </div>
      </div>

      <div className="absolute top-3 left-3">
        <span className="text-xs text-muted-foreground font-medium">
          {HAIR_STYLE_LABELS[form.hairStyle] || form.hairStyle}
        </span>
      </div>
    </div>
  );
}

function CommunityAvatarCard({ avatar }: { avatar: AcademyAvatar }) {
  const bg = BACKGROUND_SCENES[avatar.background] || BACKGROUND_SCENES.school;
  return (
    <Card
      className="overflow-hidden hover-elevate"
      data-testid={`community-avatar-${avatar.id}`}
    >
      <div className={`h-20 bg-gradient-to-r ${bg.gradient} flex items-center justify-center`}>
        <div className="flex items-center gap-2">
          <div
            className="w-12 h-12 rounded-full border-2 border-white/50"
            style={{ backgroundColor: avatar.skinTone }}
          />
          <div
            className="w-8 h-10 rounded-md"
            style={{ backgroundColor: avatar.outfitColor }}
          />
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate" data-testid={`community-name-${avatar.id}`}>
          {avatar.displayName}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {ROLE_LABELS[avatar.role] || avatar.role}
          </Badge>
          {avatar.accessory !== "none" && (
            <span className="text-xs text-muted-foreground">
              {ACCESSORY_LABELS[avatar.accessory] || avatar.accessory}
            </span>
          )}
        </div>
        {avatar.bio && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{avatar.bio}</p>
        )}
      </div>
    </Card>
  );
}

export default function AcademyAvatarPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<AvatarFormState>(DEFAULT_STATE);

  const { data: existingAvatar, isLoading: avatarLoading } = useQuery<AcademyAvatar | null>({
    queryKey: ["/api/academy/avatar"],
    retry: false,
  });

  const { data: allAvatars, isLoading: avatarsLoading } = useQuery<AcademyAvatar[]>({
    queryKey: ["/api/academy/avatars"],
  });

  const { data: selfAssessment, isLoading: assessmentLoading } = useQuery<SelfAssessmentData | null>({
    queryKey: ["/api/self-assessments/latest"],
  });

  useEffect(() => {
    if (existingAvatar) {
      setForm({
        displayName: existingAvatar.displayName,
        role: existingAvatar.role,
        skinTone: existingAvatar.skinTone,
        hairStyle: existingAvatar.hairStyle,
        hairColor: existingAvatar.hairColor,
        outfit: existingAvatar.outfit,
        outfitColor: existingAvatar.outfitColor,
        accessory: existingAvatar.accessory,
        background: existingAvatar.background,
        bio: existingAvatar.bio,
        dreamGoal: existingAvatar.dreamGoal,
      });
    }
  }, [existingAvatar]);

  const mutation = useMutation({
    mutationFn: async (data: AvatarFormState) => {
      await apiRequest("POST", "/api/academy/avatar", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/avatar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/avatars"] });
      toast({ title: "Avatar saved", description: "Your avatar has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save avatar.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!form.displayName.trim()) {
      toast({ title: "Name required", description: "Please enter a display name.", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const updateField = <K extends keyof AvatarFormState>(key: K, value: AvatarFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (avatarLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto" data-testid="academy-avatar-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" data-testid="text-avatar-title">
          Avatar & Community
        </h1>
        <p className="text-muted-foreground">
          Customize your academy avatar and see your classmates
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div>
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Avatar Preview
            </h2>
            <AvatarPreview form={form} />

            <div className="mt-4">
              <Label className="text-sm text-muted-foreground mb-2 block">Background Scene</Label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(BACKGROUND_SCENES).map(([key, scene]) => (
                  <Button
                    key={key}
                    variant={form.background === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateField("background", key)}
                    data-testid={`button-bg-${key}`}
                  >
                    {scene.label}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" /> Customize
            </h2>

            <div className="space-y-5">
              <div>
                <Label htmlFor="displayName" data-testid="label-display-name">Display Name</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  placeholder="Enter your name"
                  data-testid="input-display-name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label data-testid="label-role">Role</Label>
                <Select value={form.role} onValueChange={(v) => updateField("role", v)}>
                  <SelectTrigger className="mt-1" data-testid="select-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r} data-testid={`select-role-${r}`}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label data-testid="label-skin-tone">Skin Tone</Label>
                <div className="mt-1">
                  <ColorSwatches
                    colors={SKIN_TONES}
                    selected={form.skinTone}
                    onSelect={(c) => updateField("skinTone", c)}
                    testIdPrefix="swatch-skin"
                  />
                </div>
              </div>

              <div>
                <Label data-testid="label-hair-style">Hair Style</Label>
                <Select value={form.hairStyle} onValueChange={(v) => updateField("hairStyle", v)}>
                  <SelectTrigger className="mt-1" data-testid="select-hair-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HAIR_STYLES.map((h) => (
                      <SelectItem key={h} value={h} data-testid={`select-hair-${h}`}>
                        {HAIR_STYLE_LABELS[h]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label data-testid="label-hair-color">Hair Color</Label>
                <div className="mt-1">
                  <ColorSwatches
                    colors={HAIR_COLORS}
                    selected={form.hairColor}
                    onSelect={(c) => updateField("hairColor", c)}
                    testIdPrefix="swatch-hair"
                  />
                </div>
              </div>

              <div>
                <Label data-testid="label-outfit">Outfit</Label>
                <Select value={form.outfit} onValueChange={(v) => updateField("outfit", v)}>
                  <SelectTrigger className="mt-1" data-testid="select-outfit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTFITS.map((o) => (
                      <SelectItem key={o} value={o} data-testid={`select-outfit-${o}`}>
                        {OUTFIT_LABELS[o]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label data-testid="label-outfit-color">Outfit Color</Label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="color"
                    value={form.outfitColor}
                    onChange={(e) => updateField("outfitColor", e.target.value)}
                    className="w-9 h-9 rounded-md border border-border cursor-pointer"
                    data-testid="input-outfit-color"
                  />
                  <span className="text-sm text-muted-foreground">{form.outfitColor}</span>
                </div>
              </div>

              <div>
                <Label data-testid="label-accessory">Accessory</Label>
                <Select value={form.accessory} onValueChange={(v) => updateField("accessory", v)}>
                  <SelectTrigger className="mt-1" data-testid="select-accessory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCESSORIES.map((a) => (
                      <SelectItem key={a} value={a} data-testid={`select-accessory-${a}`}>
                        {ACCESSORY_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bio" data-testid="label-bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => updateField("bio", e.target.value.slice(0, 200))}
                  placeholder="Tell us about yourself..."
                  className="mt-1 resize-none"
                  rows={3}
                  data-testid="textarea-bio"
                />
                <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/200</p>
              </div>

              <div>
                <Label htmlFor="dreamGoal" data-testid="label-dream-goal">Dream Goal</Label>
                <Textarea
                  id="dreamGoal"
                  value={form.dreamGoal}
                  onChange={(e) => updateField("dreamGoal", e.target.value.slice(0, 200))}
                  placeholder="What do you dream of achieving?"
                  className="mt-1 resize-none"
                  rows={3}
                  data-testid="textarea-dream-goal"
                />
                <p className="text-xs text-muted-foreground mt-1">{form.dreamGoal.length}/200</p>
              </div>

              <Button
                onClick={handleSave}
                disabled={mutation.isPending}
                className="w-full"
                data-testid="button-save-avatar"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Avatar
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-12" data-testid="section-personality-profile">
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2" data-testid="text-personality-title">
          <Smile className="h-6 w-6 text-primary" /> My Personality Profile
        </h2>
        <p className="text-muted-foreground mb-6">See yourself as you see yourself</p>

        {assessmentLoading ? (
          <Skeleton className="h-64" data-testid="skeleton-personality" />
        ) : selfAssessment ? (
          <div className="space-y-4">
            <Card className="p-6" data-testid="card-personality-today">
              <div className="flex items-center justify-between gap-2 mb-5 flex-wrap">
                <h3 className="font-semibold text-lg" data-testid="text-personality-card-title">My Personality Today</h3>
                <Badge variant="secondary" data-testid="badge-assessment-date">
                  {new Date(selfAssessment.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              </div>

              <div className="space-y-4">
                {PERSONALITY_TRAITS.map((trait) => {
                  const rawValue = selfAssessment[trait.field];
                  if (rawValue == null) return null;
                  const value = "invert" in trait && trait.invert ? 11 - rawValue : rawValue;
                  const percentage = (value / 10) * 100;
                  const IconComp = trait.icon;

                  return (
                    <div key={trait.key} data-testid={`trait-row-${trait.key}`}>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <div className={`rounded-md p-1.5 shrink-0 ${getTraitBgColor(value)}`}>
                          <IconComp className="h-4 w-4" data-testid={`trait-icon-${trait.key}`} />
                        </div>
                        <span className="text-sm font-medium" data-testid={`trait-label-${trait.key}`}>
                          {trait.label}
                        </span>
                        <span className="ml-auto text-sm font-bold tabular-nums" data-testid={`trait-value-${trait.key}`}>
                          {value}/10
                        </span>
                      </div>
                      <div
                        className="h-3 rounded-md bg-muted overflow-hidden"
                        data-testid={`trait-bar-bg-${trait.key}`}
                      >
                        <div
                          className={`h-full rounded-md transition-all ${getTraitBarColor(value)}`}
                          style={{ width: `${percentage}%` }}
                          data-testid={`trait-bar-fill-${trait.key}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {selfAssessment.reflectionText && (
              <Card className="p-6" data-testid="card-reflection-quote">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  In my own words...
                </p>
                <blockquote
                  className="text-sm italic pl-4 border-l-2 border-primary/30"
                  data-testid="text-reflection"
                >
                  {selfAssessment.reflectionText}
                </blockquote>
              </Card>
            )}

            {selfAssessment.goalsForToday && (
              <Card className="p-6" data-testid="card-goals">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Today's Mission:
                </p>
                <p className="text-sm" data-testid="text-goals">
                  {selfAssessment.goalsForToday}
                </p>
              </Card>
            )}

            {selfAssessment.gratitudeNote && (
              <Card className="p-6" data-testid="card-gratitude">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Grateful for:
                </p>
                <p className="text-sm" data-testid="text-gratitude">
                  {selfAssessment.gratitudeNote}
                </p>
              </Card>
            )}

            <Link href="/academy/self-assessment">
              <Button variant="outline" className="w-full" data-testid="button-update-checkin">
                Update My Check-In
              </Button>
            </Link>
          </div>
        ) : (
          <Card className="p-8 text-center" data-testid="card-no-assessment">
            <Smile className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-4" data-testid="text-no-assessment">
              Complete your Daily Check-In to build your personality profile!
            </p>
            <Link href="/academy/self-assessment">
              <Button data-testid="button-start-checkin">
                Start My Check-In
              </Button>
            </Link>
          </Card>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2" data-testid="text-community-title">
          <Users className="h-6 w-6 text-primary" /> Community
        </h2>
        <p className="text-muted-foreground mb-6">See all academy members</p>

        {avatarsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : allAvatars && allAvatars.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allAvatars.map((avatar) => (
              <CommunityAvatarCard key={avatar.id} avatar={avatar} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No community members yet. Be the first to create your avatar!</p>
          </Card>
        )}
      </div>
      <AcademyWizard wizardType="avatar" steps={WIZARD_STEPS["avatar"]} />
    </div>
  );
}
