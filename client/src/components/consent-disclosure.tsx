/**
 * ConsentDisclosure — DIS Alignment Condition 2
 *
 * Renders a visible, specific disclosure BEFORE the first field of any form
 * that collects personal, health, financial, demographic, narrative, or
 * organizational data.
 *
 * This is NOT a privacy policy link. It names what is collected, why, who
 * sees it, which fields are required, and how to withdraw or correct.
 *
 * Usage:
 *   <ConsentDisclosure
 *     purpose="..."
 *     fields={[{ name: "ZIP code", why: "Training programs are state-specific.", required: true }]}
 *     sharing="Your answers are used only to generate a pathway recommendation."
 *     withdrawal="/profile/privacy"
 *   />
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Shield,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Info,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface ConsentField {
  name: string;
  why: string;
  required?: boolean;
  sensitive?: boolean; // health, financial, or identity data
}

export interface ConsentDisclosureProps {
  /** Plain-language statement of why this form exists */
  purpose: string;
  /** Which fields are being collected and why */
  fields: ConsentField[];
  /** Who will see the collected information */
  sharing: string;
  /** URL or description of how to withdraw or correct */
  withdrawal?: string;
  /** Optional callback when user explicitly acknowledges */
  onAcknowledge?: () => void;
  /** If true, shows a compact summary with expand option */
  compact?: boolean;
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function ConsentDisclosure({
  purpose,
  fields,
  sharing,
  withdrawal,
  onAcknowledge,
  compact = false,
  className,
}: ConsentDisclosureProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [acknowledged, setAcknowledged] = useState(false);
  const requiredCount = fields.filter((f) => f.required).length;
  const sensitiveCount = fields.filter((f) => f.sensitive).length;

  const handleAcknowledge = () => {
    setAcknowledged(true);
    onAcknowledge?.();
  };

  if (acknowledged) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400",
          className,
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        <span>You've reviewed how your information is used.</span>
        <button
          onClick={() => setAcknowledged(false)}
          className="ml-auto underline hover:no-underline"
        >
          Review again
        </button>
      </div>
    );
  }

  return (
    <Collapsible
      open={expanded}
      onOpenChange={setExpanded}
      className={cn(
        "rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800",
        className,
      )}
    >
      {/* Header — always visible */}
      <div className="flex items-start gap-2 px-3 py-2.5">
        <Shield className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              How your information is used
            </span>
            {sensitiveCount > 0 && (
              <Badge
                variant="outline"
                className="text-xs border-amber-300 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20"
              >
                <Lock className="h-2.5 w-2.5 mr-1" />
                Includes sensitive data
              </Badge>
            )}
          </div>
          {!expanded && (
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5 line-clamp-1">
              {purpose}
            </p>
          )}
        </div>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 shrink-0 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
            aria-label={expanded ? "Collapse disclosure" : "Expand disclosure"}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      {/* Body — expandable */}
      <CollapsibleContent>
        <div className="px-3 pb-3 space-y-3 text-sm text-blue-800 dark:text-blue-300">
          {/* Purpose */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-500 mb-1">
              Purpose
            </p>
            <p className="text-sm leading-relaxed">{purpose}</p>
          </div>

          {/* Fields */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-500 mb-1">
              What we collect ({fields.length} field{fields.length !== 1 ? "s" : ""},{" "}
              {requiredCount} required)
            </p>
            <ul className="space-y-1.5">
              {fields.map((field, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {field.sensitive ? (
                      <Lock className="h-3 w-3 text-amber-600 dark:text-amber-500" />
                    ) : (
                      <Info className="h-3 w-3 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <span className="font-medium">{field.name}</span>
                    {field.required ? (
                      <span className="text-blue-600 dark:text-blue-400"> (required)</span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-300"> (optional)</span>
                    )}
                    {" — "}
                    <span className="text-blue-700 dark:text-blue-400">{field.why}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Sharing */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-500 mb-1">
              Who sees it
            </p>
            <div className="flex items-start gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
              <p className="leading-relaxed">{sharing}</p>
            </div>
          </div>

          {/* Withdrawal */}
          {withdrawal && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-500 mb-1">
                Your rights
              </p>
              <div className="flex items-start gap-1.5 text-xs">
                <EyeOff className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
                {withdrawal.startsWith("/") || withdrawal.startsWith("http") ? (
                  <span>
                    You can review, correct, or delete your information at any time.{" "}
                    <a
                      href={withdrawal}
                      className="underline hover:no-underline inline-flex items-center gap-0.5"
                    >
                      Manage your privacy settings
                      {withdrawal.startsWith("http") && (
                        <ExternalLink className="h-2.5 w-2.5" />
                      )}
                    </a>
                  </span>
                ) : (
                  <p className="leading-relaxed">{withdrawal}</p>
                )}
              </div>
            </div>
          )}

          {/* Acknowledge button */}
          {onAcknowledge && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleAcknowledge}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />I understand how my
              information is used
            </Button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ─── Compact inline notice ───────────────────────────────────────────────────
interface ConsentNoticeProps {
  text: string;
  privacyUrl?: string;
  className?: string;
}

/**
 * Minimal single-line consent notice for very short forms (e.g., email sign-up).
 * Use full ConsentDisclosure for any form with sensitive data or multiple fields.
 */
export function ConsentNotice({ text, privacyUrl, className }: ConsentNoticeProps) {
  return (
    <p className={cn("text-xs text-muted-foreground flex items-start gap-1.5", className)}>
      <Shield className="h-3 w-3 shrink-0 mt-0.5 text-blue-500" />
      {text}
      {privacyUrl && (
        <>
          {" "}
          <a href={privacyUrl} className="underline hover:no-underline">
            Privacy policy
          </a>
        </>
      )}
    </p>
  );
}
