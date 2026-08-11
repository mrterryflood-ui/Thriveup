import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Heart, GraduationCap, Users, FileText, Briefcase, Shield, X, ChevronRight,
} from "lucide-react";

export type HubRole = "community" | "youth" | "chw" | "grant" | "org" | "admin";

const STORAGE_KEY = "tcaf_hub_role";
const ONBOARDED_KEY = "tcaf_hub_onboarded";

export function useHubRole() {
  const [role, setRoleState] = useState<HubRole | null>(() => {
    try { return (localStorage.getItem(STORAGE_KEY) as HubRole | null) ?? null; }
    catch { return null; }
  });

  const [onboarded, setOnboardedState] = useState<boolean>(() => {
    try { return localStorage.getItem(ONBOARDED_KEY) === "1"; }
    catch { return false; }
  });

  const setRole = useCallback((r: HubRole) => {
    try {
      localStorage.setItem(STORAGE_KEY, r);
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {}
    setRoleState(r);
    setOnboardedState(true);
  }, []);

  const dismiss = useCallback(() => {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {}
    setOnboardedState(true);
  }, []);

  const clearRole = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ONBOARDED_KEY);
    } catch {}
    setRoleState(null);
    setOnboardedState(false);
  }, []);

  return { role, onboarded, setRole, dismiss, clearRole };
}

export const ROLE_LABELS: Record<HubRole, string> = {
  community: "Community Member",
  youth: "Student / Young Adult",
  chw: "CHW / Peer Mentor",
  grant: "Grant Writer",
  org: "Partner Org",
  admin: "Admin",
};

const ROLE_OPTIONS: {
  id: HubRole; label: string; desc: string; Icon: React.FC<{ className?: string }>;
  gradient: string;
}[] = [
  {
    id: "community",
    label: "Community Member",
    desc: "Looking for benefits, resources, or support for myself or my family",
    Icon: Heart,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "youth",
    label: "Student / Young Adult",
    desc: "Exploring careers, learning trades, or navigating school and college",
    Icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "chw",
    label: "CHW / Peer Mentor / Promotora",
    desc: "I walk alongside families in my community — paid or unpaid, credentialed or not",
    Icon: Users,
    gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "grant",
    label: "Grant Writer / Org Leader",
    desc: "I write proposals, manage programs, or lead a nonprofit or agency",
    Icon: FileText,
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "org",
    label: "Partner Organization",
    desc: "My org is part of the ThriveUp coalition or ecosystem",
    Icon: Briefcase,
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "admin",
    label: "Platform Admin / Staff",
    desc: "I operate or manage ThriveUp tools, data, and workflows",
    Icon: Shield,
    gradient: "from-slate-500 to-slate-700",
  },
];

interface HubOnrampProps {
  onSelect: (role: HubRole) => void;
  onDismiss: () => void;
}

export function HubOnramp({ onSelect, onDismiss }: HubOnrampProps) {
  return (
    <div className="fixed inset-0 z-[200] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
      <div
        className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        data-testid="modal-onramp"
      >
        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-t-3xl px-6 pt-6 pb-5 relative">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            data-testid="button-onramp-dismiss"
            aria-label="Skip for now"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <h2 className="text-xl font-bold text-white pr-10">Welcome to ThriveUp</h2>
          <p className="text-white/80 text-sm mt-1 leading-relaxed">
            Which best describes you? This personalizes your hub — no account needed, change it anytime.
          </p>
        </div>

        <div className="p-3 space-y-2">
          {ROLE_OPTIONS.map(({ id, label, desc, Icon, gradient }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-primary/40 hover:bg-muted/60 transition-all text-left active:scale-[0.98] group"
              data-testid={`button-role-${id}`}
            >
              <div className={cn(
                "w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm",
                gradient,
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-muted-foreground text-[11px] mt-0.5 leading-snug">{desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground flex-shrink-0" />
            </button>
          ))}

          <p className="text-center text-[11px] text-muted-foreground pt-1 pb-2">
            Shadow workers are welcome here. No credentials checked.
          </p>
        </div>
      </div>
    </div>
  );
}
