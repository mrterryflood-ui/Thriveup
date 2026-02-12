import {
  Footprints, Search, CheckCircle, BookOpen, Wand2, Star,
  GraduationCap, Lightbulb, Building2, Type, Calculator,
  Microscope, Hash, Rocket, TrendingUp, Heart, HandHeart,
  Wind, Scale, Users, Shield, Network, Award, Activity,
  HeartPulse, Sparkles, Sun, TreePine, Lock,
} from "lucide-react";
import type { Badge } from "@shared/schema";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const BADGE_ICON_MAP: Record<string, LucideIcon> = {
  first_steps: Footprints,
  curious_mind: Search,
  quiz_whiz: CheckCircle,
  knowledge_seeker: BookOpen,
  prompt_perfectionist: Wand2,
  perfect_score: Star,
  super_scholar: GraduationCap,
  innovator: Lightbulb,
  ai_architect: Building2,
  letter_learner: Type,
  math_whiz: Calculator,
  science_star: Microscope,
  number_ninja: Hash,
  reading_rocket: Rocket,
  growth_mindset: TrendingUp,
  feelings_friend: Heart,
  kindness_hero: HandHeart,
  calm_champion: Wind,
  ethics_champion: Scale,
  empathy_expert: Users,
  bias_buster: Shield,
  community_catalyst: Network,
  teaching_star: Award,
  healthy_habits: Activity,
  wellness_warrior: HeartPulse,
  self_care_star: Sparkles,
  whole_child: Sun,
  nature_explorer: TreePine,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  skill: "from-blue-500 to-cyan-500",
  character: "from-pink-500 to-rose-500",
  milestone: "from-amber-500 to-orange-500",
};

const RARITY_RING_STYLES: Record<string, string> = {
  common: "ring-2 ring-slate-300 dark:ring-slate-600",
  uncommon: "ring-2 ring-emerald-400 dark:ring-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
  rare: "ring-2 ring-amber-400 dark:ring-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.5)]",
  legendary: "ring-[3px] ring-transparent shadow-[0_0_16px_rgba(168,85,247,0.5),0_0_32px_rgba(251,191,36,0.3)]",
};

const SIZE_MAP = {
  sm: { container: "w-10 h-10", icon: "h-4 w-4" },
  md: { container: "w-14 h-14", icon: "h-6 w-6" },
  lg: { container: "w-20 h-20", icon: "h-9 w-9" },
};

interface BadgeIconProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
  earned?: boolean;
  className?: string;
}

export function BadgeIcon({ badge, size = "md", earned = true, className }: BadgeIconProps) {
  const Icon = BADGE_ICON_MAP[badge.id] || Award;
  const gradient = CATEGORY_GRADIENTS[badge.category] || CATEGORY_GRADIENTS.skill;
  const rarityRing = RARITY_RING_STYLES[badge.rarity] || RARITY_RING_STYLES.common;
  const sizeConfig = SIZE_MAP[size];

  const isLegendary = badge.rarity === "legendary";

  return (
    <div
      className={cn(
        "relative rounded-full flex items-center justify-center",
        sizeConfig.container,
        earned
          ? cn("bg-gradient-to-br", gradient, rarityRing)
          : "bg-muted ring-2 ring-muted-foreground/20",
        isLegendary && earned && "animate-legendary-glow",
        className
      )}
      data-testid={`badge-icon-${badge.id}`}
    >
      {earned ? (
        <Icon className={cn(sizeConfig.icon, "text-white drop-shadow-sm")} />
      ) : (
        <Lock className={cn(sizeConfig.icon, "text-muted-foreground")} />
      )}
      {isLegendary && earned && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-amber-400 to-pink-500 opacity-30 animate-spin-slow" style={{ animationDuration: "6s" }} />
      )}
    </div>
  );
}
