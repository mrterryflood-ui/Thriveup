import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export type AlignPhase = "assess" | "listen" | "integrate" | "guide" | "navigate" | "thrive";

export const ALIGN_PHASES: { key: AlignPhase; label: string; letter: string; color: string; bg: string }[] = [
  { key: "assess",    label: "Assess",    letter: "A", color: "text-violet-700 dark:text-violet-300",  bg: "bg-violet-100 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800" },
  { key: "listen",    label: "Listen",    letter: "L", color: "text-blue-700 dark:text-blue-300",      bg: "bg-blue-100 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800" },
  { key: "integrate", label: "Integrate", letter: "I", color: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800" },
  { key: "guide",     label: "Guide",     letter: "G", color: "text-amber-700 dark:text-amber-300",    bg: "bg-amber-100 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800" },
  { key: "navigate",  label: "Navigate",  letter: "N", color: "text-rose-700 dark:text-rose-300",      bg: "bg-rose-100 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800" },
  { key: "thrive",    label: "THRIVE",    letter: "★", color: "text-emerald-700 dark:text-emerald-300",bg: "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800" },
];

interface AlignPhaseBadgeProps {
  phase: AlignPhase;
  showLink?: boolean;
  size?: "sm" | "md";
}

export function AlignPhaseBadge({ phase, showLink = true, size = "sm" }: AlignPhaseBadgeProps) {
  const info = ALIGN_PHASES.find((p) => p.key === phase) ?? ALIGN_PHASES[0];

  const badge = (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${info.bg} ${info.color}`}>
      <Sparkles className={size === "md" ? "h-3 w-3" : "h-2.5 w-2.5"} />
      ALIGN · {info.label}
    </span>
  );

  if (showLink) {
    return <Link href="/align/my-journey">{badge}</Link>;
  }
  return badge;
}

interface AlignProgressBarProps {
  phase: AlignPhase;
}

export function AlignProgressBar({ phase }: AlignProgressBarProps) {
  const phaseKeys: AlignPhase[] = ["assess", "listen", "integrate", "guide", "navigate", "thrive"];
  const currentIdx = phaseKeys.indexOf(phase);

  return (
    <div className="flex items-center gap-1" data-testid="align-progress-bar">
      {ALIGN_PHASES.map((p, i) => (
        <div key={p.key} className="flex items-center gap-1">
          <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black border
            ${i <= currentIdx
              ? `${p.bg} ${p.color}`
              : "bg-muted border-border text-muted-foreground"}`}>
            {p.letter}
          </div>
          {i < ALIGN_PHASES.length - 1 && (
            <div className={`h-0.5 w-3 rounded-full ${i < currentIdx ? "bg-emerald-400" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
