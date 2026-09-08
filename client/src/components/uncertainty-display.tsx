/**
 * UncertaintyDisplay — DIS Alignment Condition 4
 *
 * Renders when data is missing, contested, or unknown — makes absence
 * visible rather than silent. Offers a Perplexity live search fallback
 * so the platform never has a true data dead-end.
 *
 * Usage:
 *   <UncertaintyDisplay
 *     type="missing-data"
 *     what="Employer demand data for CNA certification in Waller County is not available."
 *     why="CareerOneStop occupation-demand data is not available below MSA level for all codes."
 *     whatCanProceed="You can view training programs and credential requirements now."
 *     perplexityQuery="CNA employer demand Waller County Texas 2025"
 *   />
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  GitFork,
  HelpCircle,
  WifiOff,
  Search,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Info,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

// ─── Types ───────────────────────────────────────────────────────────────────
export type UncertaintyType =
  | "missing-data"
  | "conflicting-sources"
  | "contested-interpretation"
  | "data-collection-failure";

export interface WhatNextItem {
  action: string;
  link?: string;
}

export interface UncertaintyDisplayProps {
  type: UncertaintyType;
  /** Precise statement of what is unknown or missing */
  what: string;
  /** Why it matters — what decision this unknown affects */
  why: string;
  /** What the user can safely do while this uncertainty persists */
  whatCanProceed?: string;
  /** Concrete next actions to close the gap */
  whatNext?: WhatNextItem[];
  /**
   * If provided, shows a "Search live data" button that calls the
   * Perplexity live-search endpoint. This ensures the platform never
   * has a true data dead-end.
   */
  perplexityQuery?: string;
  /** Compact single-line variant for tables or card footers */
  compact?: boolean;
  className?: string;
}

// ─── Uncertainty type config ─────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  UncertaintyType,
  { label: string; icon: typeof AlertCircle; color: string; bg: string; border: string }
> = {
  "missing-data": {
    label: "Data not available",
    icon: AlertCircle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-900/30",
    border: "border-gray-200 dark:border-gray-700",
  },
  "conflicting-sources": {
    label: "Sources disagree",
    icon: GitFork,
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
  },
  "contested-interpretation": {
    label: "Interpretation contested",
    icon: HelpCircle,
    color: "text-violet-700 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
  },
  "data-collection-failure": {
    label: "Pipeline error",
    icon: WifiOff,
    color: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-800",
  },
};

// ─── Perplexity live search result type ──────────────────────────────────────
interface LiveSearchResult {
  text: string;
  citations: string[];
  query: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function UncertaintyDisplay({
  type,
  what,
  why,
  whatCanProceed,
  whatNext,
  perplexityQuery,
  compact = false,
  className,
}: UncertaintyDisplayProps) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  const [expanded, setExpanded] = useState(false);
  const [searching, setSearching] = useState(false);
  const [liveResult, setLiveResult] = useState<LiveSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleLiveSearch = async () => {
    if (!perplexityQuery || searching) return;
    setSearching(true);
    setSearchError(null);
    try {
      const resp = await apiRequest("POST", "/api/live-data-search", {
        query: perplexityQuery,
        context: what,
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setLiveResult(data as LiveSearchResult);
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Live search unavailable. Try again.",
      );
    } finally {
      setSearching(false);
    }
  };

  // ── Compact variant ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs",
          cfg.bg,
          cfg.border,
          className,
        )}
      >
        <Icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
        <span className={cfg.color}>{cfg.label}</span>
        <span className="text-muted-foreground truncate flex-1">{what}</span>
        {perplexityQuery && !liveResult && (
          <button
            onClick={handleLiveSearch}
            disabled={searching}
            className="shrink-0 inline-flex items-center gap-1 text-blue-600 hover:underline disabled:opacity-50"
          >
            {searching ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
            Search live
          </button>
        )}
      </div>
    );
  }

  // ── Block variant ────────────────────────────────────────────────────────
  return (
    <div className={cn("space-y-2", className)}>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div
          className={cn(
            "rounded-lg border p-4 space-y-3",
            cfg.bg,
            cfg.border,
          )}
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", cfg.color)} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn("text-xs border", cfg.color, cfg.border)}
                >
                  {cfg.label}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 shrink-0"
                    aria-label="Toggle details"
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform text-muted-foreground",
                        expanded && "rotate-180",
                      )}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <p className="text-sm font-medium text-foreground leading-snug">{what}</p>
            </div>
          </div>

          {/* Why it matters */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground pl-8">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
            <p className="leading-relaxed">{why}</p>
          </div>

          {/* What can proceed */}
          {whatCanProceed && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground pl-8">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
              <p className="leading-relaxed">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  You can still proceed:{" "}
                </span>
                {whatCanProceed}
              </p>
            </div>
          )}

          {/* Perplexity live search */}
          {perplexityQuery && !liveResult && (
            <div className="pl-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLiveSearch}
                disabled={searching}
                className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50 dark:border-blue-700 dark:hover:bg-blue-950/30"
              >
                {searching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
                {searching ? "Searching live data…" : "Search live data"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Uses Perplexity to find current information with source citations.
              </p>
            </div>
          )}

          {/* Search error */}
          {searchError && (
            <div className="pl-8 text-xs text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {searchError}
            </div>
          )}
        </div>

        {/* Expanded: what next */}
        <CollapsibleContent>
          <div className="mt-2 rounded-lg border bg-background p-4 space-y-3 text-sm">
            {whatNext && whatNext.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Ways to get this information
                </p>
                <ul className="space-y-1.5">
                  {whatNext.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                      {item.link ? (
                        item.link.startsWith("/") ? (
                          <a href={item.link} className="text-blue-600 hover:underline">
                            {item.action}
                          </a>
                        ) : (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                          >
                            {item.action}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )
                      ) : (
                        <span className="text-muted-foreground">{item.action}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Perplexity live search result */}
      {liveResult && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Live search result
            </span>
            <Badge variant="outline" className="text-xs border-blue-300 text-blue-600 ml-auto">
              Perplexity Sonar Pro
            </Badge>
          </div>

          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {liveResult.text}
          </div>

          {liveResult.citations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Sources ({liveResult.citations.length})
              </p>
              <ul className="space-y-0.5">
                {liveResult.citations.map((cite, i) => (
                  <li key={i}>
                    <a
                      href={cite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 break-all"
                    >
                      {cite}
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Live search results are sourced but not platform-verified. Confirm
            before making decisions.
            <button
              onClick={() => { setLiveResult(null); setSearchError(null); }}
              className="ml-auto text-blue-600 hover:underline shrink-0"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Null-data guard wrapper ──────────────────────────────────────────────────
interface NullGuardProps<T> {
  value: T | null | undefined;
  /** What to render when value is present */
  children: (value: T) => React.ReactNode;
  /** UncertaintyDisplay props for the null case */
  uncertainty: Omit<UncertaintyDisplayProps, "compact">;
  compact?: boolean;
}

/**
 * Renders children when value is non-null, UncertaintyDisplay otherwise.
 * Prevents silent nulls — every missing value gets a visible explanation.
 */
export function NullGuard<T>({
  value,
  children,
  uncertainty,
  compact,
}: NullGuardProps<T>) {
  if (value === null || value === undefined) {
    return <UncertaintyDisplay {...uncertainty} compact={compact} />;
  }
  return <>{children(value)}</>;
}
