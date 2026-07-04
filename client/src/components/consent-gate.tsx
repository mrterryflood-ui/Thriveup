import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";

export type ConsentType =
  | "share_with_funder"
  | "name_me_publicly"
  | "include_in_report"
  | "share_story"
  | "export_data"
  | "record_outcome";

interface ConsentConfig {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  icon: typeof Shield;
  warningColor: string;
}

const CONSENT_CONFIGS: Record<ConsentType, ConsentConfig> = {
  share_with_funder: {
    title: "Share my information with a funder?",
    description: "This would include your story, outcome data, or service record in a grant proposal or funder report. Your name and details will be seen by the funder organization and their reviewers.",
    confirmLabel: "Yes, share with this funder",
    cancelLabel: "No, keep it private",
    icon: Shield,
    warningColor: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20",
  },
  name_me_publicly: {
    title: "Name me publicly?",
    description: "This would publish your name on our public website, social media, or public reports — visible to anyone. You can revoke this at any time and we will remove your name from future publications (not retroactively from printed materials).",
    confirmLabel: "Yes, publish my name",
    cancelLabel: "No, keep me anonymous",
    icon: Eye,
    warningColor: "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20",
  },
  include_in_report: {
    title: "Include my data in this report?",
    description: "This would include your anonymized service data in an aggregate outcome report. Your name will NOT appear — only totals and patterns at the group level. You can opt out at any time.",
    confirmLabel: "Yes, include my data (anonymized)",
    cancelLabel: "No, exclude my data",
    icon: Lock,
    warningColor: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20",
  },
  share_story: {
    title: "Share my story?",
    description: "This would share your story — in your own words — with the people or audience described below. You control what is shared and can request removal at any time.",
    confirmLabel: "Yes, share my story",
    cancelLabel: "Not yet — keep it private",
    icon: Shield,
    warningColor: "border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20",
  },
  export_data: {
    title: "Export your personal data?",
    description: "This will create a file containing your personal data stored on this platform. The file will be downloaded to your device. Do not share it with anyone you don't trust completely.",
    confirmLabel: "Yes, export my data",
    cancelLabel: "Cancel",
    icon: EyeOff,
    warningColor: "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30",
  },
  record_outcome: {
    title: "Record this outcome in my file?",
    description: "This will permanently add this outcome to your service record. Your case manager and authorized staff can see it. You can request a correction if the information is wrong.",
    confirmLabel: "Yes, record this outcome",
    cancelLabel: "Don't record this",
    icon: Shield,
    warningColor: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20",
  },
};

interface ConsentGateProps {
  type: ConsentType;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  context?: string;
  children?: React.ReactNode;
}

export function ConsentGate({ type, open, onConfirm, onCancel, context }: ConsentGateProps) {
  const cfg = CONSENT_CONFIGS[type];
  const Icon = cfg.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className={`max-w-md border-2 ${cfg.warningColor}`} data-testid={`consent-gate-${type}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {cfg.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-1">
            {cfg.description}
          </DialogDescription>
        </DialogHeader>

        {context && (
          <div className="px-4 py-3 rounded-md bg-background border text-sm" data-testid="consent-gate-context">
            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wide font-medium">Context</p>
            <p className="leading-snug">{context}</p>
          </div>
        )}

        <div className="p-3 rounded-md bg-background border text-xs text-muted-foreground leading-relaxed" data-testid="consent-gate-rights">
          <p className="font-semibold text-foreground mb-1">Your rights</p>
          <ul className="space-y-0.5 list-disc list-inside">
            <li>This consent is entirely voluntary — saying no has no impact on your services.</li>
            <li>You can change your mind at any time by contacting your navigator.</li>
            <li>We never share your information without your explicit yes.</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-1">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-testid="button-consent-cancel"
          >
            {cfg.cancelLabel}
          </Button>
          <Button
            className="flex-1"
            onClick={onConfirm}
            data-testid="button-consent-confirm"
          >
            {cfg.confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useConsentGate(type: ConsentType) {
  const [open, setOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [context, setContext] = useState<string | undefined>();

  function requestConsent(action: () => void, ctx?: string) {
    setPendingAction(() => action);
    setContext(ctx);
    setOpen(true);
  }

  function handleConfirm() {
    setOpen(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function handleCancel() {
    setOpen(false);
    setPendingAction(null);
  }

  const gate = (
    <ConsentGate
      type={type}
      open={open}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      context={context}
    />
  );

  return { requestConsent, gate };
}
