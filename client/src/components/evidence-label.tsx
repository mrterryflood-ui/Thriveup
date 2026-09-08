/**
 * EvidenceLabel — DIS Alignment Condition 1
 *
 * Renders source citation, evidence-class badge, vintage, and an expandable
 * "what this means" section for any Claim<T> value.
 *
 * Usage:
 *   <EvidenceLabel claim={medianIncomeClaim} />
 *   <EvidenceLabel claim={povertyRateClaim} inline />
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  CheckCircle2,
  FlaskConical,
  BarChart3,
  Users,
  HelpCircle,
  ChevronDown,
  ExternalLink,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Claim type (mirrors server/shared/claim-types.ts) ─────────────────────
export type EvidenceClass =
  | "verified"
  | "estimated"
  | "modeled"
  | "community-reported"
  | "unverified";

export interface Claim<T = number | string | null> {
  value: T;
  unit?: string;
  source: string;
  sourceId?: string;       // registered source ID from data_sources table
  asOfDate: string | null;
  geographyKey: string | null;
  confidence: EvidenceClass;
  methodology?: string;
  url?: string;
  decisionCaption?: string; // "what this means for the next decision"
}

// ─── Evidence class config ──────────────────────────────────────────────────
const EVIDENCE_CONFIG: Record<
  EvidenceClass,
  {
    label: string;
    color: string;
    bgColor: string;
    icon: typeof CheckCircle2;
    plain: string;
  }
> = {
  verified: {
    label: "Verified",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    icon: CheckCircle2,
    plain:
      "This figure comes from a primary data source and has been directly observed or officially recorded — not estimated or modeled.",
  },
  estimated: {
    label: "Estimated",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    icon: BarChart3,
    plain:
      "This is a survey-based or statistically modeled estimate. It includes a margin of error. Use it to understand the general situation, not to make precision decisions.",
  },
  modeled: {
    label: "Modeled",
    color: "text-orange-700 dark:text-orange-400",
    bgColor: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800",
    icon: FlaskConical,
    plain:
      "This figure was derived through statistical modeling — it was not directly measured. The model's assumptions affect the result. Treat it as an informed estimate, not an observed fact.",
  },
  "community-reported": {
    label: "Community-Reported",
    color: "text-violet-700 dark:text-violet-400",
    bgColor: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-800",
    icon: Users,
    plain:
      "This information was contributed by community members, CHWs, or partner organizations through the community intelligence system. It reflects lived experience and direct observation — not official data.",
  },
  unverified: {
    label: "Unverified",
    color: "text-gray-600 dark:text-gray-400",
    bgColor: "bg-gray-50 border-gray-200 dark:bg-gray-900/30 dark:border-gray-700",
    icon: HelpCircle,
    plain:
      "A source has been cited but has not been independently verified for this geography or time period. Use with caution and verify before acting on this figure.",
  },
};

// ─── Component ──────────────────────────────────────────────────────────────
interface EvidenceLabelProps {
  claim: Claim<unknown>;
  /** Renders as a small inline badge + popover instead of a block */
  inline?: boolean;
  /** Show the decision caption below the label (block mode only) */
  showDecision?: boolean;
  className?: string;
}

export function EvidenceLabel({
  claim,
  inline = false,
  showDecision = true,
  className,
}: EvidenceLabelProps) {
  const [open, setOpen] = useState(false);
  const cfg = EVIDENCE_CONFIG[claim.confidence] ?? EVIDENCE_CONFIG.unverified;
  const Icon = cfg.icon;

  const vintage = claim.asOfDate
    ? new Date(claim.asOfDate).getFullYear().toString()
    : null;

  // ── Inline variant ────────────────────────────────────────────────────────
  if (inline) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium border transition-opacity hover:opacity-80",
              cfg.bgColor,
              cfg.color,
              className,
            )}
            aria-label={`Evidence class: ${cfg.label}. Source: ${claim.source}. Click for details.`}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span>{cfg.label}</span>
            {vintage && <span className="opacity-60">·{vintage}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 text-sm" align="start">
          <SourceDetail claim={claim} cfg={cfg} Icon={Icon} />
        </PopoverContent>
      </Popover>
    );
  }

  // ── Block variant ─────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div
          className={cn(
            "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
            cfg.bgColor,
          )}
        >
          <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", cfg.color)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className={cn("font-semibold", cfg.color)}>
                {cfg.label}
              </span>
              <span className="text-muted-foreground truncate">
                {claim.source}
              </span>
              {vintage && (
                <span className="text-muted-foreground">· {vintage}</span>
              )}
              {claim.geographyKey && (
                <span className="text-muted-foreground">
                  · {claim.geographyKey}
                </span>
              )}
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 shrink-0"
              aria-label="Expand evidence details"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  open && "rotate-180",
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-1 rounded-md border border-t-0 px-3 py-3 text-xs text-muted-foreground space-y-2 bg-background">
            <SourceDetail claim={claim} cfg={cfg} Icon={Icon} expanded />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {showDecision && claim.decisionCaption && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
          <span>{claim.decisionCaption}</span>
        </div>
      )}
    </div>
  );
}

// ─── SourceDetail sub-component ─────────────────────────────────────────────
function SourceDetail({
  claim,
  cfg,
  Icon,
  expanded = false,
}: {
  claim: Claim<unknown>;
  cfg: (typeof EVIDENCE_CONFIG)[EvidenceClass];
  Icon: typeof CheckCircle2;
  expanded?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-4 w-4 shrink-0", cfg.color)} />
        <span className={cn("font-semibold text-sm", cfg.color)}>
          {cfg.label}
        </span>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {cfg.plain}
      </p>

      <dl className="space-y-1 text-xs">
        <Row label="Source" value={claim.source} />
        {claim.asOfDate && (
          <Row label="As of" value={new Date(claim.asOfDate).toLocaleDateString()} />
        )}
        {claim.geographyKey && (
          <Row label="Geography" value={claim.geographyKey} />
        )}
        {claim.methodology && (
          <Row label="Method" value={claim.methodology} />
        )}
      </dl>

      {claim.url && (
        <a
          href={claim.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
        >
          View source data
          <ExternalLink className="h-3 w-3" />
        </a>
      )}

      {expanded && claim.decisionCaption && (
        <div className="rounded border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-2 py-1.5 text-xs text-blue-800 dark:text-blue-300">
          <strong>What this means:</strong> {claim.decisionCaption}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}:</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

// ─── Batch display for multiple claims ──────────────────────────────────────
interface EvidenceSummaryProps {
  claims: Claim<unknown>[];
  className?: string;
}

/**
 * Renders a compact row of evidence class badges for multiple claims.
 * Useful in table cells or compact card contexts.
 */
export function EvidenceSummary({ claims, className }: EvidenceSummaryProps) {
  const counts = claims.reduce(
    (acc, c) => {
      acc[c.confidence] = (acc[c.confidence] ?? 0) + 1;
      return acc;
    },
    {} as Record<EvidenceClass, number>,
  );

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {(Object.keys(counts) as EvidenceClass[]).map((cls) => {
        const cfg = EVIDENCE_CONFIG[cls];
        const Icon = cfg.icon;
        return (
          <Badge
            key={cls}
            variant="outline"
            className={cn(
              "text-xs gap-1 px-1.5 py-0",
              cfg.bgColor,
              cfg.color,
            )}
          >
            <Icon className="h-3 w-3" />
            {counts[cls]}× {cfg.label}
          </Badge>
        );
      })}
    </div>
  );
}
