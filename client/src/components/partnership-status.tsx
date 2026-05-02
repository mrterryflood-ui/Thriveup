import { Badge } from "@/components/ui/badge";
import { CheckCircle2, FileText, FileSignature, Handshake, Activity, Circle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type PartnershipStage =
  | "aspirational"
  | "outreach"
  | "discovery"
  | "loi-drafted"
  | "loi-signed"
  | "mou-executed"
  | "active";

interface StageMeta {
  label: string;
  description: string;
  icon: typeof Circle;
  className: string;
}

const STAGE_META: Record<PartnershipStage, StageMeta> = {
  aspirational: {
    label: "Aspirational",
    description: "Identified as a desired partner. No outreach has yet occurred.",
    icon: Circle,
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700",
  },
  outreach: {
    label: "Outreach Initiated",
    description: "First contact attempted. No formal response received.",
    icon: Circle,
    className: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
  },
  discovery: {
    label: "Discovery Conversation",
    description: "Active conversation underway to assess alignment and interest.",
    icon: Handshake,
    className: "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800",
  },
  "loi-drafted": {
    label: "LOI Drafted",
    description: "Letter of Intent prepared by TCAF/ALC and sent to partner for review.",
    icon: FileText,
    className: "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800",
  },
  "loi-signed": {
    label: "LOI Signed",
    description: "Letter of Intent signed by both parties. Non-binding statement of intent to collaborate.",
    icon: FileSignature,
    className: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  },
  "mou-executed": {
    label: "MOU Executed",
    description: "Memorandum of Understanding executed. Roles, responsibilities, and scope formally defined.",
    icon: FileSignature,
    className: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  },
  active: {
    label: "Active Partnership",
    description: "Operational partnership with documented data sharing, referrals, or program coordination underway.",
    icon: CheckCircle2,
    className: "bg-emerald-600 text-white border-emerald-700 dark:bg-emerald-700",
  },
};

interface PartnershipStatusProps {
  stage: PartnershipStage;
  asOf?: string;
  className?: string;
}

export function PartnershipStatus({ stage, asOf, className }: PartnershipStatusProps) {
  const meta = STAGE_META[stage];
  const Icon = meta.icon;
  const testid = `partnership-status-${stage}`;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 font-medium ${meta.className} ${className || ""}`}
            data-testid={testid}
            aria-label={`Partnership status: ${meta.label}${asOf ? `, as of ${asOf}` : ""}`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{meta.label}</span>
            {asOf && <span className="text-[10px] opacity-75 ml-1">({asOf})</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{meta.description}</p>
          {asOf && <p className="text-[10px] opacity-75 mt-1">Status as of {asOf}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PartnershipStatusLegend() {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-2" data-testid="partnership-legend">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Partnership Status Key
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(Object.keys(STAGE_META) as PartnershipStage[]).map((stage) => (
          <div key={stage} className="flex items-start gap-2">
            <PartnershipStatus stage={stage} />
            <p className="text-xs text-muted-foreground leading-snug">
              {STAGE_META[stage].description}
            </p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground italic pt-2 border-t">
        We label every relationship at its honest current stage. We do not present aspirational partners as executed agreements.
      </p>
    </div>
  );
}
