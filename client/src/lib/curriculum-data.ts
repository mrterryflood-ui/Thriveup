export const LEVEL_COLORS: Record<number, { bg: string; text: string; gradient: string; badge: string }> = {
  1: {
    bg: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  2: {
    bg: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    gradient: "from-sky-500 to-blue-600",
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  },
  3: {
    bg: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-500 to-purple-600",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  },
  4: {
    bg: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500 to-orange-600",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  5: {
    bg: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    gradient: "from-rose-500 to-pink-600",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  },
};

export const LEVEL_ICONS: Record<number, string> = {
  1: "Compass",
  2: "Map",
  3: "Building2",
  4: "Lightbulb",
  5: "Crown",
};

export interface RankInfo {
  title: string;
  stars: number;
  icon: string;
}

export function getRankForLevel(level: number): RankInfo {
  switch (level) {
    case 1: return { title: "Specialist", stars: 0, icon: "Shield" };
    case 2: return { title: "Sergeant", stars: 0, icon: "ShieldCheck" };
    case 3: return { title: "Master Sergeant", stars: 0, icon: "ShieldPlus" };
    case 4: return { title: "Captain", stars: 0, icon: "Swords" };
    case 5: return { title: "General", stars: 1, icon: "Medal" };
    case 6: return { title: "General", stars: 2, icon: "Medal" };
    case 7: return { title: "General", stars: 3, icon: "Medal" };
    case 8: return { title: "General", stars: 4, icon: "Medal" };
    default: return { title: "Specialist", stars: 0, icon: "Shield" };
  }
}

export const ALL_RANKS: RankInfo[] = [
  { title: "Specialist", stars: 0, icon: "Shield" },
  { title: "Sergeant", stars: 0, icon: "ShieldCheck" },
  { title: "Master Sergeant", stars: 0, icon: "ShieldPlus" },
  { title: "Captain", stars: 0, icon: "Swords" },
  { title: "General", stars: 1, icon: "Medal" },
  { title: "General", stars: 2, icon: "Medal" },
  { title: "General", stars: 3, icon: "Medal" },
  { title: "General", stars: 4, icon: "Medal" },
];

export const BADGE_RARITY_COLORS: Record<string, string> = {
  common: "border-slate-300 dark:border-slate-600",
  uncommon: "border-emerald-400 dark:border-emerald-500",
  rare: "border-violet-400 dark:border-violet-500",
  legendary: "border-amber-400 dark:border-amber-500",
};
