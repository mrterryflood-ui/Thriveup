/**
 * AIAugmentationDisclosure — DIS Alignment Condition 3
 *
 * Renders at the top of any AI-generated content surface. Names what
 * evidence the AI drew from, what it does not know, what to verify
 * independently, and who makes the final decision.
 *
 * This is NOT a legal disclaimer. It is a specific, contextual disclosure
 * that names the actual sources and gaps for this response.
 *
 * Usage:
 *   <AIAugmentationDisclosure
 *     drewFrom={["Census ACS 5-Year 2022", "RPLICE study set for McLennan County"]}
 *     doesNotKnow={["Current program availability", "Individual employer preferences"]}
 *     verifyWith="The workforce board for your county and the training program directly."
 *     decisionBelongsTo="You and, if you have one, your workforce navigator or CHW."
 *   />
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Brain,
  ChevronDown,
  Database,
  EyeOff,
  CheckSquare,
  User,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface AIAugmentationDisclosureProps {
  /** Data sources, studies, or platform records the AI drew from */
  drewFrom: string[];
  /** Specific things the AI does not know for this response */
  doesNotKnow: string[];
  /** How the user can independently verify the AI's output */
  verifyWith?: string;
  /** Who holds the decision authority for the next action */
  decisionBelongsTo?: string;
  /**
   * If true, shows as a collapsed one-line indicator with expand-on-click.
   * Useful for inline AI responses within a larger page.
   */
  compact?: boolean;
  /**
   * The AI model or system that generated this content.
   * Defaults to "TCAF AI" if not specified.
   */
  modelLabel?: string;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function AIAugmentationDisclosure({
  drewFrom,
  doesNotKnow,
  verifyWith,
  decisionBelongsTo,
  compact = false,
  modelLabel = "TCAF AI",
  className,
}: AIAugmentationDisclosureProps) {
  const [expanded, setExpanded] = useState(!compact);

  // ── Compact variant ──────────────────────────────────────────────────────
  if (compact) {
    return (
      <Collapsible open={expanded} onOpenChange={setExpanded} className={className}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-left">
            <Brain className="h-3.5 w-3.5 shrink-0 text-violet-500" />
            <span>
              AI-generated · {drewFrom.length} source
              {drewFrom.length !== 1 ? "s" : ""} · {doesNotKnow.length} known
              gap{doesNotKnow.length !== 1 ? "s" : ""}
            </span>
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 ml-auto transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2">
            <DisclosureBody
              drewFrom={drewFrom}
              doesNotKnow={doesNotKnow}
              verifyWith={verifyWith}
              decisionBelongsTo={decisionBelongsTo}
              modelLabel={modelLabel}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // ── Block variant ────────────────────────────────────────────────────────
  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      className={cn(
        "rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Brain className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-violet-800 dark:text-violet-300">
              AI-generated content
            </span>
            <Badge
              variant="outline"
              className="text-xs border-violet-300 text-violet-600 dark:border-violet-700 dark:text-violet-400"
            >
              {modelLabel}
            </Badge>
          </div>
          {!expanded && (
            <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
              {drewFrom.length} source{drewFrom.length !== 1 ? "s" : ""} ·{" "}
              {doesNotKnow.length} known gap{doesNotKnow.length !== 1 ? "s" : ""} · human
              decision required
            </p>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30"
            aria-label={expanded ? "Collapse AI disclosure" : "Expand AI disclosure"}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <div className="px-3 pb-3 border-t border-violet-200 dark:border-violet-800 pt-3">
          <DisclosureBody
            drewFrom={drewFrom}
            doesNotKnow={doesNotKnow}
            verifyWith={verifyWith}
            decisionBelongsTo={decisionBelongsTo}
            modelLabel={modelLabel}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Body sub-component ──────────────────────────────────────────────────────
function DisclosureBody({
  drewFrom,
  doesNotKnow,
  verifyWith,
  decisionBelongsTo,
  modelLabel,
}: Omit<AIAugmentationDisclosureProps, "compact" | "className">) {
  return (
    <div className="space-y-3 text-xs">
      {/* What it drew from */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Database className="h-3.5 w-3.5 text-violet-500 shrink-0" />
          <span className="font-semibold text-violet-700 dark:text-violet-400 uppercase tracking-wide">
            Evidence used ({drewFrom.length})
          </span>
        </div>
        <ul className="space-y-0.5 pl-5">
          {drewFrom.map((src, i) => (
            <li key={i} className="text-muted-foreground list-disc">
              {src}
            </li>
          ))}
        </ul>
      </div>

      {/* What it does not know */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <EyeOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Not known ({doesNotKnow.length})
          </span>
        </div>
        <ul className="space-y-0.5 pl-5">
          {doesNotKnow.map((gap, i) => (
            <li key={i} className="text-muted-foreground list-disc">
              {gap}
            </li>
          ))}
        </ul>
      </div>

      {/* Verify with */}
      {verifyWith && (
        <div className="flex items-start gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
              Verify with:{" "}
            </span>
            <span className="text-muted-foreground">{verifyWith}</span>
          </div>
        </div>
      )}

      {/* Decision authority */}
      {decisionBelongsTo && (
        <div className="flex items-start gap-1.5">
          <User className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
              Decision:{" "}
            </span>
            <span className="text-muted-foreground">{decisionBelongsTo}</span>
          </div>
        </div>
      )}

      {/* Standard footer */}
      <div className="flex items-start gap-1.5 pt-1 border-t border-violet-200 dark:border-violet-800">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-muted-foreground leading-relaxed">
          {modelLabel} augments your diagnostic capacity. It does not replace clinical
          judgment, community knowledge, or human authority over the next decision.
        </p>
      </div>
    </div>
  );
}

// ─── Inline AI badge ─────────────────────────────────────────────────────────
interface AIBadgeProps {
  sources?: number;
  gaps?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Minimal AI-generated indicator for inline use within text or table cells.
 * Clicking expands a popover with full disclosure.
 */
export function AIBadge({ sources, gaps, onClick, className }: AIBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 text-xs text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors",
        className,
      )}
      aria-label="AI-generated content — click for details"
    >
      <Brain className="h-3 w-3" />
      <span>AI</span>
      {sources !== undefined && (
        <span className="opacity-70">
          · {sources}src
        </span>
      )}
      {gaps !== undefined && gaps > 0 && (
        <Info className="h-3 w-3 text-amber-500" />
      )}
    </button>
  );
}

// ─── Navigator-specific disclosure (SSE streaming) ───────────────────────────
interface NavigatorDisclosureProps {
  zip?: string;
  hasPersonalContext: boolean;
  hasResearchContext: boolean;
  className?: string;
}

/**
 * Specialized disclosure for the AI Navigator that names the specific
 * community context that was injected into the response.
 */
export function NavigatorDisclosure({
  zip,
  hasPersonalContext,
  hasResearchContext,
  className,
}: NavigatorDisclosureProps) {
  const sources: string[] = [];
  if (zip) sources.push(`Census ACS 5-Year · ${zip} community context`);
  if (hasResearchContext) sources.push("RPLICE implementation science studies");
  if (hasPersonalContext) sources.push("Your platform profile and activity (this session)");
  sources.push("TCAF program and partner registry");

  const gaps: string[] = [
    "Real-time program availability and waitlists",
    "Your specific household constraints and preferences",
    "Employer hiring decisions and preferences",
  ];
  if (!zip) gaps.push("Local community conditions (no ZIP provided)");

  return (
    <AIAugmentationDisclosure
      drewFrom={sources}
      doesNotKnow={gaps}
      verifyWith="Call or visit the programs directly to confirm availability."
      decisionBelongsTo="You — and if you have one, your CHW or workforce navigator."
      modelLabel="TCAF Navigator"
      compact
      className={className}
    />
  );
}
