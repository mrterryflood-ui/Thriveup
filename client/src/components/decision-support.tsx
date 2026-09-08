/**
 * DecisionSupport — DIS Alignment Condition 1 (extended)
 *
 * Wraps any metric display with a "what should I do with this number?" caption.
 * Every significant metric displayed to a user should be paired with what it
 * means for their next decision and what action it enables.
 *
 * Usage:
 *   <DecisionSupport
 *     metric="38%"
 *     label="housing cost burden"
 *     decision="More than a third of households in this community spend over 30% of income on housing — the federal threshold for cost-burdened."
 *     action="See housing assistance programs"
 *     actionLink="/benefits?category=housing&county=48453"
 *     severity="warning"
 *   />
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

// ─── Types ──────────────────────────────────────────────────────────────────
export type DecisionSeverity = "info" | "warning" | "alert" | "positive";
export type TrendDirection = "up" | "down" | "stable";

export interface DecisionSupportProps {
  /** The metric value to display (number or formatted string) */
  metric: string | number;
  /** Short label for the metric (e.g., "housing cost burden") */
  label?: string;
  /** Plain-language explanation of what this metric means */
  decision: string;
  /** The action the user should consider */
  action?: string;
  /** Internal route or external URL for the action */
  actionLink?: string;
  /** Visual severity of the condition */
  severity?: DecisionSeverity;
  /** Trend relative to comparison period or benchmark */
  trend?: TrendDirection;
  /** Context for the trend (e.g., "vs. state average" or "vs. last year") */
  trendContext?: string;
  /** Unit for the metric (e.g., "%" or "per 1,000") */
  unit?: string;
  /** If true, renders compactly without the action button */
  compact?: boolean;
  className?: string;
}

// ─── Severity config ─────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<
  DecisionSeverity,
  {
    border: string;
    bg: string;
    iconColor: string;
    Icon: typeof Info;
    metricColor: string;
  }
> = {
  info: {
    border: "border-blue-200 dark:border-blue-800",
    bg: "bg-blue-50 dark:bg-blue-950/20",
    iconColor: "text-blue-500",
    Icon: Info,
    metricColor: "text-blue-700 dark:text-blue-300",
  },
  warning: {
    border: "border-amber-200 dark:border-amber-800",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    iconColor: "text-amber-500",
    Icon: AlertTriangle,
    metricColor: "text-amber-700 dark:text-amber-300",
  },
  alert: {
    border: "border-red-200 dark:border-red-800",
    bg: "bg-red-50 dark:bg-red-950/20",
    iconColor: "text-red-500",
    Icon: AlertCircle,
    metricColor: "text-red-700 dark:text-red-300",
  },
  positive: {
    border: "border-emerald-200 dark:border-emerald-800",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    iconColor: "text-emerald-500",
    Icon: Info,
    metricColor: "text-emerald-700 dark:text-emerald-300",
  },
};

// ─── Component ───────────────────────────────────────────────────────────────
export function DecisionSupport({
  metric,
  label,
  decision,
  action,
  actionLink,
  severity = "info",
  trend,
  trendContext,
  unit,
  compact = false,
  className,
}: DecisionSupportProps) {
  const cfg = SEVERITY_CONFIG[severity];
  const { Icon } = cfg;

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColor =
    trend === "up"
      ? "text-red-500"
      : trend === "down"
        ? "text-emerald-500"
        : "text-gray-400";

  const isExternal =
    actionLink?.startsWith("http://") || actionLink?.startsWith("https://");

  if (compact) {
    return (
      <div className={cn("flex items-start gap-2 text-sm", className)}>
        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", cfg.iconColor)} />
        <div className="min-w-0">
          <span className={cn("font-semibold", cfg.metricColor)}>
            {metric}
            {unit && <span className="font-normal ml-0.5 text-xs">{unit}</span>}
          </span>
          {label && (
            <span className="text-muted-foreground ml-1.5 text-xs">{label}</span>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {decision}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3",
        cfg.border,
        cfg.bg,
        className,
      )}
    >
      {/* Metric display */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={cn("text-3xl font-bold tracking-tight", cfg.metricColor)}>
            {metric}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground font-medium">
              {unit}
            </span>
          )}
          {label && (
            <span className="text-sm text-muted-foreground">{label}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Icon className={cn("h-5 w-5", cfg.iconColor)} />
          {trend && (
            <div className="flex items-center gap-1">
              <TrendIcon className={cn("h-4 w-4", trendColor)} />
              {trendContext && (
                <span className="text-xs text-muted-foreground">
                  {trendContext}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Decision caption */}
      <p className="text-sm text-foreground leading-relaxed">{decision}</p>

      {/* Action */}
      {action && actionLink && (
        <div>
          {isExternal ? (
            <a
              href={actionLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
            >
              {action}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : (
            <Link href={actionLink}>
              <Button variant="outline" size="sm" className="gap-1.5">
                {action}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Metric row for tables / dense layouts ───────────────────────────────────
interface MetricRowProps {
  label: string;
  value: string | number;
  unit?: string;
  decision: string;
  severity?: DecisionSeverity;
  className?: string;
}

/**
 * Single-row metric display for use inside tables or compact dashboards.
 * Pairs the value with a tooltip-style decision caption on hover.
 */
export function MetricRow({
  label,
  value,
  unit,
  decision,
  severity = "info",
  className,
}: MetricRowProps) {
  const cfg = SEVERITY_CONFIG[severity];
  const { Icon } = cfg;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-2 px-3 rounded-md text-sm hover:bg-muted/40 transition-colors group",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
            cfg.iconColor,
          )}
        />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={cn("font-semibold tabular-nums", cfg.metricColor)}>
          {value}
          {unit && <span className="font-normal text-xs ml-0.5">{unit}</span>}
        </span>
        <Badge
          variant="outline"
          className="hidden group-hover:inline-flex text-xs max-w-48 truncate"
          title={decision}
        >
          {decision.length > 40 ? decision.slice(0, 40) + "…" : decision}
        </Badge>
      </div>
    </div>
  );
}
